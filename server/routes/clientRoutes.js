const express = require('express');
const router = express.Router();
const { 
    getClients, 
    createClient, 
    getClientById,
    updateClient,
    deleteClient
} = require('../controllers/clientController');
const { protect } = require('../middleware/authMiddleware');

// Routes for the entire client collection
router.route('/')
  .get(protect, getClients)
  .post(protect, createClient);

// Routes for a specific client by its ID
router.route('/:id')
    .get(protect, getClientById)
    .put(protect, updateClient)
    .delete(protect, deleteClient);

module.exports = router;

