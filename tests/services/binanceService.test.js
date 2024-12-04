const BinanceService = require('../../src/services/binanceService');
const config = require('../../src/config/config');

// Mock the binance-api-node
jest.mock('binance-api-node', () => {
  return {
    default: jest.fn(() => ({
      candles: jest.fn(),
      order: jest.fn(),
      accountInfo: jest.fn()
    }))
  };
});

describe('BinanceService', () => {
  let binanceService;
  
  beforeEach(() => {
    binanceService = new BinanceService();
  });

  describe('Candle Data', () => {
    test('should fetch candles successfully', async () => {
      const mockCandles = [
        { open: '10', high: '11', low: '9', close: '10.5', volume: '1000' }
      ];

      binanceService.client.candles.mockResolvedValue(mockCandles);
      
      const result = await binanceService.getCandles();
      expect(result).toEqual(mockCandles);
      expect(binanceService.client.candles).toHaveBeenCalledWith({
        symbol: config.symbol,
        interval: config.timeframe
      });
    });
  });

  describe('Order Management', () => {
    test('should place buy order successfully', async () => {
      const mockOrder = { orderId: '123', executedQty: '100' };
      binanceService.client.order.mockResolvedValue(mockOrder);
      
      const result = await binanceService.placeBuyOrder(100);
      expect(result).toEqual(mockOrder);
      expect(binanceService.client.order).toHaveBeenCalledWith({
        symbol: config.symbol,
        side: 'BUY',
        type: 'MARKET',
        quantity: 100
      });
    });

    test('should place sell order successfully', async () => {
      const mockOrder = { orderId: '124', executedQty: '100' };
      binanceService.client.order.mockResolvedValue(mockOrder);
      
      const result = await binanceService.placeSellOrder(100);
      expect(result).toEqual(mockOrder);
      expect(binanceService.client.order).toHaveBeenCalledWith({
        symbol: config.symbol,
        side: 'SELL',
        type: 'MARKET',
        quantity: 100
      });
    });
  });

  describe('Account Information', () => {
    test('should fetch balance successfully', async () => {
      const mockAccountInfo = {
        balances: [
          { asset: 'USDT', free: '1000', locked: '0' },
          { asset: 'BTC', free: '1', locked: '0' }
        ]
      };

      binanceService.client.accountInfo.mockResolvedValue(mockAccountInfo);
      
      const result = await binanceService.getBalance();
      expect(result).toEqual(mockAccountInfo.balances[0]);
    });
  });
});