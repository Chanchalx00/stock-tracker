const express = require('express');
const router = express.Router();
const { search, getStockQuote } = require('../controllers/stock.controller');
const { protect } = require('../middleware/auth');

router.get('/search', protect, search);
router.get('/quote/:symbol', protect, getStockQuote);

module.exports = router;