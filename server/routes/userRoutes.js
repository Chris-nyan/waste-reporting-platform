const express = require('express');
const router = express.Router();
const {
    getTenantUsers,
    createTenantUser,
    updateTenantUser,
    deleteTenantUser,
} = require('../controllers/userManagementController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected and will be checked for ADMIN role inside the controller
router.route('/')
    .get(protect, getTenantUsers)
    .post(protect, createTenantUser);

router.route('/:id')
    .put(protect, updateTenantUser)
    .delete(protect, deleteTenantUser);

module.exports = router;

