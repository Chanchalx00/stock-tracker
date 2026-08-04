const express = require('express');
const router = express.Router();
const { getPortfolio, addHolding, deleteHolding } = require('../controllers/portfolio.controller');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Portfolio
 *   description: Holdings and live profit & loss.
 */

router.use(protect);

/**
 * @swagger
 * /api/portfolio:
 *   get:
 *     summary: Get holdings enriched with live prices and P&L, plus a summary
 *     tags: [Portfolio]
 *     responses:
 *       200:
 *         description: Holdings and summary.
 *   post:
 *     summary: Add a holding
 *     tags: [Portfolio]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [symbol, quantity, buyPrice]
 *             properties:
 *               symbol: { type: string, example: "HDFCBANK.NS" }
 *               quantity: { type: number, example: 10 }
 *               buyPrice: { type: number, example: 1550.5 }
 *               companyName: { type: string, example: "HDFC Bank Ltd." }
 *     responses:
 *       201:
 *         description: Holding added.
 *       400:
 *         description: Missing/invalid fields.
 */
router.get('/', getPortfolio);
router.post('/', addHolding);

/**
 * @swagger
 * /api/portfolio/{id}:
 *   delete:
 *     summary: Remove a holding
 *     tags: [Portfolio]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Removed.
 *       404:
 *         description: Holding not found.
 */
router.delete('/:id', deleteHolding);

module.exports = router;
