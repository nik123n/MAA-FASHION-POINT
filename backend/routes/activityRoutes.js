const express = require('express');
const router = express.Router();
const { logActivity } = require('../controllers/activityController');
// If you want strictly authenticated users, import protect middleware
const { protect } = require('../middleware/authMiddleware'); // assuming it exists

// We will allow both authenticated and unauthenticated tracking by skipping strictly protect
// Alternatively, use protect to only track logged in users. 
// For now we allow unauthenticated usage (handled in controller)
router.post('/', logActivity);

module.exports = router;
