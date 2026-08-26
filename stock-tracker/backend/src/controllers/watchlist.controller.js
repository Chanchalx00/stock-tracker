const Watchlist = require('../models/Watchlist');
const { ApiError } = require('../utils/ApiError');
const { ApiResponse } = require('../utils/ApiResponse');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireSymbol } = require('../utils/symbol');

exports.getWatchlist = asyncHandler(async (req, res) => {
  const items = await Watchlist.find({ userId: req.user._id }).sort({ addedAt: -1 });
  res.status(200).json(new ApiResponse(200, 'Watchlist fetched.', items));
});

exports.addToWatchlist = async (req, res, next) => {
  try {
    const { symbol, companyName } = req.body;

    const item = await Watchlist.create({
      userId: req.user._id,
      symbol: requireSymbol(symbol),
      companyName: typeof companyName === 'string' ? companyName.trim() : '',
    });
    res.status(201).json(new ApiResponse(201, 'Added to watchlist.', item));
  } catch (error) {
    if (error.code === 11000) {
      return next(new ApiError(409, 'Stock already in watchlist.'));
    }
    next(error);
  }
};

exports.removeFromWatchlist = asyncHandler(async (req, res) => {
  const symbol = requireSymbol(req.params.symbol);
  const removed = await Watchlist.findOneAndDelete({ userId: req.user._id, symbol });

  if (!removed) throw new ApiError(404, 'Stock is not in your watchlist.');

  res.status(200).json(new ApiResponse(200, 'Removed from watchlist.'));
});
