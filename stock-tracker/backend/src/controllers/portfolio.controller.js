const Holding = require('../models/Holding');
const { getQuoteSafe } = require('../services/stockService');
const { ApiError } = require('../utils/ApiError');
const { ApiResponse } = require('../utils/ApiResponse');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireSymbol } = require('../utils/symbol');

exports.getPortfolio = asyncHandler(async (req, res) => {
  const holdings = await Holding.find({ userId: req.user._id });

  const uniqueSymbols = [...new Set(holdings.map((h) => h.symbol))];
  const quotes = new Map();
  await Promise.all(
    uniqueSymbols.map(async (symbol) => {
      quotes.set(symbol, await getQuoteSafe(symbol));
    }),
  );

  const enriched = holdings.map((h) => {
    const quote = quotes.get(h.symbol);
    const investedValue = (h.buyPrice || 0) * (h.quantity || 0);

    const base = {
      _id: h._id,
      symbol: h.symbol,
      companyName: h.companyName,
      quantity: h.quantity,
      buyPrice: h.buyPrice,
      investedValue: +investedValue.toFixed(2),
      createdAt: h.createdAt,
    };

    if (!quote) {
      return {
        ...base,
        currentPrice: null,
        currentValue: null,
        pnl: null,
        pnlPercent: null,
        percentChange: null,
      };
    }

    const currentValue = quote.currentPrice * h.quantity;
    const pnl = currentValue - investedValue;

    return {
      ...base,
      currentPrice: quote.currentPrice,
      currentValue: +currentValue.toFixed(2),
      pnl: +pnl.toFixed(2),
      pnlPercent: investedValue > 0 ? +((pnl / investedValue) * 100).toFixed(2) : 0,
      percentChange: quote.percentChange,
    };
  });

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
        holdingsCount: enriched.length,
      },
    }),
  );
});

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
    symbol: requireSymbol(symbol),
    quantity: qty,
    buyPrice: price,
    companyName: typeof companyName === 'string' ? companyName.trim() : '',
  });
  res.status(201).json(new ApiResponse(201, 'Holding added.', holding));
});

exports.deleteHolding = asyncHandler(async (req, res) => {
  const holding = await Holding.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!holding) throw new ApiError(404, 'Holding not found.');
  res.status(200).json(new ApiResponse(200, 'Holding removed.'));
});
