// routes/externalDataRoutes.js
const express = require('express');
const router = express.Router();
const { getGlobalSustainabilityDashboard } = require('../controllers/externalDataController');

// Main global sustainability endpoint
router.get('/dashboard', getGlobalSustainabilityDashboard);

module.exports = router;