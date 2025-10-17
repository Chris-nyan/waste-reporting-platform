const express = require('express');
const router = express.Router();
const { getMasterData } = require('../controllers/masterDataController');
const { protect } = require('../middleware/authMiddleware');

// This route is protected to ensure only logged-in users can access this data
router.get('/', protect, getMasterData);

module.exports = router;
