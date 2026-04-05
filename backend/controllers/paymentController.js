const asyncHandler = require('express-async-handler');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { getFirestore } = require('firebase-admin/firestore');
const { sendOrderConfirmationEmail } = require('../services/emailService');

const getDb = () => getFirestore();
const nowIso = () => new Date().toISOString();

const getRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    const error = new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
    error.statusCode = 503;
    throw error;
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Create Razorpay order for payment
// @route POST /api/payments/create-order
// ─────────────────────────────────────────────────────────────────────────────
const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const db = getDb();
  const razorpay = getRazorpayClient();

  const snap = await db.collection('orders').doc(orderId).get();
  if (!snap.exists) {
    res.status(404);
    throw new Error('Order not found');
  }

  const order = { _id: snap.id, ...snap.data() };

  if (order.userId !== req.user._id) {
    res.status(403);
    throw new Error('Not authorized');
  }

  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(order.pricing.total * 100),
    currency: 'INR',
    receipt: order.orderNumber,
    notes: { orderId: order._id, userId: req.user._id },
  });

  // Store razorpay order ID on the order doc
  await snap.ref.update({
    'payment.razorpayOrderId': razorpayOrder.id,
    updatedAt: nowIso(),
  });

  res.json({
    success: true,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Verify Razorpay payment signature
// @route POST /api/payments/verify
// ─────────────────────────────────────────────────────────────────────────────
const verifyPayment = asyncHandler(async (req, res) => {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    res.status(503);
    throw new Error('Razorpay is not configured. Set RAZORPAY_KEY_SECRET.');
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    res.status(400);
    throw new Error('Payment verification failed - invalid signature');
  }

  const db = getDb();
  const ref = db.collection('orders').doc(orderId);
  const snap = await ref.get();

  if (!snap.exists) {
    res.status(404);
    throw new Error('Order not found');
  }

  const order = { _id: snap.id, ...snap.data() };

  const updates = {
    'payment.status': 'paid',
    'payment.razorpayPaymentId': razorpay_payment_id,
    'payment.razorpaySignature': razorpay_signature,
    'payment.paidAt': nowIso(),
    orderStatus: 'confirmed',
    statusHistory: [
      ...(order.statusHistory || []),
      { status: 'confirmed', note: 'Payment received', at: nowIso() },
    ],
    updatedAt: nowIso(),
  };

  await ref.update(updates);
  const updatedOrder = { ...order, ...updates };

  sendOrderConfirmationEmail(updatedOrder).catch((err) =>
    console.error('Email send error:', err.message)
  );

  res.json({ success: true, message: 'Payment verified', order: updatedOrder });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Razorpay webhook handler
// @route POST /api/payments/webhook
// ─────────────────────────────────────────────────────────────────────────────
const handleWebhook = asyncHandler(async (req, res) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return res.status(503).json({ message: 'Razorpay is not configured' });

  const signature = req.headers['x-razorpay-signature'];
  const body = JSON.stringify(req.body);
  const expectedSig = crypto.createHmac('sha256', secret).update(body).digest('hex');

  if (expectedSig !== signature) {
    return res.status(400).json({ message: 'Invalid webhook signature' });
  }

  const { event, payload } = req.body;
  const db = getDb();

  if (event === 'payment.captured' || event === 'payment.failed') {
    const receipt = payload?.payment?.entity?.description;
    if (receipt) {
      const snap = await db.collection('orders').where('orderNumber', '==', receipt).limit(1).get();
      if (!snap.empty) {
        const ref = snap.docs[0].ref;
        const order = snap.docs[0].data();
        if (event === 'payment.captured' && order.payment?.status !== 'paid') {
          await ref.update({
            'payment.status': 'paid',
            orderStatus: 'confirmed',
            updatedAt: nowIso(),
          });
        }
        if (event === 'payment.failed') {
          await ref.update({ 'payment.status': 'failed', updatedAt: nowIso() });
        }
      }
    }
  }

  res.json({ status: 'ok' });
});

module.exports = { createRazorpayOrder, verifyPayment, handleWebhook };
