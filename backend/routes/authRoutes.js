const express = require('express');
const router = express.Router();
const {
  register, login, getMe, syncProfile, updateProfile, updatePassword,
  addAddress, updateAddress, deleteAddress,
} = require('../controllers/authController');
const { verifyFirebaseToken } = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validate');

// Public (no auth needed — handled by Firebase client)
router.post('/register', register);
router.post('/login', login);

// Protected — requires valid Firebase ID token
router.get('/me', verifyFirebaseToken, getMe);
router.post('/sync-profile', verifyFirebaseToken, validate(schemas.updateProfile), syncProfile);
router.put('/profile', verifyFirebaseToken, validate(schemas.updateProfile), updateProfile);
router.put('/password', verifyFirebaseToken, updatePassword);

// Address management (via backend, NOT direct Firestore)
router.post('/address', verifyFirebaseToken, validate(schemas.addAddress), addAddress);
router.put('/address/:id', verifyFirebaseToken, validate(schemas.updateAddress), updateAddress);
router.delete('/address/:id', verifyFirebaseToken, deleteAddress);

module.exports = router;
