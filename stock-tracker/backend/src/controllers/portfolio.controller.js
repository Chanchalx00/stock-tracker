const Holding = require('../models/Holding');
const { getQuote } = require('../services/stockService');

// GET /api/portfolio
exports.getPortfolio = async (req, res) => {
  try {
    const holdings = await Holding.find({ userId: req.user._id });

    const enriched = await Promise.all(
      holdings.map(async (h) => {
        try {
          const quote = await getQuote(h.symbol);
          const currentValue = quote.currentPrice * h.quantity;
          const investedValue = h.buyPrice * h.quantity;
          const pnl = currentValue - investedValue;
          const pnlPercent = ((pnl / investedValue) * 100).toFixed(2);
          return {
            _id: h._id,
            symbol: h.symbol,
            companyName: h.companyName,
            quantity: h.quantity,
            buyPrice: h.buyPrice,
            currentPrice: quote.currentPrice,
            currentValue: +currentValue.toFixed(2),
            investedValue: +investedValue.toFixed(2),
            pnl: +pnl.toFixed(2),
            pnlPercent: +pnlPercent,
            percentChange: quote.percentChange,
          };
        } catch {
          return { ...h._doc, currentPrice: null, pnl: null };
        }
      })
    );

    const totalInvested = enriched.reduce((sum, h) => sum + (h.investedValue || 0), 0);
    const totalCurrent = enriched.reduce((sum, h) => sum + (h.currentValue || 0), 0);
    const totalPnl = totalCurrent - totalInvested;

    res.status(200).json({
      success: true,
      data: {
        holdings: enriched,
        summary: {
          totalInvested: +totalInvested.toFixed(2),
          totalCurrent: +totalCurrent.toFixed(2),
          totalPnl: +totalPnl.toFixed(2),
          totalPnlPercent: totalInvested ? +((totalPnl / totalInvested) * 100).toFixed(2) : 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/portfolio
exports.addHolding = async (req, res) => {
  try {
    const { symbol, quantity, buyPrice, companyName } = req.body;

    if (!symbol || !quantity || !buyPrice)
      return res.status(400).json({ success: false, message: 'Symbol, quantity, and buyPrice are required.' });

    const holding = await Holding.create({
      userId: req.user._id,
      symbol: symbol.toUpperCase(),
      quantity: +quantity,
      buyPrice: +buyPrice,
      companyName: companyName || '',
    });
    res.status(201).json({ success: true, data: holding });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/portfolio/:id
exports.deleteHolding = async (req, res) => {
  try {
    const holding = await Holding.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!holding) return res.status(404).json({ success: false, message: 'Holding not found.' });
    res.status(200).json({ success: true, message: 'Holding removed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};