const express = require('express');
const router = express.Router();
const {
  getIpoAnalysis,
  getStockAnalysis,
  getDeepIpoAnalysis,
  getIpoTrackRecord,
} = require('../controllers/analysis.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/ipo', getIpoAnalysis);
router.get('/ipo/track-record', getIpoTrackRecord);
router.get('/ipo/deep/:symbol', getDeepIpoAnalysis);
router.get('/stock/:symbol', getStockAnalysis);

module.exports = router;
