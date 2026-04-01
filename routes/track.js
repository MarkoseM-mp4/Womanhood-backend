const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// GET /api/track?q= — Public search (name, phone, serial)
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a search query'
      });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    const orders = await Order.find({
      $or: [
        { customerName: searchRegex },
        { phoneNumber: searchRegex },
        { serialNumber: searchRegex }
      ]
    })
      .select('serialNumber customerName phoneNumber clothPhoto status dateGiven deliveryDueDate')
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
});

// GET /api/track/:serialNumber — Public single order view
router.get('/:serialNumber', async (req, res) => {
  try {
    const order = await Order.findOne({ serialNumber: req.params.serialNumber })
      .select('serialNumber customerName phoneNumber clothPhoto status dateGiven deliveryDueDate notes');

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

module.exports = router;
