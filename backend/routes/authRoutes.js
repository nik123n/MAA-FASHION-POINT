// ── AUTH ROUTES ───────────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const {
  register, login, getMe, updateProfile,
  updatePassword, addAddress, deleteAddress, resolvePhone
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.get('/resolve-phone', resolvePhone);
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.post('/address', protect, addAddress);
router.delete('/address/:id', protect, deleteAddress);

module.exports = router;
