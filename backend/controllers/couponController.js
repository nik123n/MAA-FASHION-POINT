const asyncHandler = require('express-async-handler');
const { getFirestore } = require('firebase-admin/firestore');

const getDb = () => getFirestore();
const nowIso = () => new Date().toISOString();

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Validate & apply coupon
// @route POST /api/coupons/validate
// ─────────────────────────────────────────────────────────────────────────────
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, cartTotal } = req.body;
  const db = getDb();

  const snap = await db.collection('coupons')
    .where('code', '==', (code || '').toUpperCase())
    .where('isActive', '==', true)
    .limit(1)
    .get();

  if (snap.empty) {
    res.status(404);
    throw new Error('Invalid coupon code');
  }

  const doc = snap.docs[0];
  const coupon = { _id: doc.id, ...doc.data() };

  const now = new Date();
  if (coupon.validFrom && now < new Date(coupon.validFrom)) {
    res.status(400);
    throw new Error('Coupon is not yet active');
  }
  if (coupon.validUntil && now > new Date(coupon.validUntil)) {
    res.status(400);
    throw new Error('Coupon has expired');
  }

  if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) {
    res.status(400);
    throw new Error('Coupon usage limit reached');
  }

  // Per-user limit check (stored as array of user IDs)
  const usedBy = Array.isArray(coupon.usedBy) ? coupon.usedBy : [];
  const userUsed = usedBy.filter((id) => id === req.user._id).length;
  const userLimit = coupon.userLimit || 1;
  if (userUsed >= userLimit) {
    res.status(400);
    throw new Error('You have already used this coupon');
  }

  const minOrder = coupon.minOrderAmount || 0;
  if (Number(cartTotal) < minOrder) {
    res.status(400);
    throw new Error(`Minimum order amount of ₹${minOrder} required`);
  }

  let discount = 0;
  if (coupon.discountType === 'flat') {
    discount = coupon.discountValue;
  } else {
    discount = (Number(cartTotal) * coupon.discountValue) / 100;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  }

  res.json({
    success: true,
    discount: Math.round(discount),
    message: `Coupon applied! You save ₹${Math.round(discount)}`,
    coupon: { code: coupon.code, description: coupon.description },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Create coupon (Admin)
// @route POST /api/coupons
// ─────────────────────────────────────────────────────────────────────────────
const createCoupon = asyncHandler(async (req, res) => {
  const db = getDb();
  const {
    code, description, discountType = 'flat', discountValue,
    minOrderAmount = 0, maxDiscount, usageLimit, userLimit = 1, validUntil, validFrom,
  } = req.body;

  if (!code || !discountValue) {
    res.status(400);
    throw new Error('Code and discount value are required');
  }

  // Check duplicate
  const existing = await db.collection('coupons').where('code', '==', code.toUpperCase()).limit(1).get();
  if (!existing.empty) {
    res.status(400);
    throw new Error('Coupon code already exists');
  }

  const couponData = {
    code: code.toUpperCase().trim(),
    description: description || '',
    discountType,
    discountValue: Number(discountValue),
    minOrderAmount: Number(minOrderAmount),
    maxDiscount: maxDiscount ? Number(maxDiscount) : null,
    usageLimit: usageLimit ? Number(usageLimit) : null,
    userLimit: Number(userLimit),
    validFrom: validFrom || nowIso(),
    validUntil: validUntil || null,
    isActive: true,
    usedCount: 0,
    usedBy: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  const docRef = await db.collection('coupons').add(couponData);
  res.status(201).json({ success: true, coupon: { _id: docRef.id, ...couponData } });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get all coupons (Admin)
// @route GET /api/coupons
// ─────────────────────────────────────────────────────────────────────────────
const getCoupons = asyncHandler(async (req, res) => {
  const db = getDb();
  const snap = await db.collection('coupons').orderBy('createdAt', 'desc').get();
  const coupons = snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
  res.json({ success: true, coupons });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Toggle coupon active status (Admin)
// @route PATCH /api/coupons/:id/toggle
// ─────────────────────────────────────────────────────────────────────────────
const toggleCoupon = asyncHandler(async (req, res) => {
  const db = getDb();
  const ref = db.collection('coupons').doc(req.params.id);
  const snap = await ref.get();

  if (!snap.exists) {
    res.status(404);
    throw new Error('Coupon not found');
  }

  const current = snap.data();
  const newStatus = !current.isActive;
  await ref.update({ isActive: newStatus, updatedAt: nowIso() });

  res.json({ success: true, coupon: { _id: snap.id, ...current, isActive: newStatus } });
});

module.exports = { validateCoupon, createCoupon, getCoupons, toggleCoupon };
