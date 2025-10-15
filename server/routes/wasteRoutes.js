const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
    createWasteEntry, 
    getWasteEntriesForClient,
    updateWasteEntry,
    deleteWasteEntry,
    getTemplate,
    bulkCreateWasteEntries,
} = require('../controllers/wasteDataController');
const { protect } = require('../middleware/authMiddleware');

const upload = multer({ dest: 'uploads/' });
const singleUpload = multer({ dest: 'uploads/' }).single('file');

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

// route for generating CSV template
router.get('/template', protect, getTemplate);
// route for handling bulk CSV upload
router.post('/bulk-upload', protect, singleUpload, bulkCreateWasteEntries);

module.exports = router;

