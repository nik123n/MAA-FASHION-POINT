const asyncHandler = require('express-async-handler');
const Coupon = require('../models/Coupon');

// @desc  Validate & apply coupon
// @route POST /api/coupons/validate
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, cartTotal } = req.body;
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

  if (!coupon) {
    res.status(404);
    throw new Error('Invalid coupon code');
  }

  const now = new Date();
  if (now < coupon.validFrom || now > coupon.validUntil) {
    res.status(400);
    throw new Error('Coupon has expired or is not yet active');
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    res.status(400);
    throw new Error('Coupon usage limit reached');
  }

  const userUsed = coupon.usedBy.filter((id) => id.toString() === req.user._id.toString()).length;
  if (userUsed >= coupon.userLimit) {
    res.status(400);
    throw new Error('You have already used this coupon');
  }

  if (cartTotal < coupon.minOrderAmount) {
    res.status(400);
    throw new Error(`Minimum order amount of ₹${coupon.minOrderAmount} required`);
  }

  let discount = 0;
  if (coupon.discountType === 'flat') {
    discount = coupon.discountValue;
  } else {
    discount = (cartTotal * coupon.discountValue) / 100;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  }

  res.json({
    success: true,
    discount: Math.round(discount),
    message: `Coupon applied! You save ₹${Math.round(discount)}`,
    coupon: { code: coupon.code, description: coupon.description },
  });
});

// @desc  Create coupon (Admin)
// @route POST /api/coupons
const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json({ success: true, coupon });
});

// @desc  Get all coupons (Admin)
// @route GET /api/coupons
const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ success: true, coupons });
});

// @desc  Toggle coupon active status (Admin)
// @route PATCH /api/coupons/:id/toggle
const toggleCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error('Coupon not found');
  }
  coupon.isActive = !coupon.isActive;
  await coupon.save();
  res.json({ success: true, coupon });
});

module.exports = { validateCoupon, createCoupon, getCoupons, toggleCoupon };
