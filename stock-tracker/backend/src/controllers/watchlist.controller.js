const Watchlist = require('../models/Watchlist');
const { ApiError } = require('../utils/ApiError');
const { ApiResponse } = require('../utils/ApiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

// GET /api/watchlist
exports.getWatchlist = asyncHandler(async (req, res) => {
  const items = await Watchlist.find({ userId: req.user._id }).sort({ addedAt: -1 });
  res.status(200).json(new ApiResponse(200, 'Watchlist fetched.', items));
});

// POST /api/watchlist
exports.addToWatchlist = async (req, res, next) => {
  try {
    const { symbol, companyName } = req.body;
    if (!symbol) throw new ApiError(400, 'Symbol is required.');

    const item = await Watchlist.create({
      userId: req.user._id,
      symbol: symbol.toUpperCase(),
      companyName: companyName || '',
    });
    res.status(201).json(new ApiResponse(201, 'Added to watchlist.', item));
  } catch (error) {
    if (error.code === 11000) {
      return next(new ApiError(409, 'Stock already in watchlist.'));
    }
    next(error);
  }
};

// DELETE /api/watchlist/:symbol
exports.removeFromWatchlist = asyncHandler(async (req, res) => {
  const { symbol } = req.params;
  await Watchlist.findOneAndDelete({ userId: req.user._id, symbol: symbol.toUpperCase() });
  res.status(200).json(new ApiResponse(200, 'Removed from watchlist.'));
});
