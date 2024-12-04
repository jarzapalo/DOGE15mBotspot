const TradeManager = require('../../src/trading/tradeManager');
const binanceService = require('../../src/services/binanceService');
const config = require('../../src/config/config');

// Mock binanceService
jest.mock('../../src/services/binanceService');

describe('TradeManager', () => {
  let tradeManager;
  
  beforeEach(() => {
    tradeManager = new TradeManager();
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Position Management', () => {
    test('should not open position when signal strength is insufficient', async () => {
      const mockAnalysis = {
        isOverSold: false,
        emaSignal: { bullish: false },
        volumeSignal: false,
        trendStrength: 0.3,
        maSignals: [{ bullish: false }, { bullish: false }, { bullish: false }],
        currentPrice: 100
      };

      await tradeManager.evaluateNewPosition(mockAnalysis);
      expect(binanceService.placeBuyOrder).not.toHaveBeenCalled();
    });

    test('should open position when signals are strong', async () => {
      const mockAnalysis = {
        isOverSold: true,
        emaSignal: { bullish: true },
        volumeSignal: true,
        trendStrength: 0.8,
        maSignals: [{ bullish: true }, { bullish: true }, { bullish: true }],
        currentPrice: 100
      };

      binanceService.getBalance.mockResolvedValue({ free: 1000 });
      binanceService.placeBuyOrder.mockResolvedValue({ executedQty: 50 });

      await tradeManager.evaluateNewPosition(mockAnalysis);
      expect(binanceService.placeBuyOrder).toHaveBeenCalled();
    });
  });

  describe('Risk Management', () => {
    test('should respect maximum daily loss limit', () => {
      tradeManager.dailyPnL = -config.riskManagement.maxDailyLoss - 0.01;
      expect(tradeManager.canOpenNewPosition()).toBeFalsy();
    });

    test('should handle trailing stops correctly', async () => {
      const position = {
        entryPrice: 100,
        quantity: 50,
        trailingStop: 95,
        initialStop: 94,
        takeProfits: [102, 103, 105],
        filled: 0
      };

      tradeManager.activePositions = [position];
      
      const mockAnalysis = {
        currentPrice: 94,
        emaSignal: { bearish: false }
      };

      await tradeManager.manageActivePositions(mockAnalysis);
      expect(binanceService.placeSellOrder).toHaveBeenCalled();
    });
  });

  describe('Take Profit Management', () => {
    test('should execute partial close at take profit levels', async () => {
      const position = {
        entryPrice: 100,
        quantity: 50,
        trailingStop: 95,
        initialStop: 94,
        takeProfits: [102, 103, 105],
        filled: 0
      };

      tradeManager.activePositions = [position];
      
      const mockAnalysis = {
        currentPrice: 102.5,
        emaSignal: { bearish: false }
      };

      await tradeManager.manageActivePositions(mockAnalysis);
      expect(binanceService.placeSellOrder).toHaveBeenCalled();
    });
  });
});