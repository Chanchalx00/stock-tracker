const express = require('express');
const router  = express.Router();
const {
  getRecommended,
  getWatchlist,
  search,
  getStockQuote,
  validateSymbol,
  getIndices,
  getStockLogo,
  getStockChart,
} = require('../controllers/stock.controller');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Stocks
 *   description: Live quotes, charts, search, and logos for NSE/BSE symbols.
 */

/**
 * @swagger
 * /api/stocks/logo/{symbol}:
 *   get:
 *     summary: Get a company logo (or a generated initials avatar)
 *     description: Public — always returns an image (real logo, favicon, or a generated SVG fallback), never a JSON error.
 *     tags: [Stocks]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema: { type: string }
 *         example: RELIANCE.NS
 *     responses:
 *       200:
 *         description: Image (PNG/SVG).
 *         content:
 *           image/png: {}
 *           image/svg+xml: {}
 */
// Public: <img> tags can't send our JWT, and a logo image isn't sensitive.
router.get('/logo/:symbol', getStockLogo);

router.use(protect);

/**
 * @swagger
 * /api/stocks/indices:
 *   get:
 *     summary: Get Nifty 50 and Sensex with today's intraday series
 *     tags: [Stocks]
 *     responses:
 *       200:
 *         description: Index quotes and OHLC points.
 */
router.get('/indices', getIndices);

/**
 * @swagger
 * /api/stocks/chart/{symbol}:
 *   get:
 *     summary: Get today's intraday OHLC candles for a symbol
 *     tags: [Stocks]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema: { type: string }
 *         example: TCS.NS
 *     responses:
 *       200:
 *         description: OHLC candle series.
 *       500:
 *         description: No chart data available for this symbol.
 */
router.get('/chart/:symbol', getStockChart);

/**
 * @swagger
 * /api/stocks/recommended:
 *   get:
 *     summary: Get a curated list of large-cap NSE stocks with live quotes and news flags
 *     tags: [Stocks]
 *     responses:
 *       200:
 *         description: List of recommended stocks.
 */
router.get('/recommended', getRecommended);

/**
 * @swagger
 * /api/stocks/watchlist:
 *   get:
 *     summary: Get live quotes for the full Nifty 50 constituent list
 *     tags: [Stocks]
 *     responses:
 *       200:
 *         description: List of quotes.
 */
router.get('/watchlist', getWatchlist);

/**
 * @swagger
 * /api/stocks/search:
 *   get:
 *     summary: Search NSE/BSE symbols by name or ticker
 *     tags: [Stocks]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *         example: infosys
 *     responses:
 *       200:
 *         description: Matching symbols.
 *       400:
 *         description: Missing search query.
 */
router.get('/search', search);

/**
 * @swagger
 * /api/stocks/quote/{symbol}:
 *   get:
 *     summary: Get the current quote for a symbol
 *     tags: [Stocks]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema: { type: string }
 *         example: INFY.NS
 *     responses:
 *       200:
 *         description: Current quote.
 *       404:
 *         description: Symbol not found or has no market data.
 */
router.get('/quote/:symbol', getStockQuote);

/**
 * @swagger
 * /api/stocks/validate/{symbol}:
 *   get:
 *     summary: Check whether a symbol resolves to a real, tradeable stock
 *     description: Always returns 200 — check the `valid` field, not the HTTP status.
 *     tags: [Stocks]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema: { type: string }
 *         example: SBIN.NS
 *     responses:
 *       200:
 *         description: "Validation result: check the valid field (true or false)."
 */
router.get('/validate/:symbol', validateSymbol);

module.exports = router;
