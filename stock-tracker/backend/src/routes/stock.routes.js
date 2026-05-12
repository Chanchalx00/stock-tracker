const express = require('express');
const router  = express.Router();
const {
  getRecommended,
  search,
  getStockQuote,
  validateSymbol,
} = require('../controllers/stock.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/recommended',      getRecommended); 
router.get('/search',           search);            
router.get('/quote/:symbol',    getStockQuote);     
router.get('/validate/:symbol', validateSymbol);    

module.exports = router;