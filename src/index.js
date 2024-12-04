const tradeManager = require('./trading/tradeManager');
const logger = require('./utils/logger');
require('dotenv').config();

async function startBot() {
  logger.info('Starting DOGE trading bot...');
  
  // Main trading loop
  setInterval(async () => {
    try {
      await tradeManager.evaluatePosition();
    } catch (error) {
      logger.error('Error in trading loop:', error);
    }
  }, 5000); // Check every 5 seconds
}

startBot().catch(error => {
  logger.error('Fatal error:', error);
  process.exit(1);
});