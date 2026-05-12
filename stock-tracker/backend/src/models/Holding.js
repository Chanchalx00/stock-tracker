const mongoose = require('mongoose');

const holdingSchema = new mongoose.Schema({
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
  companyName: {
    type: String,
    default: '',
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },
  buyPrice: {
    type: Number,
    required: true,
    min: [0, 'Buy price must be positive'],
  },
}, { timestamps: true });

module.exports = mongoose.model('Holding', holdingSchema);