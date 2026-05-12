const { getQuote, searchSymbol } = require('../services/stockService');

// GET /api/stocks/search?q=AAPL
exports.search = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, message: 'Query param "q" required.' });

    const results = await searchSymbol(q);
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/stocks/quote/:symbol
exports.getStockQuote = async (req, res) => {
  try {
    const { symbol } = req.params;
    const quote = await getQuote(symbol.toUpperCase());
    res.status(200).json({ success: true, data: quote });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};