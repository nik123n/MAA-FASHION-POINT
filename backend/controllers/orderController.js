const asyncHandler = require('express-async-handler');
const { getFirestore } = require('firebase-admin/firestore');
const { randomUUID } = require('crypto');

const getDb = () => getFirestore();
const nowIso = () => new Date().toISOString();

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const generateOrderNumber = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `MFP-${ts}-${rand}`;
};

const getProductDoc = async (db, productId) => {
  const snap = await db.collection('products').doc(productId).get();
  if (!snap.exists) return null;
  return { _id: snap.id, ...snap.data() };
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Place order from cart
// @route POST /api/orders
// ─────────────────────────────────────────────────────────────────────────────
const placeOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod = 'razorpay', coupon } = req.body;
  const db = getDb();
  const userId = req.user._id;

  // Load cart from Firestore
  const cartRef = db.collection('carts').doc(userId);
  const cartSnap = await cartRef.get();

  if (!cartSnap.exists || !(cartSnap.data()?.items?.length)) {
    res.status(400);
    throw new Error('Cart is empty');
  }

  const cartItems = cartSnap.data().items;
  const orderItems = [];

  // Validate stock and build order items
  for (const item of cartItems) {
    const product = await getProductDoc(db, item.productId);
    if (!product) {
      res.status(400);
      throw new Error(`Product not found: ${item.productId}`);
    }

    const sizeObj = (product.sizes || []).find((s) => s.size === item.size);
    if (!sizeObj || sizeObj.stock < item.quantity) {
      res.status(400);
      throw new Error(`${product.name} (${item.size}) is out of stock`);
    }

    orderItems.push({
      productId: product._id,
      name: product.name,
      image: product.images?.[0]?.url || '',
      size: item.size,
      color: item.color || '',
      quantity: Number(item.quantity),
      price: Number(item.price || product.discountedPrice || product.price),
    });
  }

  // Pricing calculations
  const subtotal = orderItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const shipping = subtotal > 999 ? 0 : 79;
  const tax = Math.round(subtotal * 0.05); // 5% GST
  const discount = coupon?.discount ? Number(coupon.discount) : 0;
  const total = subtotal + shipping + tax - discount;

  const orderId = randomUUID();
  const orderNumber = generateOrderNumber();

  const order = {
    _id: orderId,
    orderNumber,
    userId,
    user: {
      _id: userId,
      name: req.user.name || '',
      email: req.user.email || '',
    },
    items: orderItems,
    shippingAddress,
    pricing: { subtotal, shipping, discount, tax, total },
    coupon: coupon ? { code: coupon.code, discount: coupon.discount } : null,
    payment: {
      method: paymentMethod,
      status: paymentMethod === 'cod' ? 'pending' : 'pending',
    },
    orderStatus: 'placed',
    source: 'online',
    type: 'online',
    statusHistory: [{ status: 'placed', note: 'Order placed successfully', at: nowIso() }],
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  // Save order to Firestore
  await db.collection('orders').doc(orderId).set(order);

  // Deduct stock from products
  for (const item of cartItems) {
    const productRef = db.collection('products').doc(item.productId);
    const product = await getProductDoc(db, item.productId);
    if (product) {
      const sizes = product.sizes.map((s) =>
        s.size === item.size ? { ...s, stock: Math.max(0, s.stock - item.quantity) } : s
      );
      await productRef.update({
        sizes,
        sold: (product.sold || 0) + item.quantity,
        updatedAt: nowIso(),
      });
    }
  }

  // Mark coupon as used
  if (coupon?.code) {
    const couponSnap = await db.collection('coupons').where('code', '==', coupon.code).limit(1).get();
    if (!couponSnap.empty) {
      const couponRef = couponSnap.docs[0].ref;
      const couponData = couponSnap.docs[0].data();
      await couponRef.update({
        usedCount: (couponData.usedCount || 0) + 1,
        usedBy: [...(couponData.usedBy || []), userId],
      });
    }
  }

  // Clear cart
  await cartRef.set({ user: userId, items: [], updatedAt: nowIso(), createdAt: nowIso() });

  res.status(201).json({ success: true, order });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get user's own orders
// @route GET /api/orders/my
// ─────────────────────────────────────────────────────────────────────────────
const getMyOrders = asyncHandler(async (req, res) => {
  const db = getDb();
  const snap = await db.collection('orders')
    .where('userId', '==', req.user._id)
    .orderBy('createdAt', 'desc')
    .get();

  const orders = snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
  res.json({ success: true, orders });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get single order
// @route GET /api/orders/:id
// ─────────────────────────────────────────────────────────────────────────────
const getOrder = asyncHandler(async (req, res) => {
  const db = getDb();
  const snap = await db.collection('orders').doc(req.params.id).get();

  if (!snap.exists) {
    res.status(404);
    throw new Error('Order not found');
  }

  const order = { _id: snap.id, ...snap.data() };

  // Only owner or admin can view
  if (order.userId !== req.user._id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }

  res.json({ success: true, order });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Admin: update order status
// @route PUT /api/orders/:id/status
// ─────────────────────────────────────────────────────────────────────────────
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const db = getDb();

  const ref = db.collection('orders').doc(req.params.id);
  const snap = await ref.get();

  if (!snap.exists) {
    res.status(404);
    throw new Error('Order not found');
  }

  const order = snap.data();
  const statusHistory = [
    ...(order.statusHistory || []),
    { status, note: note || '', at: nowIso() },
  ];

  const updates = {
    orderStatus: status,
    statusHistory,
    updatedAt: nowIso(),
  };
  if (status === 'delivered') updates.deliveredAt = nowIso();

  await ref.update(updates);
  res.json({ success: true, order: { _id: snap.id, ...order, ...updates } });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Cancel order (user)
// @route PUT /api/orders/:id/cancel
// ─────────────────────────────────────────────────────────────────────────────
const cancelOrder = asyncHandler(async (req, res) => {
  const db = getDb();
  const ref = db.collection('orders').doc(req.params.id);
  const snap = await ref.get();

  if (!snap.exists) {
    res.status(404);
    throw new Error('Order not found');
  }

  const order = snap.data();

  if (order.userId !== req.user._id) {
    res.status(403);
    throw new Error('Not authorized');
  }

  if (!['placed', 'confirmed'].includes(order.orderStatus)) {
    res.status(400);
    throw new Error('Order cannot be cancelled at this stage');
  }

  // Restore stock
  for (const item of order.items || []) {
    const productRef = db.collection('products').doc(item.productId);
    const product = await getProductDoc(db, item.productId);
    if (product) {
      const sizes = product.sizes.map((s) =>
        s.size === item.size ? { ...s, stock: s.stock + item.quantity } : s
      );
      await productRef.update({
        sizes,
        sold: Math.max(0, (product.sold || 0) - item.quantity),
        updatedAt: nowIso(),
      });
    }
  }

  const statusHistory = [
    ...(order.statusHistory || []),
    { status: 'cancelled', note: req.body.reason || 'Cancelled by user', at: nowIso() },
  ];

  await ref.update({
    orderStatus: 'cancelled',
    statusHistory,
    updatedAt: nowIso(),
  });

  res.json({ success: true, order: { _id: snap.id, ...order, orderStatus: 'cancelled' } });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Admin: get all orders (with optional status filter)
// @route GET /api/orders
// ─────────────────────────────────────────────────────────────────────────────
const getAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const db = getDb();

  let query = db.collection('orders').orderBy('createdAt', 'desc');
  if (status && status !== 'all') {
    query = db.collection('orders').where('orderStatus', '==', status).orderBy('createdAt', 'desc');
  }

  const snap = await query.get();
  const allOrders = snap.docs.map((d) => ({ _id: d.id, ...d.data() }));

  const total = allOrders.length;
  const orders = allOrders.slice((page - 1) * limit, page * limit);

  res.json({ success: true, orders, total, pages: Math.ceil(total / limit) });
});

module.exports = { placeOrder, getMyOrders, getOrder, getAllOrders, updateOrderStatus, cancelOrder };
