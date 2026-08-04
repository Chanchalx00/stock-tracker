const express = require('express');
const router  = express.Router();
const { getMarket, getForStock } = require('../controllers/news.controller');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: News
 *   description: Market and per-stock news headlines.
 */

router.use(protect);

/**
 * @swagger
 * /api/news:
 *   get:
 *     summary: Get top Indian market news headlines
 *     tags: [News]
 *     responses:
 *       200:
 *         description: News list.
 */
router.get('/', getMarket);

/**
 * @swagger
 * /api/news/stock/{symbol}:
 *   get:
 *     summary: Get news headlines for a specific stock
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema: { type: string }
 *         example: RELIANCE.NS
 *       - in: query
 *         name: name
 *         schema: { type: string }
 *         description: Company name, used to improve search relevance.
 *         example: Reliance Industries Ltd.
 *     responses:
 *       200:
 *         description: News list.
 */
router.get('/stock/:symbol', getForStock);

module.exports = router;
