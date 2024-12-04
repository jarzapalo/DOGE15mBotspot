const IndicatorCalculator = require('../../src/utils/indicators');
const config = require('../../src/config/config');

describe('IndicatorCalculator', () => {
  const mockPrices = [10, 11, 12, 11, 10, 9, 8, 9, 10, 11, 12, 13, 14, 15];
  const mockVolumes = [100, 150, 200, 180, 160, 140, 120, 130, 150, 170, 190, 210, 230, 250];
  
  describe('RSI calculations', () => {
    test('should calculate RSI correctly', () => {
      const rsi = IndicatorCalculator.calculateRSI(mockPrices);
      expect(rsi).toBeDefined();
      expect(Array.isArray(rsi)).toBeTruthy();
      expect(rsi[rsi.length - 1]).toBeGreaterThan(0);
      expect(rsi[rsi.length - 1]).toBeLessThan(100);
    });
  });

  describe('EMA calculations', () => {
    test('should detect EMA crossovers correctly', () => {
      const emaData = IndicatorCalculator.calculateEMA(mockPrices);
      expect(emaData.fast).toBeDefined();
      expect(emaData.slow).toBeDefined();
      expect(emaData.crossover).toBeDefined();
      expect(Array.isArray(emaData.crossover)).toBeTruthy();
    });
  });

  describe('Moving Averages', () => {
    test('should calculate Volume Weighted Moving Average', () => {
      const vwma = IndicatorCalculator.calculateVWMA(mockPrices, mockVolumes, 5);
      expect(vwma).toBeDefined();
      expect(Array.isArray(vwma)).toBeTruthy();
      expect(vwma.length).toBe(mockPrices.length - 4);
    });
  });

  describe('Trend Strength', () => {
    test('should calculate trend strength correctly', () => {
      const strength = IndicatorCalculator.calculateTrendStrength(mockPrices);
      expect(strength).toBeGreaterThanOrEqual(0);
      expect(strength).toBeLessThanOrEqual(1);
    });
  });

  describe('Volume Analysis', () => {
    test('should identify significant volume correctly', () => {
      const isSignificant = IndicatorCalculator.isVolumeSignificant(300, 100);
      expect(typeof isSignificant).toBe('boolean');
    });
  });
});