const Holding = require('../models/Holding');
const { getQuote } = require('../services/stockService');
const { ApiError } = require('../utils/ApiError');
const { ApiResponse } = require('../utils/ApiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

// GET /api/portfolio
exports.getPortfolio = asyncHandler(async (req, res) => {
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
        const investedValue = (h.buyPrice || 0) * (h.quantity || 0);
        return {
          ...h._doc,
          currentPrice: null,
          currentValue: null,
          investedValue: +investedValue.toFixed(2),
          pnl: null,
          pnlPercent: null,
          percentChange: null,
        };
      }
    })
  );

  const totalInvested = enriched.reduce((sum, h) => sum + (h.investedValue || 0), 0);
  const totalCurrent = enriched.reduce((sum, h) => sum + (h.currentValue || 0), 0);
  const totalPnl = totalCurrent - totalInvested;

  res.status(200).json(
    new ApiResponse(200, 'Portfolio fetched.', {
      holdings: enriched,
      summary: {
        totalInvested: +totalInvested.toFixed(2),
        totalCurrent: +totalCurrent.toFixed(2),
        totalPnl: +totalPnl.toFixed(2),
        totalPnlPercent: totalInvested ? +((totalPnl / totalInvested) * 100).toFixed(2) : 0,
      },
    }),
  );
});

// POST /api/portfolio
exports.addHolding = asyncHandler(async (req, res) => {
  const { symbol, quantity, buyPrice, companyName } = req.body;

  if (!symbol || !quantity || !buyPrice) {
    throw new ApiError(400, 'Symbol, quantity, and buyPrice are required.');
  }

  const qty = Number(quantity);
  const price = Number(buyPrice);

  if (!Number.isFinite(qty) || qty <= 0) {
    throw new ApiError(400, 'Quantity must be a number greater than 0.');
  }
  if (!Number.isFinite(price) || price <= 0) {
    throw new ApiError(400, 'Buy price must be a number greater than 0.');
  }

  const holding = await Holding.create({
    userId: req.user._id,
    symbol: symbol.toUpperCase(),
    quantity: qty,
    buyPrice: price,
    companyName: companyName || '',
  });
  res.status(201).json(new ApiResponse(201, 'Holding added.', holding));
});

// DELETE /api/portfolio/:id
exports.deleteHolding = asyncHandler(async (req, res) => {
  const holding = await Holding.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!holding) throw new ApiError(404, 'Holding not found.');
  res.status(200).json(new ApiResponse(200, 'Holding removed.'));
});
