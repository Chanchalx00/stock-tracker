const Alert = require('../models/Alert');

// GET /api/alerts
exports.getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/alerts
exports.createAlert = async (req, res) => {
  try {
    const { symbol, condition, targetPrice } = req.body;

    if (!symbol || !condition || targetPrice === undefined)
      return res.status(400).json({ success: false, message: 'All fields are required.' });

    if (!['GREATER_THAN', 'LESS_THAN'].includes(condition))
      return res.status(400).json({ success: false, message: 'Condition must be GREATER_THAN or LESS_THAN.' });

    const alert = await Alert.create({
      userId: req.user._id,
      symbol: symbol.toUpperCase(),
      condition,
      targetPrice,
    });
    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/alerts/:id
exports.deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });
    res.status(200).json({ success: true, message: 'Alert deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};