const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const settingsController = require('../controllers/settingsController');

// Profile
router.get('/profile', protect, settingsController.getProfile);
router.put('/profile', protect, settingsController.updateProfile);

// Facilities
router.route('/facilities')
    .get(protect, settingsController.getFacilities)
    .post(protect, settingsController.createFacility);
router.route('/facilities/:id')
    .put(protect, settingsController.updateFacility)
    .delete(protect, settingsController.deleteFacility);

// Pickup Locations
router.route('/pickup-locations')
    .get(protect, settingsController.getPickupLocations)
    .post(protect, settingsController.createPickupLocation);
router.route('/pickup-locations/:id')
    .put(protect, settingsController.updatePickupLocation)
    .delete(protect, settingsController.deletePickupLocation);

// Vehicle Types
router.route('/vehicle-types')
    .get(protect, settingsController.getVehicleTypes)
    .post(protect, settingsController.createVehicleType);
router.route('/vehicle-types/:id')
    .put(protect, settingsController.updateVehicleType)
    .delete(protect, settingsController.deleteVehicleType);

module.exports = router;

