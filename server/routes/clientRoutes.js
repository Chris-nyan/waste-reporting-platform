const express = require('express');
const router = express.Router();
// Ensure getClientById is imported from the controller
const { getClients, createClient, getClientById } = require('../controllers/clientController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getClients)
  .post(protect, createClient);

// It handles requests for a specific client, e.g., /api/clients/some-id
router.route('/:id')
    .get(protect, getClientById);

module.exports = router;

