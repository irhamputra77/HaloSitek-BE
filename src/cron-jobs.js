/**
 * Cron Jobs
 * Schedule periodic tasks
 */

const cron = require('node-cron');
const { webhookService } = require('./domains/architects/services');

/**
 * Check expired transactions every hour
 * Schedule: At minute 0 of every hour
 */
const checkExpiredTransactions = cron.schedule('0 * * * *', async () => {
  try {
    console.log('⏰ Running expired transactions check...');
    const result = await webhookService.handleExpiredTransactions();
    console.log(`✅ Processed ${result.count} expired transactions`);
  } catch (error) {
    console.error('❌ Cron job failed:', error.message);
  }
});

module.exports = {
  checkExpiredTransactions,
};