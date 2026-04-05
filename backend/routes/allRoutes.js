// ── CART ROUTES ───────────────────────────────────────────────────────────────
const express = require('express');
const cartRouter = express.Router();
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../controllers/cartController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

cartRouter.use(protect);
cartRouter.get('/', getCart);
cartRouter.post('/', addToCart);
cartRouter.put('/:itemId', updateCartItem);
cartRouter.delete('/:itemId', removeFromCart);
cartRouter.delete('/', clearCart);

// ── ORDER ROUTES ──────────────────────────────────────────────────────────────
const orderRouter = express.Router();
const {
  placeOrder, getMyOrders, getOrder, getAllOrders, updateOrderStatus, cancelOrder,
} = require('../controllers/orderController');

orderRouter.use(protect);
orderRouter.post('/', placeOrder);
orderRouter.get('/my', getMyOrders);
orderRouter.get('/:id', getOrder);
orderRouter.put('/:id/cancel', cancelOrder);
orderRouter.get('/', adminOnly, getAllOrders);
orderRouter.put('/:id/status', adminOnly, updateOrderStatus);

// ── PAYMENT ROUTES ────────────────────────────────────────────────────────────
const paymentRouter = express.Router();
const { createRazorpayOrder, verifyPayment, handleWebhook } = require('../controllers/paymentController');

paymentRouter.post('/create-order', protect, createRazorpayOrder);
paymentRouter.post('/verify', protect, verifyPayment);
paymentRouter.post('/webhook', handleWebhook); // no auth — Razorpay calls this

// ── ADMIN ROUTES ──────────────────────────────────────────────────────────────
const adminRouter = express.Router();
const { getAnalytics, getUsers, toggleUser, deleteUser, getAdminOrders, addOfflineSale } = require('../controllers/adminController');

adminRouter.use(protect, adminOnly);
adminRouter.get('/analytics', getAnalytics);
adminRouter.get('/users', getUsers);
adminRouter.patch('/users/:id/toggle', toggleUser);
adminRouter.delete('/users/:id', deleteUser);
adminRouter.get('/orders', getAdminOrders);
adminRouter.post('/offline-sale', addOfflineSale);

// ── WISHLIST ROUTES ───────────────────────────────────────────────────────────
const wishlistRouter = express.Router();
const { toggleWishlist, getWishlist } = require('../controllers/wishlistController');

wishlistRouter.use(protect);
wishlistRouter.get('/', getWishlist);
wishlistRouter.post('/toggle', toggleWishlist);

// ── COUPON ROUTES ─────────────────────────────────────────────────────────────
const couponRouter = express.Router();
const { validateCoupon, createCoupon, getCoupons, toggleCoupon } = require('../controllers/couponController');

couponRouter.post('/validate', protect, validateCoupon);
couponRouter.get('/', protect, adminOnly, getCoupons);
couponRouter.post('/', protect, adminOnly, createCoupon);
couponRouter.patch('/:id/toggle', protect, adminOnly, toggleCoupon);

module.exports = { cartRouter, orderRouter, paymentRouter, adminRouter, wishlistRouter, couponRouter };
