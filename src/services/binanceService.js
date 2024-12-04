const Binance = require('binance-api-node').default;
const config = require('../config/config');
require('dotenv').config();

class BinanceService {
  constructor() {
    this.client = Binance({
      apiKey: process.env.BINANCE_API_KEY,
      apiSecret: process.env.BINANCE_API_SECRET
    });
  }

  async getCandles() {
    try {
      return await this.client.candles({
        symbol: config.symbol,
        interval: config.timeframe
      });
    } catch (error) {
      throw new Error(`Failed to fetch candles: ${error.message}`);
    }
  }

  async placeBuyOrder(quantity) {
    try {
      return await this.client.order({
        symbol: config.symbol,
        side: 'BUY',
        type: 'MARKET',
        quantity
      });
    } catch (error) {
      throw new Error(`Failed to place buy order: ${error.message}`);
    }
  }

  async placeSellOrder(quantity) {
    try {
      return await this.client.order({
        symbol: config.symbol,
        side: 'SELL',
        type: 'MARKET',
        quantity
      });
    } catch (error) {
      throw new Error(`Failed to place sell order: ${error.message}`);
    }
  }

  async getBalance() {
    try {
      const accountInfo = await this.client.accountInfo();
      return accountInfo.balances.find(b => b.asset === 'USDT');
    } catch (error) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }
}

module.exports = new BinanceService();