const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validate');
const { createRazorpayOrder, verifyPayment, handleWebhook } = require('../controllers/paymentController');

// Webhook — no auth (Razorpay calls this), but signature verified inside handler
router.post('/webhook', handleWebhook);

// Protected payment routes
router.post('/create-order', verifyFirebaseToken, validate(schemas.createRazorpayOrder), createRazorpayOrder);
router.post('/verify', verifyFirebaseToken, validate(schemas.verifyPayment), verifyPayment);

module.exports = router;
