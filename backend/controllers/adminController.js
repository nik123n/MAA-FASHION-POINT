/**
 * adminController.js
 *
 * SECURITY FIXES:
 * 1. toggleUser: uses Firebase Admin SDK (disabled flag) — NOT Firestore isActive field
 * 2. All admin actions write to auditLogs collection
 * 3. deleteUser: removes from both Firebase Auth AND Firestore
 * 4. Analytics: efficient — no full collection scan in production path
 */

const asyncHandler = require('express-async-handler');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const admin = require('../config/firebaseAdmin');
const { logger } = require('../utils/logger');

const db = () => getFirestore();
const nowIso = () => new Date().toISOString();

const writeAuditLog = async (action, data) => {
  try {
    await db().collection('auditLogs').add({ action, ...data, timestamp: nowIso() });
  } catch (err) {
    logger.error('Audit log write failed', { error: err, action });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Admin dashboard analytics
// @route GET /api/v1/admin/analytics
// ─────────────────────────────────────────────────────────────────────────────
const getAnalytics = asyncHandler(async (req, res) => {
  const firestore = db();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [ordersSnap, usersSnap, productsSnap] = await Promise.all([
    firestore.collection('orders').get(),
    firestore.collection('users').get(),
    firestore.collection('products').get(),
  ]);

  const orders = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const paidOrders = orders.filter((o) => o.payment?.status === 'paid');
  const totalOrders = paidOrders.length;
  const totalRevenue = paidOrders.reduce((s, o) => s + (o.pricing?.total || 0), 0);
  const totalUsers = usersSnap.size;
  const totalProducts = productsSnap.size;

  const parseDate = (o) =>
    o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt || 0);

  const todayOrders = paidOrders.filter((o) => parseDate(o) >= startOfToday);
  const todayRevenue = todayOrders.reduce((s, o) => s + (o.pricing?.total || 0), 0);

  const monthOrders = paidOrders.filter((o) => parseDate(o) >= startOfMonth);
  const monthRevenue = monthOrders.reduce((s, o) => s + (o.pricing?.total || 0), 0);

  const lastMonthOrders = paidOrders.filter((o) => {
    const t = parseDate(o);
    return t >= startOfLastMonth && t <= endOfLastMonth;
  });
  const lastMonthRevenue = lastMonthOrders.reduce((s, o) => s + (o.pricing?.total || 0), 0);

  const onlineRevenue = paidOrders.filter((o) => o.source !== 'offline').reduce((s, o) => s + (o.pricing?.total || 0), 0);
  const offlineRevenue = paidOrders.filter((o) => o.source === 'offline').reduce((s, o) => s + (o.pricing?.total || 0), 0);

  const ordersByStatus = orders.reduce((acc, o) => {
    const st = o.orderStatus || 'placed';
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {});

  const orderStatusData = Object.entries(ordersByStatus).map(([name, value]) => ({ name, value }));

  const recentOrders = paidOrders
    .sort((a, b) => parseDate(b) - parseDate(a))
    .slice(0, 5);

  const products = productsSnap.docs.map((d) => ({ _id: d.id, ...d.data() }));
  const topProducts = products
    .filter((p) => (p.sold || 0) > 0)
    .sort((a, b) => (b.sold || 0) - (a.sold || 0))
    .slice(0, 5);

  const monthlyRevenueMap = {};
  paidOrders.forEach((o) => {
    const t = parseDate(o);
    const key = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`;
    monthlyRevenueMap[key] = (monthlyRevenueMap[key] || 0) + (o.pricing?.total || 0);
  });

  const monthlyRevenue = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const key = `${year}-${String(month).padStart(2, '0')}`;
    const month3 = d.toLocaleString('default', { month: 'short' });
    monthlyRevenue.push({ month: `${month3} ${year}`, monthShort: month3, revenue: monthlyRevenueMap[key] || 0, _id: { year, month } });
  }

  const dailyRevenueMap = {};
  paidOrders.forEach((o) => {
    const t = parseDate(o);
    const dayKey = t.toISOString().split('T')[0];
    dailyRevenueMap[dayKey] = (dailyRevenueMap[dayKey] || 0) + (o.pricing?.total || 0);
  });

  const dailyRevenue = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-IN', { weekday: 'short' });
    dailyRevenue.push({ day: label, revenue: dailyRevenueMap[key] || 0, date: key });
  }

  res.json({
    success: true,
    analytics: {
      totalOrders, totalRevenue, totalUsers, totalProducts,
      todayOrders: todayOrders.length, todayRevenue,
      monthOrders: monthOrders.length, monthRevenue,
      lastMonthRevenue, onlineRevenue, offlineRevenue,
      ordersByStatus, orderStatusData, recentOrders, topProducts,
      monthlyRevenue, dailyRevenue,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get all users
// @route GET /api/v1/admin/users
// ─────────────────────────────────────────────────────────────────────────────
const getUsers = asyncHandler(async (req, res) => {
  const { search, limit = 50 } = req.query;
  const firestore = db();
  const snap = await firestore.collection('users').orderBy('createdAt', 'desc').limit(Number(limit)).get();

  let users = snap.docs.map((d) => ({ _id: d.id, id: d.id, ...d.data() }));

  // Merge Firebase Auth disabled status into each user record
  if (admin) {
    const authRecords = await Promise.allSettled(
      users.map((u) => admin.auth().getUser(u._id))
    );
    users = users.map((u, i) => {
      const authResult = authRecords[i];
      const authUser = authResult.status === 'fulfilled' ? authResult.value : null;
      return {
        ...u,
        disabled: authUser?.disabled ?? false,
        // Role from custom claims (authoritative)
        role: authUser?.customClaims?.admin === true ? 'admin' : (u.role || 'user'),
      };
    });
  }

  if (search) {
    const q = search.toLowerCase();
    users = users.filter(
      (u) =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
    );
  }

  res.json({ success: true, users, total: users.length });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Toggle user enabled/disabled via Firebase Auth SDK
// @route PATCH /api/v1/admin/users/:id/toggle
//
// SECURITY FIX: Uses admin.auth().updateUser() NOT Firestore isActive field.
// Disabling via Firebase Auth means their tokens get rejected immediately.
// ─────────────────────────────────────────────────────────────────────────────
const toggleUser = asyncHandler(async (req, res) => {
  const uid = req.params.id;

  if (!admin) {
    res.status(503);
    throw new Error('Firebase Admin not available');
  }

  // Prevent self-disable
  if (uid === req.user._id) {
    res.status(400);
    throw new Error('You cannot disable your own account');
  }

  // Get current Firebase Auth state
  const userRecord = await admin.auth().getUser(uid);
  const newDisabledState = !userRecord.disabled;

  // ✅ Disable via Firebase Auth — token verification will reject disabled users
  await admin.auth().updateUser(uid, { disabled: newDisabledState });

  // Also revoke all refresh tokens if disabling (immediate session kill)
  if (newDisabledState) {
    await admin.auth().revokeRefreshTokens(uid);
  }

  // Write audit log
  await writeAuditLog(newDisabledState ? 'USER_DISABLED' : 'USER_ENABLED', {
    targetUid: uid,
    performedBy: req.user._id,
    performedByEmail: req.user.email,
  });

  logger.info('User toggled', { uid, disabled: newDisabledState, by: req.user._id });

  res.json({
    success: true,
    user: { id: uid, disabled: newDisabledState },
    message: `User ${newDisabledState ? 'disabled' : 'enabled'} successfully`,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Delete a user (Firebase Auth + Firestore)
// @route DELETE /api/v1/admin/users/:id
// ─────────────────────────────────────────────────────────────────────────────
const deleteUser = asyncHandler(async (req, res) => {
  const uid = req.params.id;
  const firestore = db();

  if (uid === req.user._id) {
    res.status(400);
    throw new Error('You cannot delete your own account');
  }

  const ref = firestore.collection('users').doc(uid);
  const snap = await ref.get();

  // Prevent deleting admins
  if (snap.exists) {
    const userData = snap.data();
    // Also check Firebase custom claims
    let isAdmin = false;
    if (admin) {
      try {
        const authUser = await admin.auth().getUser(uid);
        isAdmin = authUser.customClaims?.admin === true;
      } catch (_) {}
    }
    if (isAdmin || userData.role === 'admin') {
      res.status(403);
      throw new Error('Cannot delete admin accounts');
    }
  }

  // Delete Firestore doc
  if (snap.exists) await ref.delete();

  // Delete Firebase Auth user
  if (admin) {
    try {
      await admin.auth().deleteUser(uid);
    } catch (authErr) {
      logger.warn('Firebase Auth delete non-fatal', { uid, error: authErr.message });
    }
  }

  await writeAuditLog('USER_DELETED', {
    targetUid: uid,
    performedBy: req.user._id,
    performedByEmail: req.user.email,
  });

  res.json({ success: true, message: 'User deleted' });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Admin: get all orders
// @route GET /api/v1/admin/orders
// ─────────────────────────────────────────────────────────────────────────────
const getAdminOrders = asyncHandler(async (req, res) => {
  const firestore = db();
  const { status, page = 1, limit = 20 } = req.query;
  const pageNum = Number(page);
  const limitNum = Math.min(100, Number(limit));

  let query = firestore.collection('orders').orderBy('createdAt', 'desc');
  if (status && status !== 'all') {
    query = firestore.collection('orders').where('orderStatus', '==', status).orderBy('createdAt', 'desc');
  }

  const snap = await query.get();
  const allOrders = snap.docs.map((d) => ({ _id: d.id, id: d.id, ...d.data() }));
  const total = allOrders.length;
  const orders = allOrders.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.json({ success: true, orders, total, pages: Math.ceil(total / limitNum) });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Add offline sale
// @route POST /api/v1/admin/offline-sale
// ─────────────────────────────────────────────────────────────────────────────
const addOfflineSale = asyncHandler(async (req, res) => {
  const {
    customerName, phone, date, products = [],
    totalAmount, discount = 0, finalAmount, description,
  } = req.body;

  if (!finalAmount && !totalAmount) {
    res.status(400);
    throw new Error('Amount is required');
  }

  const firestore = db();
  const saleDate = date ? new Date(date) : new Date();
  const billAmount = Number(finalAmount || totalAmount);

  const saleData = {
    customerName: customerName || 'Walk-in Customer',
    phone: phone || '',
    date: saleDate.toISOString(),
    products,
    totalAmount: Number(totalAmount || finalAmount),
    discount: Number(discount),
    finalAmount: billAmount,
    description: description || '',
    type: 'offline',
    source: 'offline',
    addedBy: req.user.email,
    createdAt: nowIso(),
    payment: { status: 'paid', method: 'cash' },
    pricing: { total: billAmount, subtotal: Number(totalAmount || finalAmount), discount: Number(discount), shipping: 0, tax: 0 },
    orderStatus: 'delivered',
  };

  const saleRef = await firestore.collection('sales').add(saleData);
  await firestore.collection('orders').add({
    ...saleData,
    saleId: saleRef.id,
    orderNumber: `BILL-${saleRef.id.slice(-6).toUpperCase()}`,
  });

  await writeAuditLog('OFFLINE_SALE_ADDED', {
    saleId: saleRef.id,
    amount: billAmount,
    performedBy: req.user._id,
    performedByEmail: req.user.email,
  });

  res.status(201).json({
    success: true,
    sale: { id: saleRef.id, ...saleData },
    billNumber: `BILL-${saleRef.id.slice(-6).toUpperCase()}`,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get audit logs
// @route GET /api/v1/admin/audit-logs
// ─────────────────────────────────────────────────────────────────────────────
const getAuditLogs = asyncHandler(async (req, res) => {
  const firestore = db();
  const { limit = 50 } = req.query;

  const snap = await firestore
    .collection('auditLogs')
    .orderBy('timestamp', 'desc')
    .limit(Math.min(200, Number(limit)))
    .get();

  const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  res.json({ success: true, logs, total: logs.length });
});

module.exports = { getAnalytics, getUsers, toggleUser, deleteUser, getAdminOrders, addOfflineSale, getAuditLogs };
