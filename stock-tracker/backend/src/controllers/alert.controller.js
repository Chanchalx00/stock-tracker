const Alert = require('../models/Alert');
const { ApiError } = require('../utils/ApiError');
const { ApiResponse } = require('../utils/ApiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

// GET /api/alerts
exports.getAlerts = asyncHandler(async (req, res) => {
  const alerts = await Alert.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, 'Alerts fetched.', alerts));
});

// POST /api/alerts
exports.createAlert = asyncHandler(async (req, res) => {
  const { symbol, condition, targetPrice } = req.body;

  if (!symbol || !condition || targetPrice === undefined) {
    throw new ApiError(400, 'All fields are required.');
  }

  if (!['GREATER_THAN', 'LESS_THAN'].includes(condition)) {
    throw new ApiError(400, 'Condition must be GREATER_THAN or LESS_THAN.');
  }

  const price = Number(targetPrice);
  if (!Number.isFinite(price) || price <= 0) {
    throw new ApiError(400, 'Target price must be a number greater than 0.');
  }

  const alert = await Alert.create({
    userId: req.user._id,
    symbol: symbol.toUpperCase(),
    condition,
    targetPrice: price,
  });
  res.status(201).json(new ApiResponse(201, 'Alert created.', alert));
});

// DELETE /api/alerts/:id
exports.deleteAlert = asyncHandler(async (req, res) => {
  const alert = await Alert.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!alert) throw new ApiError(404, 'Alert not found.');
  res.status(200).json(new ApiResponse(200, 'Alert deleted.'));
});
