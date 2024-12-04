const logger = require('../utils/logger');
const config = require('../config/config');
const binanceService = require('../services/binanceService');
const indicators = require('../utils/indicators');

class TradeManager {
  constructor() {
    this.activePositions = [];
    this.dailyPnL = 0;
    this.lastTradeTime = 0;
    this.dailyTrades = 0;
    this.consecutiveLosses = 0;
  }

  async evaluatePosition() {
    if (Date.now() - this.lastTradeTime < config.riskManagement.cooldownPeriod) {
      return;
    }

    const candles = await binanceService.getCandles();
    const analysis = indicators.analyzeIndicators(candles);
    
    // Check spread filter
    if (analysis.spread > config.filters.spreadLimit) {
      logger.info('Spread too high, skipping trade evaluation');
      return;
    }

    if (this.activePositions.length > 0) {
      await this.manageActivePositions(analysis);
    } else if (this.canOpenNewPosition()) {
      await this.evaluateNewPosition(analysis);
    }
  }

  canOpenNewPosition() {
    return this.dailyPnL > -config.riskManagement.maxDailyLoss &&
           this.activePositions.length < config.riskManagement.positionSizing.maxPositions &&
           this.consecutiveLosses < 3; // Additional safety check
  }

  async evaluateNewPosition(analysis) {
    const bullishSignals = [
      analysis.isOverSold,
      analysis.emaSignal.bullish,
      analysis.volumeSignal,
      analysis.trendStrength > config.filters.trendStrength,
      ...analysis.maSignals.map(ma => ma.bullish)
    ].filter(Boolean).length;

    const totalPossibleSignals = 4 + analysis.maSignals.length;
    const signalStrength = bullishSignals / totalPossibleSignals;

    if (signalStrength >= 0.7) { // Require at least 70% of signals to be bullish
      const balance = await binanceService.getBalance();
      const positionSize = this.calculatePositionSize(balance.free, signalStrength);
      
      try {
        const order = await binanceService.placeBuyOrder(positionSize);
        const position = {
          entryPrice: analysis.currentPrice,
          quantity: order.executedQty,
          trailingStop: analysis.currentPrice * (1 - config.riskManagement.trailingStop),
          initialStop: analysis.currentPrice * (1 - config.riskManagement.initialStop),
          takeProfits: this.calculateTakeProfitLevels(analysis.currentPrice),
          filled: 0 // Tracks how many take-profit levels have been hit
        };
        
        this.activePositions.push(position);
        this.lastTradeTime = Date.now();
        this.dailyTrades++;
        
        logger.info(`Opened position at ${analysis.currentPrice} with ${position.quantity} units`);
      } catch (error) {
        logger.error(`Failed to open position: ${error.message}`);
      }
    }
  }

  calculatePositionSize(balance, signalStrength) {
    const baseSize = balance * config.tradeAmount;
    // Adjust position size based on signal strength and consecutive losses
    const adjustedSize = baseSize * (1 - (this.consecutiveLosses * 0.2)) * signalStrength;
    return Math.min(adjustedSize, baseSize); // Never exceed base position size
  }

  calculateTakeProfitLevels(entryPrice) {
    return [
      entryPrice * (1 + config.riskManagement.takeProfit.level1),
      entryPrice * (1 + config.riskManagement.takeProfit.level2),
      entryPrice * (1 + config.riskManagement.takeProfit.level3)
    ];
  }

  async manageActivePositions(analysis) {
    for (let i = this.activePositions.length - 1; i >= 0; i--) {
      const position = this.activePositions[i];
      const currentPrice = analysis.currentPrice;

      // Update trailing stop
      const newTrailingStop = currentPrice * (1 - config.riskManagement.trailingStop);
      if (newTrailingStop > position.trailingStop) {
        position.trailingStop = newTrailingStop;
      }

      // Check stop conditions
      if (currentPrice <= position.trailingStop || currentPrice <= position.initialStop) {
        await this.closePosition(i, 'Stop loss triggered', currentPrice);
        continue;
      }

      // Check take profit levels
      for (let j = position.filled; j < position.takeProfits.length; j++) {
        if (currentPrice >= position.takeProfits[j]) {
          const portionToClose = 1 / (position.takeProfits.length - position.filled);
          await this.partialClose(i, portionToClose, 'Take profit reached', currentPrice);
          position.filled++;
          break;
        }
      }

      // Check for bearish reversal
      if (analysis.emaSignal.bearish && position.filled > 0) {
        await this.closePosition(i, 'Bearish reversal detected', currentPrice);
      }
    }
  }

  async partialClose(positionIndex, portion, reason, currentPrice) {
    const position = this.activePositions[positionIndex];
    const quantityToClose = position.quantity * portion;

    try {
      await binanceService.placeSellOrder(quantityToClose);
      position.quantity -= quantityToClose;
      
      const pnl = (currentPrice - position.entryPrice) * quantityToClose;
      this.updatePnL(pnl);
      
      logger.info(`Partial close: ${reason}. PnL: ${pnl}`);
    } catch (error) {
      logger.error(`Failed to execute partial close: ${error.message}`);
    }
  }

  async closePosition(positionIndex, reason, currentPrice) {
    const position = this.activePositions[positionIndex];
    
    try {
      await binanceService.placeSellOrder(position.quantity);
      
      const pnl = (currentPrice - position.entryPrice) * position.quantity;
      this.updatePnL(pnl);
      
      logger.info(`Closed position: ${reason}. PnL: ${pnl}`);
      
      this.activePositions.splice(positionIndex, 1);
      this.lastTradeTime = Date.now();
    } catch (error) {
      logger.error(`Failed to close position: ${error.message}`);
    }
  }

  updatePnL(pnl) {
    this.dailyPnL += pnl;
    if (pnl < 0) {
      this.consecutiveLosses++;
    } else {
      this.consecutiveLosses = 0;
    }
  }
}

module.exports = new TradeManager();