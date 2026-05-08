const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  serialNumber: {
    type: String,
    unique: true,
    required: [true, 'Serial number is required']
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  clothPhoto: {
    type: String,
    default: ''
  },
  dateGiven: {
    type: Date,
    default: Date.now
  },
  deliveryDueDate: {
    type: Date,
    required: [true, 'Delivery due date is required']
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['material_collected', 'cutting', 'stitching_in_progress', 'ready_to_collect', 'collected'],
    default: 'material_collected'
  },
  collectedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for search
orderSchema.index({ customerName: 'text', phoneNumber: 'text', serialNumber: 'text' });

// Index for calendar queries
orderSchema.index({ deliveryDueDate: 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);
