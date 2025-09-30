const express = require('express');
const router = express.Router();
const { getTenantDashboard, getSuperAdminDashboard } = require('../controllers/dashboardController');
const { protect, protectSuperAdmin } = require('../middleware/authMiddleware');

// Route for tenant users (ADMIN, MEMBER)
router.get('/tenant', protect, getTenantDashboard);

// Route for the Super Admin
// Note how we chain the middleware: first protect, then check for super admin role
router.get('/superadmin', protect, protectSuperAdmin, getSuperAdminDashboard);

module.exports = router;
