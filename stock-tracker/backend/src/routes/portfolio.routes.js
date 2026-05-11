const express = require('express');
const router = express.Router();
const { getPortfolio, addHolding, deleteHolding } = require('../controllers/portfolio.controller');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getPortfolio);
router.post('/', addHolding);
router.delete('/:id', deleteHolding);

module.exports = router;