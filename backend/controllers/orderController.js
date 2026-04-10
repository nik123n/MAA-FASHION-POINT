/**
 * orderController.js
 *
 * SECURITY CHANGES:
 * 1. Strict Order State Machine — invalid transitions blocked
 * 2. For Razorpay orders: stock NOT deducted at placement (deducted in paymentController after webhook)
 * 3. For COD orders: stock deducted immediately at placement (no payment awaited)
 * 4. Coupon usage tracked ONLY after payment (for Razorpay) — not at order placement
 * 5. All inputs validated before reaching this controller
 */

const asyncHandler = require('express-async-handler');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { randomUUID } = require('crypto');
const { sendLowStockAlert } = require('../services/emailService');
const { normalizeAddress, isCompleteAddress } = require('../utils/address');
const { clearProductCaches } = require('../utils/cache');
const { logger } = require('../utils/logger');

const getDb = () => getFirestore();
const nowIso = () => new Date().toISOString();
const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const createHttpError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

// ─────────────────────────────────────────────────────────────────────────────
// ORDER STATE MACHINE — strict valid transitions
// ─────────────────────────────────────────────────────────────────────────────
const ORDER_TRANSITIONS = {
  pending:    ['reserved', 'cancelled'],
  reserved:   ['confirmed', 'cancelled'],
  placed:     ['confirmed', 'cancelled'],      // legacy alias
  confirmed:  ['processing', 'cancelled', 'refunded'],
  processing: ['shipped', 'cancelled'],
  shipped:    ['delivered', 'cancelled'],
  delivered:  ['refunded'],
  cancelled:  [],                              // terminal
  refunded:   [],                              // terminal
};

const isValidTransition = (from, to) => {
  const allowed = ORDER_TRANSITIONS[from] || [];
  return allowed.includes(to);
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const generateOrderNumber = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `MFP-${ts}-${rand}`;
};

const buildOrderQuery = ({ db, status, userId }) => {
  let query = db.collection('orders');
  if (userId) query = query.where('userId', '==', userId);
  if (status && status !== 'all') query = query.where('orderStatus', '==', status);
  return query.orderBy('createdAt', 'desc');
};

const paginateOrders = async ({ db, status, userId, page = 1, limit = 20, cursor }) => {
  const pageNumber = Math.max(1, Number(page) || 1);
  const limitNumber = Math.min(100, Math.max(1, Number(limit) || 20));
  const baseQuery = buildOrderQuery({ db, status, userId });

  let total = null;
  try {
    const countSnapshot = await baseQuery.count().get();
    total = countSnapshot.data().count;
  } catch (_) { total = null; }

  let query = baseQuery;
  if (cursor) {
    const cursorSnap = await db.collection('orders').doc(String(cursor)).get();
    if (cursorSnap.exists) query = query.startAfter(cursorSnap);
  } else if (pageNumber > 1) {
    query = query.offset((pageNumber - 1) * limitNumber);
  }

  const snapshot = await query.limit(limitNumber + 1).get();
  const docs = snapshot.docs;
  const hasMore = docs.length > limitNumber;
  const pageDocs = hasMore ? docs.slice(0, limitNumber) : docs;

  return {
    orders: pageDocs.map((doc) => ({ _id: doc.id, ...doc.data() })),
    page: pageNumber,
    limit: limitNumber,
    total,
    pages: total === null ? null : Math.ceil(total / limitNumber),
    nextCursor: hasMore ? pageDocs[pageDocs.length - 1].id : null,
  };
};

