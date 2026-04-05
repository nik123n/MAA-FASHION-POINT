const asyncHandler = require('express-async-handler');
const { getFirestore } = require('firebase-admin/firestore');

// NOTE: register & login are handled entirely by Firebase Auth on the frontend.
// These backend routes handle profile management only (called with Firebase ID token).

const getDb = () => getFirestore();
const nowIso = () => new Date().toISOString();

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get current user profile
// @route GET /api/auth/me
// ─────────────────────────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  const db = getDb();
  const snap = await db.collection('users').doc(req.user._id).get();

  if (!snap.exists) {
    // Create user profile if first time (Firebase user without Firestore doc)
    const newUser = {
      _id: req.user._id,
      name: req.user.name || '',
      email: req.user.email || '',
      phone: '',
      role: req.user.role || 'user',
      wishlist: [],
      addresses: [],
      isActive: true,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await db.collection('users').doc(req.user._id).set(newUser);
    return res.json({ success: true, user: newUser });
  }

  res.json({ success: true, user: { _id: snap.id, ...snap.data() } });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Update profile (name, phone, preferences)
// @route PUT /api/auth/profile
// ─────────────────────────────────────────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, preferences } = req.body;
  const db = getDb();
  const ref = db.collection('users').doc(req.user._id);
  const snap = await ref.get();

  const current = snap.exists ? snap.data() : {};
  const updates = {
    ...(name && { name }),
    ...(phone && { phone }),
    ...(preferences && { preferences: { ...current.preferences, ...preferences } }),
    updatedAt: nowIso(),
  };

  await ref.set(updates, { merge: true });
  res.json({ success: true, user: { _id: req.user._id, ...current, ...updates } });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Update password — handled by Firebase Auth on frontend.
//        This stub exists for backward compatibility, but password changes
//        should be done via Firebase's updatePassword() on the client side.
// @route PUT /api/auth/password
// ─────────────────────────────────────────────────────────────────────────────
const updatePassword = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Password changes are handled via Firebase Authentication. Use the app settings on your device.',
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Add / update address
// @route POST /api/auth/address
// ─────────────────────────────────────────────────────────────────────────────
const addAddress = asyncHandler(async (req, res) => {
  const { fullName, phone, street, city, state, pincode, isDefault } = req.body;
  const db = getDb();
  const ref = db.collection('users').doc(req.user._id);
  const snap = await ref.get();

  const current = snap.exists ? snap.data() : {};
  let addresses = Array.isArray(current.addresses) ? [...current.addresses] : [];

  if (isDefault) {
    addresses = addresses.map((addr) => ({ ...addr, isDefault: false }));
  }

  const newAddress = {
    _id: `addr_${Date.now()}`,
    fullName, phone, street, city, state, pincode,
    isDefault: isDefault || false,
  };
  addresses.push(newAddress);

  await ref.set({ addresses, updatedAt: nowIso() }, { merge: true });
  res.status(201).json({ success: true, addresses });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Delete address
// @route DELETE /api/auth/address/:id
// ─────────────────────────────────────────────────────────────────────────────
const deleteAddress = asyncHandler(async (req, res) => {
  const db = getDb();
  const ref = db.collection('users').doc(req.user._id);
  const snap = await ref.get();

  if (!snap.exists) {
    res.status(404);
    throw new Error('User not found');
  }

  const current = snap.data();
  const addresses = (current.addresses || []).filter((a) => a._id !== req.params.id);

  await ref.update({ addresses, updatedAt: nowIso() });
  res.json({ success: true, addresses });
});

// Legacy stubs — Firebase Auth handles these. Keep for backward compat.
const register = asyncHandler(async (req, res) => {
  res.status(400).json({
    success: false,
    message: 'Registration is handled via Firebase Authentication. Use the app register page.',
  });
});

const login = asyncHandler(async (req, res) => {
  res.status(400).json({
    success: false,
    message: 'Login is handled via Firebase Authentication. Use the app login page.',
  });
});

const resolvePhone = asyncHandler(async (req, res) => {
  const { number } = req.query;
  if (!number) {
    res.status(400);
    throw new Error('Phone number is required');
  }

  const db = getDb();
  const snapshot = await db.collection('users').where('phone', '==', number).limit(1).get();

  if (snapshot.empty) {
    res.status(404);
    throw new Error('No account found for this phone number');
  }

  const userDoc = snapshot.docs[0].data();
  if (!userDoc.email) {
    res.status(400);
    throw new Error('Account exists but has no email linked.');
  }

  res.json({ success: true, email: userDoc.email });
});

module.exports = { register, login, getMe, updateProfile, updatePassword, addAddress, deleteAddress, resolvePhone };
