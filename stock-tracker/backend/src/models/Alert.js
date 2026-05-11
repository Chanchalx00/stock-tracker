const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true,
  },
  condition: {
    type: String,
    enum: ['GREATER_THAN', 'LESS_THAN'],
    required: true,
  },
  targetPrice: {
    type: Number,
    required: true,
  },
  isTriggered: {
    type: Boolean,
    default: false,
  },
  triggeredAt: {
    type: Date,
    default: null,
  },
  triggeredPrice: {
    type: Number,
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);