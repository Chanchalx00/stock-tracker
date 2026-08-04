const express = require('express');
const router = express.Router();
const { getWatchlist, addToWatchlist, removeFromWatchlist } = require('../controllers/watchlist.controller');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Watchlist
 *   description: The logged-in user's saved stocks.
 */

router.use(protect);

/**
 * @swagger
 * /api/watchlist:
 *   get:
 *     summary: Get the user's watchlist
 *     tags: [Watchlist]
 *     responses:
 *       200:
 *         description: Watchlist items.
 *   post:
 *     summary: Add a stock to the watchlist
 *     tags: [Watchlist]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [symbol]
 *             properties:
 *               symbol: { type: string, example: "TCS.NS" }
 *               companyName: { type: string, example: "Tata Consultancy Services Ltd." }
 *     responses:
 *       201:
 *         description: Added.
 *       409:
 *         description: Stock already in watchlist.
 */
router.get('/', getWatchlist);
router.post('/', addToWatchlist);

/**
 * @swagger
 * /api/watchlist/{symbol}:
 *   delete:
 *     summary: Remove a stock from the watchlist
 *     tags: [Watchlist]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Removed.
 */
router.delete('/:symbol', removeFromWatchlist);

module.exports = router;
