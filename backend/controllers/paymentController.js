const asyncHandler = require('express-async-handler');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { Order } = require('../models/CartOrder');
const { sendOrderConfirmationEmail } = require('../services/emailService');

const getRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    const error = new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
    error.statusCode = 503;
    throw error;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const razorpay = getRazorpayClient();

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(order.pricing.total * 100),
    currency: 'INR',
    receipt: order.orderNumber,
    notes: { orderId: order._id.toString(), userId: req.user._id.toString() },
  });

  order.payment.razorpayOrderId = razorpayOrder.id;
  await order.save();

  res.json({
    success: true,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
});

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

  const order = await Order.findById(orderId).populate('user', 'name email');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.payment.status = 'paid';
  order.payment.razorpayPaymentId = razorpay_payment_id;
  order.payment.razorpaySignature = razorpay_signature;
  order.payment.paidAt = new Date();
  order.orderStatus = 'confirmed';
  order.statusHistory.push({ status: 'confirmed', note: 'Payment received' });
  await order.save();

  sendOrderConfirmationEmail(order).catch((err) =>
    console.error('Email send error:', err.message)
  );

  res.json({ success: true, message: 'Payment verified', order });
});

const handleWebhook = asyncHandler(async (req, res) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return res.status(503).json({ message: 'Razorpay is not configured' });
  }

  const signature = req.headers['x-razorpay-signature'];
  const body = JSON.stringify(req.body);

  const expectedSig = crypto.createHmac('sha256', secret).update(body).digest('hex');
  if (expectedSig !== signature) {
    return res.status(400).json({ message: 'Invalid webhook signature' });
  }

  const { event, payload } = req.body;

  if (event === 'payment.captured') {
    const receipt = payload.payment.entity.description;
    const order = await Order.findOne({ orderNumber: receipt });
    if (order && order.payment.status !== 'paid') {
      order.payment.status = 'paid';
      order.orderStatus = 'confirmed';
      await order.save();
    }
  }

  if (event === 'payment.failed') {
    const receipt = payload.payment.entity.description;
    const order = await Order.findOne({ orderNumber: receipt });
    if (order) {
      order.payment.status = 'failed';
      await order.save();
    }
  }

  res.json({ status: 'ok' });
});

module.exports = { createRazorpayOrder, verifyPayment, handleWebhook };
