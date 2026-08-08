const cron = require('node-cron');
const Alert = require('../models/Alert');
const { getQuote } = require('../services/stockService');
const { broadcastAlert } = require('../socket/socketManager');
const logger = require('../utils/logger');

const checkAlerts = async () => {
  try {
    const activeAlerts = await Alert.find({ isTriggered: false });
    if (!activeAlerts.length) return;

    const symbols = [...new Set(activeAlerts.map((a) => a.symbol))];

    const quotes = {};
    await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const quote = await getQuote(symbol);
          quotes[symbol] = quote.currentPrice;
        } catch {
          // One symbol failing to quote shouldn't block checking the rest.
        }
      })
    );

    for (const alert of activeAlerts) {
      const price = quotes[alert.symbol];
      if (price === undefined) continue;

      const triggered =
        (alert.condition === 'GREATER_THAN' && price >= alert.targetPrice) ||
        (alert.condition === 'LESS_THAN' && price <= alert.targetPrice);

      if (triggered) {
        const updated = await Alert.findByIdAndUpdate(
          alert._id,
          {
            isTriggered: true,
            triggeredAt: new Date(),
            triggeredPrice: price,
          },
          { new: true }
        );

        if (updated) {
          logger.info(`Alert triggered for user ${alert.userId}: ${alert.symbol} @ ₹${price}`, { tag: 'ALERT_CHECKER' });
          broadcastAlert(alert.userId, updated);
        }
      }
    }
  } catch (error) {
    logger.error(`AlertChecker error: ${error.message}`, { tag: 'ALERT_CHECKER', stack: error.stack });
  }
};

const startAlertChecker = () => {
  cron.schedule('*/15 * * * * *', checkAlerts);
  logger.info('Started — runs every 15 seconds', { tag: 'ALERT_CHECKER' });
};

module.exports = { startAlertChecker, checkAlerts };