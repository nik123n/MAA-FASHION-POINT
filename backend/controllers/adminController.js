const asyncHandler = require('express-async-handler');
const { Order } = require('../models/CartOrder');
const Product = require('../models/Product');
const User = require('../models/User');

// @desc  Admin dashboard analytics
// @route GET /api/admin/analytics
const getAnalytics = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalOrders, totalRevenue, totalUsers, totalProducts,
    monthOrders, monthRevenue, lastMonthRevenue,
    ordersByStatus, recentOrders, topProducts, categoryRevenue,
  ] = await Promise.all([
    Order.countDocuments({ 'payment.status': 'paid' }),
    Order.aggregate([
      { $match: { 'payment.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } },
    ]),
    User.countDocuments({ role: 'user' }),
    Product.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: startOfMonth }, 'payment.status': 'paid' }),
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth }, 'payment.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }, 'payment.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } },
    ]),
    Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
    Order.find({ 'payment.status': 'paid' }).sort({ createdAt: -1 }).limit(5).populate('user', 'name email'),
    Product.find().sort({ sold: -1 }).limit(5).select('name sold price images category'),
    Order.aggregate([
      { $match: { 'payment.status': 'paid' } },
      { $unwind: '$items' },
      { $group: { _id: null, total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
    ]),
  ]);

  // Monthly revenue for chart (last 6 months)
  const monthlyRevenue = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) },
        'payment.status': 'paid',
      },
    },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        revenue: { $sum: '$pricing.total' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  res.json({
    success: true,
    analytics: {
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalUsers,
      totalProducts,
      monthOrders,
      monthRevenue: monthRevenue[0]?.total || 0,
      lastMonthRevenue: lastMonthRevenue[0]?.total || 0,
      ordersByStatus: ordersByStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      recentOrders,
      topProducts,
      monthlyRevenue,
    },
  });
});

// @desc  Get all users (Admin)
// @route GET /api/admin/users
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const query = search ? { $or: [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }] } : {};
  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(+limit),
    User.countDocuments(query),
  ]);
  res.json({ success: true, users, total });
});

// @desc  Toggle user active status
// @route PATCH /api/admin/users/:id/toggle
const toggleUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, user });
});

module.exports = { getAnalytics, getUsers, toggleUser };
