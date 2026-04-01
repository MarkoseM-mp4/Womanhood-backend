const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');

// All order routes are protected
router.use(authMiddleware);

// Helper: upload buffer to Cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'womanhood', resource_type: 'image' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
};

// POST /api/orders — Create order
router.post('/', upload.single('clothPhoto'), async (req, res) => {
  try {
    const { serialNumber, customerName, phoneNumber, deliveryDueDate, notes } = req.body;

    // Check duplicate serial number
    const existing = await Order.findOne({ serialNumber });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An order with this serial number already exists.'
      });
    }

    let clothPhotoUrl = '';

    // Upload image to Cloudinary if provided
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      clothPhotoUrl = result.secure_url;
    }

    const order = await Order.create({
      serialNumber,
      customerName,
      phoneNumber,
      clothPhoto: clothPhotoUrl,
      deliveryDueDate,
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create order'
    });
  }
});

// GET /api/orders/search?q= — Search orders
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      const orders = await Order.find().sort({ createdAt: -1 }).limit(50);
      return res.json({ success: true, orders });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    const orders = await Order.find({
      $or: [
        { customerName: searchRegex },
        { phoneNumber: searchRegex },
        { serialNumber: searchRegex }
      ]
    }).sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
});

// GET /api/orders/:id — Single order detail
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order'
    });
  }
});

// PATCH /api/orders/:id — Edit order fields
router.patch('/:id', upload.single('clothPhoto'), async (req, res) => {
  try {
    const updates = { ...req.body };

    // Upload new image if provided
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      updates.clothPhoto = result.secure_url;
    }

    // Don't allow status update through this route
    delete updates.status;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: 'Order updated successfully',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update order'
    });
  }
});

// PATCH /api/orders/:id/status — Update status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['material_collected', 'cutting', 'stitching_in_progress', 'ready_to_collect', 'collected'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const updateData = { status };

    // Set collectedAt when status changes to 'collected'
    if (status === 'collected') {
      updateData.collectedAt = new Date();
    } else {
      updateData.collectedAt = null;
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update status'
    });
  }
});

// DELETE /api/orders/:id — Delete order
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete order'
    });
  }
});

module.exports = router;
