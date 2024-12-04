const { RSI, EMA, SMA, VOLUME, BollingerBands } = require('technicalindicators');
const config = require('../config/config');

class IndicatorCalculator {
  calculateRSI(prices) {
    return RSI.calculate({
      values: prices,
      period: config.indicators.rsi.period
    });
  }

  calculateEMA(prices) {
    const fastEMA = EMA.calculate({
      values: prices,
      period: config.indicators.ema.fastPeriod
    });
    
    const slowEMA = EMA.calculate({
      values: prices,
      period: config.indicators.ema.slowPeriod
    });
    
    return {
      fast: fastEMA,
      slow: slowEMA,
      crossover: this.detectCrossover(fastEMA, slowEMA)
    };
  }

  calculateMAs(prices, volumes) {
    return config.indicators.ma.periods.map(period => {
      const values = config.indicators.ma.volumeWeight
        ? this.calculateVWMA(prices, volumes, period)
        : SMA.calculate({ values: prices, period });
      
      return {
        period,
        values
      };
    });
  }

  calculateVWMA(prices, volumes, period) {
    const vwma = [];
    for (let i = period - 1; i < prices.length; i++) {
      let sumPV = 0;
      let sumV = 0;
      for (let j = 0; j < period; j++) {
        sumPV += prices[i - j] * volumes[i - j];
        sumV += volumes[i - j];
      }
      vwma.push(sumPV / sumV);
    }
    return vwma;
  }

  calculateVolatility(prices) {
    const bb = BollingerBands.calculate({
      period: config.indicators.volatility.period,
      values: prices,
      stdDev: config.indicators.volatility.threshold
    });
    return bb;
  }

  detectCrossover(fastEMA, slowEMA) {
    const crossovers = [];
    for (let i = 1; i < fastEMA.length; i++) {
      if (fastEMA[i] > slowEMA[i] && fastEMA[i - 1] <= slowEMA[i - 1]) {
        crossovers.push({ type: 'bullish', index: i });
      } else if (fastEMA[i] < slowEMA[i] && fastEMA[i - 1] >= slowEMA[i - 1]) {
        crossovers.push({ type: 'bearish', index: i });
      }
    }
    return crossovers;
  }

  isVolumeSignificant(currentVolume, averageVolume) {
    return currentVolume > (averageVolume * config.indicators.volume.threshold) &&
           currentVolume > config.filters.minimumVolume;
  }

  calculateTrendStrength(prices, period = 20) {
    const changes = prices.slice(-period).map((price, i, arr) => 
      i > 0 ? (price - arr[i-1]) / arr[i-1] : 0
    );
    const positiveChanges = changes.filter(change => change > 0).length;
    return positiveChanges / period;
  }

  analyzeIndicators(candles) {
    const prices = candles.map(candle => parseFloat(candle.close));
    const volumes = candles.map(candle => parseFloat(candle.volume));
    
    const rsi = this.calculateRSI(prices);
    const emaData = this.calculateEMA(prices);
    const mas = this.calculateMAs(prices, volumes);
    const volatility = this.calculateVolatility(prices);
    
    const currentRSI = rsi[rsi.length - 1];
    const currentPrice = prices[prices.length - 1];
    const trendStrength = this.calculateTrendStrength(prices);
    
    const averageVolume = volumes
      .slice(-config.indicators.volume.lookbackPeriods)
      .reduce((a, b) => a + b, 0) / config.indicators.volume.lookbackPeriods;
    const currentVolume = volumes[volumes.length - 1];
    
    return {
      isOverBought: currentRSI > config.indicators.rsi.overbought,
      isOverSold: currentRSI < config.indicators.rsi.oversold,
      emaSignal: {
        bullish: emaData.crossover.filter(c => c.type === 'bullish').length > 0,
        bearish: emaData.crossover.filter(c => c.type === 'bearish').length > 0
      },
      maSignals: mas.map(ma => ({
        period: ma.period,
        bullish: currentPrice > ma.values[ma.values.length - 1]
      })),
      volumeSignal: this.isVolumeSignificant(currentVolume, averageVolume),
      volatility: volatility[volatility.length - 1],
      trendStrength,
      currentPrice,
      spread: (candles[candles.length - 1].high - candles[candles.length - 1].low) / currentPrice
    };
  }
}

module.exports = new IndicatorCalculator();