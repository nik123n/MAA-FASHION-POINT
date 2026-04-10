const express = require('express');
const router = express.Router();
const { getRecommendations } = require('../controllers/recommendationController');

// Add protect middleware if user specific ONLY
router.get('/', getRecommendations);

module.exports = router;
