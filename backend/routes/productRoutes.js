const express = require('express');
const router = express.Router();
const {
  getProducts, getProduct, getRecommendations, autocomplete,
  addReview, createProduct, updateProduct, deleteProduct, getHomeProducts,
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { upload, uploadMode } = require('../config/cloudinary');

router.get('/home', getHomeProducts);
router.get('/search/autocomplete', autocomplete);
router.get('/upload-status', protect, adminOnly, (req, res) => {
  res.json({ success: true, enabled: true, mode: uploadMode });
});
router.get('/', getProducts);
router.get('/:id', getProduct);
router.get('/:id/recommendations', getRecommendations);
router.post('/:id/reviews', protect, addReview);
router.post('/', protect, adminOnly, upload.array('images', 6), createProduct);
router.put('/:id', protect, adminOnly, upload.array('images', 6), updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
