/**
 * paymentController.js
 *
 * CRITICAL SECURITY FIXES APPLIED:
 * 1. Webhook uses req.rawBody (Buffer) — NOT JSON.stringify(req.body)
 * 2. Webhook uses RAZORPAY_WEBHOOK_SECRET — NOT RAZORPAY_KEY_SECRET
 * 3. Idempotency — webhookEvents collection prevents duplicate processing
 * 4. Stock is deducted ONLY here (after payment confirmed) — not at order placement
 * 5. Cart cleared and coupon usage applied ONLY after payment confirmed
 * 6. Amount verification against Razorpay payment record
 */

const asyncHandler = require('express-async-handler');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { sendOrderConfirmationEmail } = require('../services/emailService');
const { logger } = require('../utils/logger');

const getDb = () => getFirestore();
const nowIso = () => new Date().toISOString();
const toMinorUnits = (amount) => Math.round(Number(amount || 0) * 100);
const toNumber = (v, fb = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fb; };

const createHttpError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const getRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw createHttpError(503, 'Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

// ─────────────────────────────────────────────────────────────────────────────
// Core: Mark order as paid + deduct stock + clear cart + apply coupon
// Called from BOTH verifyPayment AND webhook (idempotent)
// ─────────────────────────────────────────────────────────────────────────────
const markOrderPaidAndFulfill = async ({
  db,
  orderId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  note = 'Payment received',
  paymentAmount,
  paymentStatus = 'captured',
}) => {
  return db.runTransaction(async (transaction) => {
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await transaction.get(orderRef);

    if (!orderSnap.exists) throw createHttpError(404, 'Order not found');

    const order = { _id: orderSnap.id, ...orderSnap.data() };

    // Idempotency: already paid → return early
    if (order.payment?.status === 'paid') {
      return { order, alreadyPaid: true };
    }

    // Validate only pending/reserved orders can be paid
    if (!['pending', 'reserved', 'placed'].includes(order.orderStatus)) {
      throw createHttpError(400, `Cannot pay order in status: ${order.orderStatus}`);
    }

    // Amount verification
    const expectedAmount = toMinorUnits(order.pricing?.total || 0);
    if (paymentAmount !== undefined && paymentAmount !== expectedAmount) {
      logger.error('Payment amount mismatch', {
        orderId,
        expected: expectedAmount,
        received: paymentAmount,
      });
      throw createHttpError(400, 'Payment amount mismatch — potential fraud');
    }

    // Verify razorpay order ID matches
    if (
      order.payment?.razorpayOrderId &&
      razorpayOrderId &&
      order.payment.razorpayOrderId !== razorpayOrderId
    ) {
      throw createHttpError(400, 'Razorpay order ID mismatch');
    }

    const updatedAt = nowIso();

    // ── STOCK DEDUCTION (happens only here, AFTER payment confirmed) ──────────
    const productIds = [...new Set((order.items || []).map((i) => i.productId).filter(Boolean))];
    const productRefs = productIds.map((id) => db.collection('products').doc(id));
    const productSnaps = await Promise.all(productRefs.map((ref) => transaction.get(ref)));
    const productsById = new Map();
    productSnaps.forEach((snap) => {
      if (snap.exists) productsById.set(snap.id, { _id: snap.id, ...snap.data() });
    });

    for (const item of order.items || []) {
      const product = productsById.get(item.productId);
      if (!product) {
        logger.warn('Product not found during stock deduction', { productId: item.productId, orderId });
        continue;
      }

      const quantity = Math.max(1, toNumber(item.quantity, 1));
      const sizes = Array.isArray(product.sizes)
        ? product.sizes.map((s) => ({ size: s?.size || 'Free Size', stock: toNumber(s?.stock, 0) }))
        : [];
      const sizeIdx = sizes.findIndex((s) => s.size === item.size);

      if (sizeIdx === -1 || sizes[sizeIdx].stock < quantity) {
        // Stock may have been depleted between order placement and payment
        logger.warn('Out of stock at payment time', {
          product: product.name,
          size: item.size,
          orderId,
        });
        // Continue — don't block payment; admin must handle manually
        continue;
      }

      sizes[sizeIdx] = { ...sizes[sizeIdx], stock: sizes[sizeIdx].stock - quantity };
      const totalStock = sizes.reduce((s, sz) => s + toNumber(sz.stock, 0), 0);

      transaction.update(db.collection('products').doc(item.productId), {
        sizes,
        sold: FieldValue.increment(quantity),
        totalStock,
        updatedAt,
      });
    }

    // ── COUPON USAGE (applied here, AFTER payment) ────────────────────────────
    if (order.coupon?.code) {
      const couponSnap = await transaction.get(
        db.collection('coupons').where('code', '==', order.coupon.code).limit(1)
      );
      if (!couponSnap.empty) {
        transaction.update(couponSnap.docs[0].ref, {
          usedCount: FieldValue.increment(1),
          usedBy: FieldValue.arrayUnion(order.userId),
          updatedAt,
        });
      }
    }

    // ── CLEAR CART ────────────────────────────────────────────────────────────
    const cartRef = db.collection('carts').doc(order.userId);
    transaction.set(cartRef, { user: order.userId, items: [], updatedAt }, { merge: true });

    // ── UPDATE ORDER ──────────────────────────────────────────────────────────
    const updates = {
      'payment.status': 'paid',
      'payment.razorpayOrderId': razorpayOrderId || order.payment?.razorpayOrderId || '',
      'payment.razorpayPaymentId': razorpayPaymentId || '',
      'payment.razorpaySignature': razorpaySignature || '',
      'payment.amount': order.pricing?.total || 0,
      'payment.currency': order.payment?.currency || 'INR',
      'payment.gatewayStatus': paymentStatus,
      'payment.paidAt': updatedAt,
      orderStatus: 'confirmed',
      statusHistory: [
        ...(order.statusHistory || []),
        { status: 'confirmed', note, at: updatedAt },
      ],
      updatedAt,
    };

    transaction.update(orderRef, updates);
    return { order: { ...order, ...updates }, alreadyPaid: false };
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Create Razorpay order for payment (step 2 of payment flow)
// @route POST /api/v1/payments/create-order
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

  if (order.orderStatus === 'cancelled') {
    res.status(400);
    throw new Error('Cancelled orders cannot be paid');
  }

  if (order.payment?.status === 'paid') {
    res.status(400);
    throw new Error('Order is already paid');
  }

  const razorpayOrder = await razorpay.orders.create({
    amount: toMinorUnits(order.pricing?.total || 0),
    currency: 'INR',
    receipt: order.orderNumber,
    notes: { orderId: order._id, userId: req.user._id },
  });

  await snap.ref.update({
    'payment.razorpayOrderId': razorpayOrder.id,
    'payment.amount': order.pricing?.total || 0,
    'payment.currency': razorpayOrder.currency,
    orderStatus: 'reserved',
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
// @desc  Verify payment signature + fulfill order
// @route POST /api/v1/payments/verify
// ─────────────────────────────────────────────────────────────────────────────
const verifyPayment = asyncHandler(async (req, res) => {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    res.status(503);
    throw new Error('Razorpay not configured');
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    res.status(400);
    throw new Error('Payment verification failed — invalid signature');
  }

  const db = getDb();
  const snap = await db.collection('orders').doc(orderId).get();
  if (!snap.exists) { res.status(404); throw new Error('Order not found'); }

  const order = { _id: snap.id, ...snap.data() };
  if (order.userId !== req.user._id) { res.status(403); throw new Error('Not authorized'); }
  if (!order.payment?.razorpayOrderId || order.payment.razorpayOrderId !== razorpay_order_id) {
    res.status(400); throw new Error('Razorpay order mismatch');
  }
  if (order.payment?.status === 'paid') {
    return res.json({ success: true, message: 'Order already paid', order });
  }

  // Fetch payment from Razorpay to verify amount
  const razorpay = getRazorpayClient();
  const payment = await razorpay.payments.fetch(razorpay_payment_id);

  if (!payment || !['authorized', 'captured'].includes(payment.status)) {
    res.status(400);
    throw new Error('Payment not captured');
  }

  const { order: updatedOrder, alreadyPaid } = await markOrderPaidAndFulfill({
    db,
    orderId,
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
    note: 'Payment verified by client',
    paymentAmount: payment.amount,
    paymentStatus: payment.status,
  });

  if (!alreadyPaid) {
    // Update global stats + send email (non-blocking)
    const statsRef = db.collection('statistics').doc('global');
    statsRef.set({
      totalOrders: FieldValue.increment(1),
      totalRevenue: FieldValue.increment(order.pricing?.total || 0),
      updatedAt: nowIso(),
    }, { merge: true }).catch((err) => logger.error('Stats increment failed', { error: err }));

    sendOrderConfirmationEmail(updatedOrder).catch((err) =>
      logger.error('Order email failed', { error: err })
    );
  }

  res.json({ success: true, message: 'Payment verified', order: updatedOrder });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Razorpay webhook — authoritative payment confirmation
// @route POST /api/v1/payments/webhook
//
// CRITICAL SECURITY:
//  - Uses req.rawBody (Buffer) for HMAC — not JSON.stringify(req.body)
//  - Uses RAZORPAY_WEBHOOK_SECRET (separate from key secret)
//  - Idempotency via webhookEvents collection
// ─────────────────────────────────────────────────────────────────────────────
const handleWebhook = asyncHandler(async (req, res) => {
  // ── 1. Webhook secret validation ──────────────────────────────────────────
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.error('RAZORPAY_WEBHOOK_SECRET not configured');
    return res.status(503).json({ message: 'Webhook not configured' });
  }

  // ── 2. Signature verification using RAW body (critical!) ──────────────────
  const signature = req.headers['x-razorpay-signature'];
  if (!signature) {
    return res.status(400).json({ message: 'Missing webhook signature' });
  }

  if (!req.rawBody) {
    logger.error('req.rawBody missing — ensure captureWebhookRawBody middleware is active');
    return res.status(500).json({ message: 'Internal webhook error' });
  }

  const expectedSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(req.rawBody)   // ✅ rawBody Buffer — NOT JSON.stringify(req.body)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(signature))) {
    logger.warn('Invalid webhook signature received');
    return res.status(400).json({ message: 'Invalid webhook signature' });
  }

  const { event, payload } = req.body;
  const db = getDb();

  // ── 3. Idempotency check ──────────────────────────────────────────────────
  const paymentEntity = payload?.payment?.entity;
  const razorpayPaymentId = paymentEntity?.id;
  const razorpayOrderId = paymentEntity?.order_id;

  if (razorpayPaymentId) {
    const eventRef = db.collection('webhookEvents').doc(razorpayPaymentId);
    const eventSnap = await eventRef.get();

    if (eventSnap.exists) {
      logger.info('Duplicate webhook ignored', { paymentId: razorpayPaymentId, event });
      return res.json({ status: 'ok', message: 'Already processed' });
    }

    // Mark as being processed (atomic — use transaction for race conditions)
    await eventRef.set({
      event,
      razorpayPaymentId,
      razorpayOrderId,
      processedAt: nowIso(),
      status: 'processing',
    });
  }

  // ── 4. Handle events ──────────────────────────────────────────────────────
  try {
    if (event === 'payment.captured') {
      if (!razorpayOrderId) {
        logger.warn('Webhook missing order_id', { event, paymentId: razorpayPaymentId });
        return res.json({ status: 'ok' });
      }

      // Find order by razorpayOrderId
      const ordersSnap = await db
        .collection('orders')
        .where('payment.razorpayOrderId', '==', razorpayOrderId)
        .limit(1)
        .get();

      if (ordersSnap.empty) {
        logger.warn('Webhook: no order found for razorpayOrderId', { razorpayOrderId });
        return res.json({ status: 'ok' });
      }

      const orderId = ordersSnap.docs[0].id;

      await markOrderPaidAndFulfill({
        db,
        orderId,
        razorpayOrderId,
        razorpayPaymentId,
        note: 'Payment confirmed via Razorpay webhook',
        paymentAmount: paymentEntity?.amount,
        paymentStatus: 'captured',
      });

      // Update webhook event status
      if (razorpayPaymentId) {
        await db.collection('webhookEvents').doc(razorpayPaymentId).update({ status: 'completed', orderId });
      }

      logger.info('Webhook: payment.captured processed', { orderId, razorpayPaymentId });

    } else if (event === 'payment.failed') {
      if (razorpayOrderId) {
        const ordersSnap = await db
          .collection('orders')
          .where('payment.razorpayOrderId', '==', razorpayOrderId)
          .limit(1)
          .get();

        if (!ordersSnap.empty) {
          await ordersSnap.docs[0].ref.update({
            'payment.status': 'failed',
            'payment.failedAt': nowIso(),
            orderStatus: 'pending', // revert to pending so user can retry
            updatedAt: nowIso(),
          });
        }
      }

      if (razorpayPaymentId) {
        await db.collection('webhookEvents').doc(razorpayPaymentId).update({ status: 'failed' });
      }

      logger.info('Webhook: payment.failed handled', { razorpayOrderId });
    }
  } catch (err) {
    logger.error('Webhook processing error', { error: err, event });
    if (razorpayPaymentId) {
      await db.collection('webhookEvents').doc(razorpayPaymentId).update({
        status: 'error',
        errorMessage: err.message,
      }).catch(() => {});
    }
    // Always 200 to Razorpay — don't let them retry endlessly
    return res.json({ status: 'ok', error: 'processed with errors' });
  }

  res.json({ status: 'ok' });
});

module.exports = { createRazorpayOrder, verifyPayment, handleWebhook };
