const Watchlist = require('../models/Watchlist');

// GET /api/watchlist
exports.getWatchlist = async (req, res) => {
  try {
    const items = await Watchlist.find({ userId: req.user._id }).sort({ addedAt: -1 });
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/watchlist
exports.addToWatchlist = async (req, res) => {
  try {
    const { symbol, companyName } = req.body;
    if (!symbol) return res.status(400).json({ success: false, message: 'Symbol is required.' });

    const item = await Watchlist.create({
      userId: req.user._id,
      symbol: symbol.toUpperCase(),
      companyName: companyName || '',
    });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    if (error.code === 11000)
      return res.status(409).json({ success: false, message: 'Stock already in watchlist.' });
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/watchlist/:symbol
exports.removeFromWatchlist = async (req, res) => {
  try {
    const { symbol } = req.params;
    await Watchlist.findOneAndDelete({ userId: req.user._id, symbol: symbol.toUpperCase() });
    res.status(200).json({ success: true, message: 'Removed from watchlist.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};