const evaluateCoupon = ({ couponDoc, userId, subtotal }) => {
  const coupon = couponDoc.data();
  const now = new Date();

  if (coupon.validFrom && now < new Date(coupon.validFrom)) throw createHttpError(400, 'Coupon is not yet active');
  if (coupon.validUntil && now > new Date(coupon.validUntil)) throw createHttpError(400, 'Coupon has expired');
  if (coupon.usageLimit && toNumber(coupon.usedCount, 0) >= toNumber(coupon.usageLimit, 0)) {
    throw createHttpError(400, 'Coupon usage limit reached');
  }

  const usedBy = Array.isArray(coupon.usedBy) ? coupon.usedBy : [];
  const userLimit = Math.max(1, toNumber(coupon.userLimit, 1));
  const userUsageCount = usedBy.filter((id) => id === userId).length;
  if (userUsageCount >= userLimit) throw createHttpError(400, 'You have already used this coupon');

  const minOrderAmount = toNumber(coupon.minOrderAmount, 0);
  if (subtotal < minOrderAmount) throw createHttpError(400, `Minimum order amount of INR ${minOrderAmount} required`);

  let discount = 0;
  if (coupon.discountType === 'flat') {
    discount = toNumber(coupon.discountValue, 0);
  } else {
    discount = (subtotal * toNumber(coupon.discountValue, 0)) / 100;
    if (coupon.maxDiscount) discount = Math.min(discount, toNumber(coupon.maxDiscount, discount));
  }

  return {
    ref: couponDoc.ref,
    discount: Math.round(Math.max(0, discount)),
    snapshot: {
      code: coupon.code,
      discount: Math.round(Math.max(0, discount)),
      discountType: coupon.discountType || 'flat',
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Place order from cart
// @route POST /api/v1/orders
//
// Stock deduction strategy:
//   COD       → deduct immediately (no payment step)
//   Razorpay  → do NOT deduct; deduction happens in paymentController after webhook
// ─────────────────────────────────────────────────────────────────────────────
const placeOrder = asyncHandler(async (req, res) => {
  const db = getDb();
  const userId = req.user._id;
  const paymentMethod = req.body.paymentMethod === 'cod' ? 'cod' : 'razorpay';
  const shippingAddress = normalizeAddress(req.body.shippingAddress || {});

  if (!isCompleteAddress(shippingAddress)) {
    res.status(400);
    throw new Error('A complete shipping address is required');
  }

  const lowStockItems = [];
  let order;

  try {
    order = await db.runTransaction(async (transaction) => {
      const cartRef = db.collection('carts').doc(userId);
      const cartSnap = await transaction.get(cartRef);

      if (!cartSnap.exists || !Array.isArray(cartSnap.data()?.items) || cartSnap.data().items.length === 0) {
        throw createHttpError(400, 'Cart is empty');
      }

      const cartData = cartSnap.data();
      const cartItems = cartData.items;
      const productIds = [...new Set(cartItems.map((item) => item.productId).filter(Boolean))];
      if (productIds.length === 0) throw createHttpError(400, 'Cart is empty');

      const productRefs = productIds.map((id) => db.collection('products').doc(id));
      const productSnapshots = await Promise.all(productRefs.map((ref) => transaction.get(ref)));
      const productsById = new Map();
      productSnapshots.forEach((snap) => {
        if (snap.exists) productsById.set(snap.id, { _id: snap.id, ...snap.data() });
      });

      const orderItems = [];
      const productUpdates = new Map(); // Only used for COD

      for (const item of cartItems) {
        const product = productsById.get(item.productId);
        if (!product) throw createHttpError(400, `Product not found: ${item.productId}`);

        const quantity = Math.max(1, toNumber(item.quantity, 1));
        const sizes = Array.isArray(product.sizes)
          ? product.sizes.map((s) => ({ size: s?.size || 'Free Size', stock: toNumber(s?.stock, 0) }))
          : [];
        const sizeIndex = sizes.findIndex((s) => s.size === item.size);

        // Always check stock availability
        if (sizeIndex === -1 || sizes[sizeIndex].stock < quantity) {
          throw createHttpError(400, `${product.name} (${item.size}) is out of stock`);
        }

        // For COD: deduct stock right away
        if (paymentMethod === 'cod') {
          sizes[sizeIndex] = { ...sizes[sizeIndex], stock: sizes[sizeIndex].stock - quantity };
          const totalStock = sizes.reduce((sum, s) => sum + toNumber(s.stock, 0), 0);
          productUpdates.set(item.productId, {
            ref: db.collection('products').doc(item.productId),
            sizes,
            sold: toNumber(product.sold, 0) + quantity,
            totalStock,
            name: product.name || '',
            size: item.size || '',
            remainingStock: sizes[sizeIndex].stock,
          });
        }
        // For Razorpay: do NOT deduct stock here → will be deducted in paymentController webhook

        orderItems.push({
          productId: product._id,
          name: product.name || '',
          image: product.images?.[0]?.url || '',
          size: item.size || '',
          color: item.color || '',
          quantity,
          price: toNumber(item.price, toNumber(product.discountedPrice, toNumber(product.price, 0))),
        });
      }

      const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const shipping = subtotal > 999 ? 0 : 79;
      const tax = Math.round(subtotal * 0.05);

      let coupon = null;
      const couponCode = String(req.body?.coupon?.code || '').trim().toUpperCase();

      if (couponCode) {
        const couponQuery = db.collection('coupons').where('code', '==', couponCode).where('isActive', '==', true).limit(1);
        const couponSnapshot = await transaction.get(couponQuery);
        if (couponSnapshot.empty) throw createHttpError(400, 'Invalid coupon code');
        coupon = evaluateCoupon({ couponDoc: couponSnapshot.docs[0], userId, subtotal });
      }

      const discount = coupon?.discount || 0;
      const total = Math.max(0, subtotal + shipping + tax - discount);
      const createdAt = nowIso();
      const orderId = randomUUID();

      // Initial status differs by payment method
      const initialStatus = paymentMethod === 'cod' ? 'confirmed' : 'pending';
      const initialNote = paymentMethod === 'cod' ? 'Cash on delivery order placed' : 'Order created, awaiting payment';

      const nextOrder = {
        _id: orderId,
        orderNumber: generateOrderNumber(),
        userId,
        user: { _id: userId, name: req.user.name || '', email: req.user.email || '' },
        items: orderItems,
        shippingAddress,
        pricing: { subtotal, shipping, discount, tax, total },
        coupon: coupon ? coupon.snapshot : null,
        payment: {
          method: paymentMethod,
          status: paymentMethod === 'cod' ? 'pending' : 'awaiting',
          amount: total,
          currency: 'INR',
        },
        orderStatus: initialStatus,
        source: 'online',
        type: 'online',
        statusHistory: [{ status: initialStatus, note: initialNote, at: createdAt }],
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt,
        updatedAt: createdAt,
      };

      transaction.set(db.collection('orders').doc(orderId), nextOrder);

      // COD: update stock + coupon + clear cart inside transaction
      if (paymentMethod === 'cod') {
        for (const productUpdate of productUpdates.values()) {
          transaction.update(productUpdate.ref, {
            sizes: productUpdate.sizes,
            sold: productUpdate.sold,
            totalStock: productUpdate.totalStock,
            updatedAt: createdAt,
          });
          if (productUpdate.remainingStock < 5) {
            lowStockItems.push({ name: productUpdate.name, size: productUpdate.size, stock: productUpdate.remainingStock });
          }
        }

        if (coupon) {
          transaction.update(coupon.ref, {
            usedCount: FieldValue.increment(1),
            usedBy: FieldValue.arrayUnion(userId),
            updatedAt: createdAt,
          });
        }

        transaction.set(cartRef, {
          user: userId, items: [], createdAt: cartData.createdAt || createdAt, updatedAt: createdAt,
        });
      }
      // For Razorpay: cart NOT cleared here — cleared by paymentController after webhook

      return nextOrder;
    });
  } catch (error) {
    res.status(error.statusCode || 500);
    throw error;
  }

  // Non-blocking post-commit side effects
  Promise.all([
    clearProductCaches(),
    lowStockItems.length > 0 ? sendLowStockAlert(lowStockItems) : Promise.resolve(),
  ]).catch((err) => logger.error('Post-order side effect failed', { error: err }));

  res.status(201).json({ success: true, order });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get user's own orders
// @route GET /api/v1/orders/my
// ─────────────────────────────────────────────────────────────────────────────
const getMyOrders = asyncHandler(async (req, res) => {
  const db = getDb();
  const data = await paginateOrders({
    db,
    userId: req.user._id,
    page: req.query.page,
    limit: req.query.limit,
    cursor: req.query.cursor,
    status: req.query.status,
  });
  res.json({ success: true, ...data });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get single order (owner or admin)
// @route GET /api/v1/orders/:id
// ─────────────────────────────────────────────────────────────────────────────
const getOrder = asyncHandler(async (req, res) => {
  const db = getDb();
  const snap = await db.collection('orders').doc(req.params.id).get();
  if (!snap.exists) { res.status(404); throw new Error('Order not found'); }

  const order = { _id: snap.id, ...snap.data() };
  if (order.userId !== req.user._id && req.user.role !== 'admin') {
    res.status(403); throw new Error('Not authorized');
  }
  res.json({ success: true, order });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Admin: update order status (with state machine enforcement)
// @route PUT /api/v1/orders/:id/status
// ─────────────────────────────────────────────────────────────────────────────
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const db = getDb();
  const ref = db.collection('orders').doc(req.params.id);
  const snap = await ref.get();
  if (!snap.exists) { res.status(404); throw new Error('Order not found'); }

  const order = snap.data();
  const currentStatus = order.orderStatus;

  // Enforce state machine
  if (!isValidTransition(currentStatus, status)) {
    res.status(400);
    throw new Error(`Invalid status transition: ${currentStatus} → ${status}. Allowed: ${(ORDER_TRANSITIONS[currentStatus] || []).join(', ') || 'none'}`);
  }

  const updatedAt = nowIso();
  const updates = {
    orderStatus: status,
    statusHistory: [...(order.statusHistory || []), { status, note: note || '', at: updatedAt }],
    updatedAt,
  };
  if (status === 'delivered') updates.deliveredAt = updatedAt;
  if (status === 'shipped') updates.shippedAt = updatedAt;
  if (status === 'refunded') updates.refundedAt = updatedAt;

  await ref.update(updates);

  // Audit log for status changes
  await db.collection('auditLogs').add({
    action: 'ORDER_STATUS_UPDATED',
    orderId: req.params.id,
    from: currentStatus,
    to: status,
    performedBy: req.user._id,
    performedByEmail: req.user.email,
    note: note || '',
    timestamp: updatedAt,
  });

  res.json({ success: true, order: { _id: snap.id, ...order, ...updates } });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Cancel order (user) — with stock restore for COD orders
// @route PUT /api/v1/orders/:id/cancel
// ─────────────────────────────────────────────────────────────────────────────
const cancelOrder = asyncHandler(async (req, res) => {
  const db = getDb();
  const userId = req.user._id;
  let updatedOrder;

  try {
    updatedOrder = await db.runTransaction(async (transaction) => {
      const orderRef = db.collection('orders').doc(req.params.id);
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists) throw createHttpError(404, 'Order not found');

      const order = { _id: orderSnap.id, ...orderSnap.data() };
      if (order.userId !== userId) throw createHttpError(403, 'Not authorized');

      // Validate cancellable states via state machine
      if (!isValidTransition(order.orderStatus, 'cancelled')) {
        throw createHttpError(400, `Order cannot be cancelled from status: ${order.orderStatus}`);
      }

      // Only restore stock for COD (Razorpay stock was never deducted if pending)
      const wasPaid = order.payment?.status === 'paid';
      const shouldRestoreStock = order.payment?.method === 'cod' || wasPaid;

      if (shouldRestoreStock) {
        const productRefs = (order.items || []).map((item) => db.collection('products').doc(item.productId));
        const productSnaps = await Promise.all(productRefs.map((ref) => transaction.get(ref)));
        const productsById = new Map();
        productSnaps.forEach((snap) => { if (snap.exists) productsById.set(snap.id, snap.data()); });

        for (const item of order.items || []) {
          const product = productsById.get(item.productId);
          if (!product) continue;

          const quantity = Math.max(1, toNumber(item.quantity, 1));
          const sizes = Array.isArray(product.sizes)
            ? product.sizes.map((s) => ({ size: s?.size || 'Free Size', stock: toNumber(s?.stock, 0) }))
            : [];
          const sizeIndex = sizes.findIndex((s) => s.size === item.size);
          if (sizeIndex === -1) continue;

          sizes[sizeIndex] = { ...sizes[sizeIndex], stock: sizes[sizeIndex].stock + quantity };
          const totalStock = sizes.reduce((s, sz) => s + toNumber(sz.stock, 0), 0);
          transaction.update(db.collection('products').doc(item.productId), {
            sizes,
            sold: Math.max(0, toNumber(product.sold, 0) - quantity),
            totalStock,
            updatedAt: nowIso(),
          });
        }

        // Restore coupon usage for COD orders
        if (order.coupon?.code && !wasPaid) {
          const couponSnap = await transaction.get(
            db.collection('coupons').where('code', '==', order.coupon.code).limit(1)
          );
          if (!couponSnap.empty) {
            transaction.update(couponSnap.docs[0].ref, {
              usedCount: FieldValue.increment(-1),
              updatedAt: nowIso(),
            });
          }
        }
      }

      const updatedAt = nowIso();
      const updates = {
        orderStatus: 'cancelled',
        statusHistory: [...(order.statusHistory || []), {
          status: 'cancelled',
          note: req.body.reason || 'Cancelled by user',
          at: updatedAt,
        }],
        updatedAt,
        cancelledAt: updatedAt,
      };

      transaction.update(orderRef, updates);
      return { ...order, ...updates };
    });
  } catch (error) {
    res.status(error.statusCode || 500);
    throw error;
  }

  clearProductCaches().catch((err) => logger.error('Cache clear after cancel failed', { error: err }));
  res.json({ success: true, order: updatedOrder });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Admin: get all orders
// @route GET /api/v1/orders
// ─────────────────────────────────────────────────────────────────────────────
const getAllOrders = asyncHandler(async (req, res) => {
  const db = getDb();
  const data = await paginateOrders({
    db,
    status: req.query.status,
    page: req.query.page,
    limit: req.query.limit,
    cursor: req.query.cursor,
  });
  res.json({ success: true, ...data });
});

module.exports = {
  placeOrder,
  getMyOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  ORDER_TRANSITIONS,
};
