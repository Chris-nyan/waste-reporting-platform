const express = require('express');
const router = express.Router();
const {
    getReports,
    generateReport,
    getReportConfigData,
    getWasteTypesForPeriod,
    getReportById,
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

// Main route to get all generated reports
router.get('/', protect, getReports);

// Route to generate a new report
router.post('/generate', protect, generateReport);

// Route to get initial configuration data for the wizard (e.g., client list)
router.get('/config-data', protect, getReportConfigData);

// Route to get available waste types based on client and date range
router.post('/waste-types', protect, getWasteTypesForPeriod);

router.get('/:id', protect, getReportById);

module.exports = router;

