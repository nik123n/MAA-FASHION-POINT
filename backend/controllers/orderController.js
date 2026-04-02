const asyncHandler = require('express-async-handler');
const { Order, Cart } = require('../models/CartOrder');
const Product = require('../models/Product');
const { sendOrderConfirmationEmail } = require('../services/emailService');

// @desc  Place order
// @route POST /api/orders
const placeOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod = 'razorpay', coupon } = req.body;

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error('Cart is empty');
  }

  // Build order items and validate stock
  const orderItems = [];
  for (const item of cart.items) {
    const product = item.product;
    const sizeObj = product.sizes.find((s) => s.size === item.size);
    if (!sizeObj || sizeObj.stock < item.quantity) {
      res.status(400);
      throw new Error(`${product.name} (${item.size}) is out of stock`);
    }
    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0]?.url,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      price: item.price,
    });
  }

  const subtotal = orderItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const shipping = subtotal > 999 ? 0 : 79;
  const tax = Math.round(subtotal * 0.05); // 5% GST
  let discount = 0;

  if (coupon?.discount) discount = coupon.discount;

  const total = subtotal + shipping + tax - discount;

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    pricing: { subtotal, shipping, discount, tax, total },
    coupon: coupon ? { code: coupon.code, discount: coupon.discount } : undefined,
    payment: { method: paymentMethod },
    statusHistory: [{ status: 'placed', note: 'Order placed successfully' }],
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // Deduct stock
  for (const item of cart.items) {
    await Product.findOneAndUpdate(
      { _id: item.product._id, 'sizes.size': item.size },
      { $inc: { 'sizes.$.stock': -item.quantity, sold: item.quantity } }
    );
  }

  // Clear cart
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [], couponApplied: undefined });

  res.status(201).json({ success: true, order });
});

// @desc  Get user orders
// @route GET /api/orders/my
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate('items.product', 'name images');
  res.json({ success: true, orders });
});

// @desc  Get single order
// @route GET /api/orders/:id
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email phone');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  // Only owner or admin can view
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }
  res.json({ success: true, order });
});

// @desc  Admin: get all orders
// @route GET /api/orders
const getAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = status ? { orderStatus: status } : {};
  const [orders, total] = await Promise.all([
    Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(+limit)
      .populate('user', 'name email'),
    Order.countDocuments(query),
  ]);
  res.json({ success: true, orders, total, pages: Math.ceil(total / limit) });
});

// @desc  Admin: update order status
// @route PUT /api/orders/:id/status
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.orderStatus = status;
  order.statusHistory.push({ status, note: note || '' });
  if (status === 'delivered') order.deliveredAt = new Date();
  await order.save();

  res.json({ success: true, order });
});

// @desc  Cancel order
// @route PUT /api/orders/:id/cancel
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }
  if (!['placed', 'confirmed'].includes(order.orderStatus)) {
    res.status(400);
    throw new Error('Order cannot be cancelled at this stage');
  }

  order.orderStatus = 'cancelled';
  order.statusHistory.push({ status: 'cancelled', note: req.body.reason || 'Cancelled by user' });

  // Restore stock
  for (const item of order.items) {
    await Product.findOneAndUpdate(
      { _id: item.product, 'sizes.size': item.size },
      { $inc: { 'sizes.$.stock': item.quantity, sold: -item.quantity } }
    );
  }

  await order.save();
  res.json({ success: true, order });
});

module.exports = { placeOrder, getMyOrders, getOrder, getAllOrders, updateOrderStatus, cancelOrder };
