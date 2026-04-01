const cron = require('node-cron');
const Order = require('../models/Order');

const startCronJobs = () => {
  // Run daily at midnight — delete collected orders older than 2 days
  cron.schedule('0 0 * * *', async () => {
    try {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      const result = await Order.deleteMany({
        status: 'collected',
        collectedAt: { $lt: twoDaysAgo }
      });

      if (result.deletedCount > 0) {
        console.log(`🗑️  Auto-deleted ${result.deletedCount} collected order(s) older than 2 days.`);
      }
    } catch (error) {
      console.error('❌ Cron job error:', error.message);
    }
  });

  console.log('⏰ Cron job scheduled: Auto-delete collected orders daily at midnight');
};

module.exports = { startCronJobs };
