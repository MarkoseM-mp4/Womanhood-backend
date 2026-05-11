const cron = require('node-cron');
const https = require('https');
const Order = require('../models/Order');

const cloudinary = require('../config/cloudinary');

// Helper: delete image from Cloudinary
const deleteFromCloudinary = async (imageUrl) => {
  if (!imageUrl) return;
  try {
    const parts = imageUrl.split('/');
    const folderIndex = parts.indexOf('womanhood');
    if (folderIndex !== -1) {
      const publicIdWithExtension = parts.slice(folderIndex).join('/');
      const lastDotIndex = publicIdWithExtension.lastIndexOf('.');
      const publicId = lastDotIndex !== -1 ? publicIdWithExtension.substring(0, lastDotIndex) : publicIdWithExtension;
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    }
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};

const startCronJobs = () => {
  // Run every minute — delete collected orders older than 2 minutes
  cron.schedule('* * * * *', async () => {
    try {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      // Find orders to delete first so we can remove their images
      const ordersToDelete = await Order.find({
        status: 'collected',
        collectedAt: { $lt: twoDaysAgo }
      });

      if (ordersToDelete.length === 0) return;

      // Clean up Cloudinary storage to prevent leaks
      for (const order of ordersToDelete) {
        if (order.clothPhoto) {
          await deleteFromCloudinary(order.clothPhoto);
        }
      }

      // Delete from Database
      const idsToDelete = ordersToDelete.map(o => o._id);
      const result = await Order.deleteMany({ _id: { $in: idsToDelete } });

      if (result.deletedCount > 0) {
        console.log(`🗑️  Auto-deleted ${result.deletedCount} collected order(s) older than 2 days.`);
      }
    } catch (error) {
      console.error('❌ Cron job error:', error.message);
    }
  });

  console.log('⏰ Cron job scheduled: Auto-delete collected orders every minute (checking for > 2 days old)');

  // Keep Render server awake by pinging it every 14 minutes
  cron.schedule('*/14 * * * *', () => {
    https.get('https://womanhood-backend.onrender.com/api/health', (res) => {
      console.log(`💓 Keep-alive ping successful. Status: ${res.statusCode}`);
    }).on('error', (e) => {
      console.error(`💥 Keep-alive ping failed: ${e.message}`);
    });
  });
  
  console.log('⏰ Cron job scheduled: Keep-alive ping every 14 minutes');
};

module.exports = { startCronJobs };
