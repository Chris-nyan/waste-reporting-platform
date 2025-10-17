const express = require('express');
const router = express.Router();
const { createRecyclingProcess } = require('../controllers/recyclingProcessController');
const { protect } = require('../middleware/authMiddleware');

// Route for creating a new recycling process entry
router.post('/', protect, createRecyclingProcess);

module.exports = router;

