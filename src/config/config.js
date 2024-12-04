const config = {
  symbol: 'DOGEUSDT',
  timeframe: '15m',
  tradeAmount: 0.05, // 5% of available balance
  indicators: {
    rsi: {
      period: 14,
      overbought: 70,
      oversold: 30,
      confirmationPeriod: 3 // Number of periods to confirm trend
    },
    ema: {
      period: 9,
      fastPeriod: 5,  // Added fast EMA for crossover signals
      slowPeriod: 13  // Added slow EMA for crossover signals
    },
    ma: {
      periods: [20, 30, 50],
      volumeWeight: true // Consider volume-weighted MA
    },
    volume: {
      threshold: 1.5, // Volume should be 1.5x average
      lookbackPeriods: 24 // Increased lookback for better volume analysis
    },
    volatility: {
      period: 14,
      threshold: 2.0 // Standard deviations for volatility filter
    }
  },
  riskManagement: {
    trailingStop: 0.01, // Updated to 1%
    initialStop: 0.015, // Added initial stop loss at 1.5%
    takeProfit: {
      level1: 0.02, // First take profit at 2%
      level2: 0.03, // Second take profit at 3%
      level3: 0.05  // Final take profit at 5%
    },
    maxDailyLoss: 0.10, // 10%
    cooldownPeriod: 5000, // 5 seconds in milliseconds
    positionSizing: {
      scale: true, // Enable position scaling
      maxPositions: 3, // Maximum concurrent scaled positions
      scaleInterval: 0.01 // 1% price movement for scaling
    }
  },
  filters: {
    trendStrength: 0.6, // Minimum trend strength requirement (0-1)
    minimumVolume: 1000, // Minimum USDT volume
    spreadLimit: 0.002 // Maximum allowed spread (0.2%)
  }
};

module.exports = config;