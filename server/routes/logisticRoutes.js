const express = require('express');
const router = express.Router();
const { calculateDistance } = require('../controllers/logisticsController');
const { protect } = require('../middleware/authMiddleware');

// This route is protected to prevent abuse of our API key
router.post('/calculate-distance', protect, calculateDistance);

module.exports = router;
