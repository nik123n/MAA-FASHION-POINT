const asyncHandler = require('express-async-handler');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const db = () => getFirestore();

// @desc  Admin dashboard analytics (Firestore-powered)
// @route GET /api/admin/analytics
const getAnalytics = asyncHandler(async (req, res) => {
  const firestore = db();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  // Parallel Firestore reads
  const [ordersSnap, usersSnap, productsSnap] = await Promise.all([
    firestore.collection('orders').get(),
    firestore.collection('users').where('role', '==', 'user').get(),
    firestore.collection('products').get(),
  ]);

  const orders = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const paidOrders = orders.filter((o) => o.payment?.status === 'paid');

  // Total stats
  const totalOrders = paidOrders.length;
  const totalRevenue = paidOrders.reduce((s, o) => s + (o.pricing?.total || 0), 0);
  const totalUsers = usersSnap.size;
  const totalProducts = productsSnap.size;

  // Today stats
  const todayOrders = paidOrders.filter((o) => {
    const t = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
    return t >= startOfToday;
  });
  const todayRevenue = todayOrders.reduce((s, o) => s + (o.pricing?.total || 0), 0);

  // Month stats
  const monthOrders = paidOrders.filter((o) => {
    const t = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
    return t >= startOfMonth;
  });
  const monthRevenue = monthOrders.reduce((s, o) => s + (o.pricing?.total || 0), 0);

  // Last month
  const lastMonthOrders = paidOrders.filter((o) => {
    const t = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
    return t >= startOfLastMonth && t <= endOfLastMonth;
  });
  const lastMonthRevenue = lastMonthOrders.reduce((s, o) => s + (o.pricing?.total || 0), 0);

  // Offline vs Online revenue
  const onlineRevenue = paidOrders.filter((o) => o.source !== 'offline').reduce((s, o) => s + (o.pricing?.total || 0), 0);
  const offlineRevenue = paidOrders.filter((o) => o.source === 'offline').reduce((s, o) => s + (o.pricing?.total || 0), 0);

  // Orders by status
  const ordersByStatus = orders.reduce((acc, o) => {
    const st = o.orderStatus || 'placed';
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {});

  // Order status for pie chart
  const orderStatusData = Object.entries(ordersByStatus).map(([name, value]) => ({ name, value }));

  // Recent paid orders (last 5)
  const recentOrders = paidOrders
    .sort((a, b) => {
      const ta = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const tb = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return tb - ta;
    })
    .slice(0, 5);

  // Top selling products from product collection
  const products = productsSnap.docs.map((d) => ({ _id: d.id, ...d.data() }));
  const topProducts = products
    .filter((p) => (p.sold || 0) > 0)
    .sort((a, b) => (b.sold || 0) - (a.sold || 0))
    .slice(0, 5);

  // Monthly revenue for last 6 months (line + bar chart)
  const monthlyRevenueMap = {};
  paidOrders.forEach((o) => {
    const t = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt || 0);
    const key = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`;
    monthlyRevenueMap[key] = (monthlyRevenueMap[key] || 0) + (o.pricing?.total || 0);
  });

  // Build last 6 months ordered array
  const monthlyRevenue = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const key = `${year}-${String(month).padStart(2, '0')}`;
    const month3 = d.toLocaleString('default', { month: 'short' });
    monthlyRevenue.push({
      month: `${month3} ${year}`,
      monthShort: month3,
      revenue: monthlyRevenueMap[key] || 0,
      _id: { year, month },
    });
  }

  // Daily revenue for last 7 days (for line chart)
  const dailyRevenueMap = {};
  paidOrders.forEach((o) => {
    const t = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt || 0);
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
      totalOrders,
      totalRevenue,
      totalUsers,
      totalProducts,
      todayOrders: todayOrders.length,
      todayRevenue,
      monthOrders: monthOrders.length,
      monthRevenue,
      lastMonthRevenue,
      onlineRevenue,
      offlineRevenue,
      ordersByStatus,
      orderStatusData,
      recentOrders,
      topProducts,
      monthlyRevenue,
      dailyRevenue,
    },
  });
});

// @desc  Get all users (Admin) — Firestore
// @route GET /api/admin/users
const getUsers = asyncHandler(async (req, res) => {
  const { search, limit = 50 } = req.query;
  const firestore = db();
  const snap = await firestore.collection('users').orderBy('createdAt', 'desc').limit(Number(limit)).get();

  let users = snap.docs.map((d) => ({ _id: d.id, id: d.id, ...d.data() }));

  // Basic in-memory search (Firestore doesn't support full-text)
  if (search) {
    const q = search.toLowerCase();
    users = users.filter(
      (u) =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
    );
  }

  const total = users.length;
  res.json({ success: true, users, total });
});

// @desc  Toggle user active status — Firestore
// @route PATCH /api/admin/users/:id/toggle
const toggleUser = asyncHandler(async (req, res) => {
  const firestore = db();
  const ref = firestore.collection('users').doc(req.params.id);
  const snap = await ref.get();

  if (!snap.exists) {
    res.status(404);
    throw new Error('User not found');
  }

  const current = snap.data();
  const newStatus = !(current.isActive !== false); // default true if not set
  await ref.update({ isActive: newStatus, updatedAt: new Date().toISOString() });

  res.json({ success: true, user: { id: snap.id, ...current, isActive: newStatus } });
});

// @desc  Delete a user — Firestore + Firebase Auth
// @route DELETE /api/admin/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  const firestore = db();
  const admin = require('../config/firebaseAdmin');

  const ref = firestore.collection('users').doc(req.params.id);
  const snap = await ref.get();

  if (!snap.exists) {
    res.status(404);
    throw new Error('User not found');
  }

  const userData = snap.data();
  if (userData.role === 'admin') {
    res.status(403);
    throw new Error('Cannot delete admin accounts');
  }

  // Delete from Firestore
  await ref.delete();

  // Also delete from Firebase Auth (non-fatal)
  try {
    if (admin) await admin.auth().deleteUser(req.params.id);
  } catch (authErr) {
    console.warn('Firebase Auth delete failed (non-fatal):', authErr.message);
  }

  res.json({ success: true, message: 'User deleted' });
});

// @desc  Admin: get all orders — Firestore
// @route GET /api/admin/orders
const getAdminOrders = asyncHandler(async (req, res) => {
  const firestore = db();
  const { status, page = 1, limit = 20 } = req.query;
  const pageNum = Number(page);
  const limitNum = Number(limit);

  let query = firestore.collection('orders').orderBy('createdAt', 'desc');
  if (status && status !== 'all') {
    query = firestore.collection('orders').where('orderStatus', '==', status).orderBy('createdAt', 'desc');
  }

  const snap = await query.get();
  const allOrders = snap.docs.map((d) => ({ _id: d.id, id: d.id, ...d.data() }));

  // Pagination
  const total = allOrders.length;
  const orders = allOrders.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.json({ success: true, orders, total, pages: Math.ceil(total / limitNum) });
});

// @desc  Add offline sale / bill entry — Firestore (saves to 'sales' + 'orders')
// @route POST /api/admin/offline-sale
const addOfflineSale = asyncHandler(async (req, res) => {
  const {
    customerName, phone, date,
    products = [], // [{ productId, productName, quantity, price, total }]
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
    createdAt: new Date().toISOString(),
    // Analytics-compatible fields
    payment: { status: 'paid', method: 'cash' },
    pricing: { total: billAmount, subtotal: Number(totalAmount || finalAmount), discount: Number(discount), shipping: 0, tax: 0 },
    orderStatus: 'delivered',
  };

  // Save to 'sales' collection (primary)
  const saleRef = await firestore.collection('sales').add(saleData);

  // Also save to 'orders' collection so analytics picks it up
  await firestore.collection('orders').add({
    ...saleData,
    saleId: saleRef.id,
    orderNumber: `BILL-${saleRef.id.slice(-6).toUpperCase()}`,
  });

  res.status(201).json({
    success: true,
    sale: { id: saleRef.id, ...saleData },
    billNumber: `BILL-${saleRef.id.slice(-6).toUpperCase()}`,
  });
});

module.exports = { getAnalytics, getUsers, toggleUser, deleteUser, getAdminOrders, addOfflineSale };
