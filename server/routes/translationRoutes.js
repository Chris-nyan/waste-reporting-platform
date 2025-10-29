const express = require('express');
const router = express.Router();
const { translateText } = require('../controllers/translationController.js');
// const { protect } = require('../middleware/authMiddleware'); // You should add your auth middleware here

// router.post('/', protect, translateText);
router.post('/', translateText); // Using this for now, add protection later

module.exports = router;