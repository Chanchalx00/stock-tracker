const express = require('express');
const router = express.Router();
const { getWatchlist, addToWatchlist, removeFromWatchlist } = require('../controllers/watchlist.controller');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getWatchlist);
router.post('/', addToWatchlist);
router.delete('/:symbol', removeFromWatchlist);

module.exports = router;