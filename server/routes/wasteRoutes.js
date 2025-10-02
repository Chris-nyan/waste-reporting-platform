const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
    createWasteEntry, 
    getWasteEntriesForClient,
    updateWasteEntry,
    deleteWasteEntry
} = require('../controllers/wasteDataController');
const { protect } = require('../middleware/authMiddleware');

const upload = multer({ dest: 'uploads/' });

// Route for creating a new entry (POST)
router.post('/', protect, upload.fields([
    { name: 'wasteImages', maxCount: 5 },
    { name: 'recyclingImages', maxCount: 5 }
]), createWasteEntry);

// This route is now more specific to avoid conflicts. It fetches all entries FOR A CLIENT.
router.get('/client/:clientId', protect, getWasteEntriesForClient);

router.route('/:id')
    .put(protect, updateWasteEntry)
    .delete(protect, deleteWasteEntry);

module.exports = router;

