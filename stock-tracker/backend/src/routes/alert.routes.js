const express = require('express');
const router = express.Router();
const { getAlerts, createAlert, deleteAlert } = require('../controllers/alert.controller');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Alerts
 *   description: Price alerts, checked automatically every 5 minutes.
 */

router.use(protect);

/**
 * @swagger
 * /api/alerts:
 *   get:
 *     summary: Get the user's price alerts (active and triggered)
 *     tags: [Alerts]
 *     responses:
 *       200:
 *         description: Alerts.
 *   post:
 *     summary: Create a price alert
 *     tags: [Alerts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [symbol, condition, targetPrice]
 *             properties:
 *               symbol: { type: string, example: "RELIANCE.NS" }
 *               condition: { type: string, enum: [GREATER_THAN, LESS_THAN] }
 *               targetPrice: { type: number, example: 1300 }
 *     responses:
 *       201:
 *         description: Alert created.
 *       400:
 *         description: Missing/invalid fields.
 */
router.get('/', getAlerts);
router.post('/', createAlert);

/**
 * @swagger
 * /api/alerts/{id}:
 *   delete:
 *     summary: Delete a price alert
 *     tags: [Alerts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted.
 *       404:
 *         description: Alert not found.
 */
router.delete('/:id', deleteAlert);

module.exports = router;
