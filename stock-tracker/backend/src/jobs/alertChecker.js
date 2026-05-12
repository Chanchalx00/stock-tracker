const cron = require('node-cron');
const Alert = require('../models/Alert');
const { getQuote } = require('../services/stockService');

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
        }
      })
    );

    const updates = [];
    for (const alert of activeAlerts) {
      const price = quotes[alert.symbol];
      if (price === undefined) continue;

      const triggered =
        (alert.condition === 'GREATER_THAN' && price > alert.targetPrice) ||
        (alert.condition === 'LESS_THAN' && price < alert.targetPrice);

      if (triggered) {
        updates.push(
          Alert.findByIdAndUpdate(alert._id, {
            isTriggered: true,
            triggeredAt: new Date(),
            triggeredPrice: price,
          })
        );
      
      }
    }

    await Promise.all(updates);
  } catch (error) {
    console.error('[AlertChecker] Error:', error.message);
  }
};

const startAlertChecker = () => {
  cron.schedule('*/5 * * * *', checkAlerts);
  console.log('[AlertChecker] Started — runs every 5 minutes');
};

module.exports = { startAlertChecker };