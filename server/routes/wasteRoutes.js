const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createWasteEntry, getWasteEntriesForClient } = require('../controllers/wasteDataController');
const { protect } = require('../middleware/authMiddleware');

// Configure multer. 'dest' specifies a folder where files will be temporarily saved.
// Make sure you have an 'uploads/' folder in your '/server' directory.
const upload = multer({ dest: 'uploads/' });

// The multer middleware is now added to the POST route.
// It will process the form data before it reaches the controller.
router.post('/', protect, upload.fields([
    { name: 'wasteImages', maxCount: 5 },
    { name: 'recyclingImages', maxCount: 5 }
]), createWasteEntry);

router.get('/:clientId', protect, getWasteEntriesForClient);

module.exports = router;

