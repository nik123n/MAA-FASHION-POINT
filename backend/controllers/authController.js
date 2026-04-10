/**
 * authController.js
 *
 * Security rules enforced:
 * 1. NO role field is written by backend to Firestore (roles live in Firebase custom claims only)
 * 2. resolvePhone() removed — was an account enumeration vulnerability
 * 3. updateProfile only allows whitelisted fields (name, phone, preferences)
 * 4. syncProfile creates Firestore doc on first login (called from frontend after Firebase signup)
 */

const asyncHandler = require('express-async-handler');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const {
  normalizeAddress,
  normalizeAddressList,
  attachAddressTimestamps,
  isCompleteAddress,
} = require('../utils/address');
const { logger } = require('../utils/logger');

const getDb = () => getFirestore();
const nowIso = () => new Date().toISOString();

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get or create current user profile
// @route GET /api/v1/auth/me
// ─────────────────────────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  const db = getDb();
  const snap = await db.collection('users').doc(req.user._id).get();

  if (!snap.exists) {
    // Auto-create Firestore profile for Firebase users who haven't synced yet
    const newUser = {
      _id: req.user._id,
      name: req.user.name || '',
      email: req.user.email || '',
      phone: '',
      // NOTE: role is intentionally NOT stored here — comes from custom claims
      wishlist: [],
      addresses: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await db.collection('users').doc(req.user._id).set(newUser);
    return res.json({ success: true, user: { ...newUser, role: req.user.role } });
  }

  const profile = snap.data();
  // Merge role from token claims (not Firestore)
  return res.json({ success: true, user: { _id: snap.id, ...profile, role: req.user.role } });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Sync Firestore profile after Firebase signup (called by frontend)
// @route POST /api/v1/auth/sync-profile
// ─────────────────────────────────────────────────────────────────────────────
const syncProfile = asyncHandler(async (req, res) => {
  const db = getDb();
  const ref = db.collection('users').doc(req.user._id);
  const snap = await ref.get();

  if (snap.exists) {
    // Profile already exists — just update lastLogin
    await ref.update({ lastLogin: nowIso(), updatedAt: nowIso() });
    const data = snap.data();
    return res.json({ success: true, user: { _id: snap.id, ...data, role: req.user.role } });
  }

  // Safely extract only allowed fields from request body
  const { name, phone } = req.body;
  const newUser = {
    _id: req.user._id,
    name: name || req.user.name || '',
    email: req.user.email || '',
    phone: phone || '',
    // ⚠️ NEVER write role here — role lives only in Firebase custom claims
    wishlist: [],
    addresses: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    lastLogin: nowIso(),
  };

  await ref.set(newUser);
  logger.info('New user profile created', { uid: req.user._id });
  return res.status(201).json({ success: true, user: { ...newUser, role: req.user.role } });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Update profile — WHITELIST only safe fields
// @route PUT /api/v1/auth/profile
// ─────────────────────────────────────────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const db = getDb();
  const ref = db.collection('users').doc(req.user._id);
  const snap = await ref.get();
  const current = snap.exists ? snap.data() : {};

  // ✅ Whitelist — explicitly block role, isActive, payment-related fields
  const { name, phone, preferences } = req.body;
  const updates = {
    ...(name && { name }),
    ...(phone && { phone }),
    ...(preferences && { preferences: { ...current.preferences, ...preferences } }),
    updatedAt: nowIso(),
  };

  await ref.set(updates, { merge: true });
  res.json({ success: true, user: { _id: req.user._id, ...current, ...updates, role: req.user.role } });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Password changes — handled by Firebase Auth client SDK
// @route PUT /api/v1/auth/password
// ─────────────────────────────────────────────────────────────────────────────
const updatePassword = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Use Firebase Authentication client SDK to change password',
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Add address
// @route POST /api/v1/auth/address
// ─────────────────────────────────────────────────────────────────────────────
const addAddress = asyncHandler(async (req, res) => {
  const db = getDb();
  const ref = db.collection('users').doc(req.user._id);
  const snap = await ref.get();
  const current = snap.exists ? snap.data() : {};
  let addresses = normalizeAddressList(current.addresses || []);
  const newAddress = normalizeAddress(req.body);

  if (!isCompleteAddress(newAddress)) {
    res.status(400);
    throw new Error('A complete address is required');
  }

  if (newAddress.isDefault || addresses.length === 0) {
    addresses = addresses.map((addr) => ({ ...addr, isDefault: false }));
    newAddress.isDefault = true;
  }

  addresses.push(attachAddressTimestamps(newAddress));
  addresses = normalizeAddressList(addresses);

  await ref.set({ addresses, updatedAt: nowIso() }, { merge: true });
  res.status(201).json({ success: true, addresses });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Update address
// @route PUT /api/v1/auth/address/:id
// ─────────────────────────────────────────────────────────────────────────────
const updateAddress = asyncHandler(async (req, res) => {
  const db = getDb();
  const ref = db.collection('users').doc(req.user._id);
  const snap = await ref.get();

  if (!snap.exists) {
    res.status(404);
    throw new Error('User not found');
  }

  const current = snap.data();
  const addresses = normalizeAddressList(current.addresses || []);
  const existingIndex = addresses.findIndex((a) => a.id === req.params.id);

  if (existingIndex === -1) {
    res.status(404);
    throw new Error('Address not found');
  }

  const existingAddress = addresses[existingIndex];
  const nextAddress = normalizeAddress({ ...existingAddress, ...req.body }, existingAddress.id);

  if (!isCompleteAddress(nextAddress)) {
    res.status(400);
    throw new Error('A complete address is required');
  }

  let nextAddresses = addresses.map((addr, idx) =>
    idx !== existingIndex ? addr : attachAddressTimestamps(nextAddress, existingAddress)
  );

  if (nextAddress.isDefault) {
    nextAddresses = nextAddresses.map((addr) => ({
      ...addr,
      isDefault: addr.id === existingAddress.id,
    }));
  }

  nextAddresses = normalizeAddressList(nextAddresses);
  await ref.update({ addresses: nextAddresses, updatedAt: nowIso() });
  res.json({ success: true, addresses: nextAddresses });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Delete address
// @route DELETE /api/v1/auth/address/:id
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
  let addresses = normalizeAddressList(current.addresses || []).filter(
    (a) => a.id !== req.params.id
  );

  if (addresses.length > 0 && !addresses.some((a) => a.isDefault)) {
    addresses = addresses.map((a, i) => ({ ...a, isDefault: i === 0 }));
  }

  await ref.update({ addresses, updatedAt: nowIso() });
  res.json({ success: true, addresses });
});

// ─────────────────────────────────────────────────────────────────────────────
// Legacy stubs
// ─────────────────────────────────────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  res.status(400).json({
    success: false,
    message: 'Registration is handled via Firebase Authentication',
  });
});

const login = asyncHandler(async (req, res) => {
  res.status(400).json({
    success: false,
    message: 'Login is handled via Firebase Authentication',
  });
});

// ⚠️ resolvePhone() REMOVED — was account enumeration vulnerability
// DO NOT RE-ADD — use Firebase Phone Authentication instead

module.exports = {
  register,
  login,
  getMe,
  syncProfile,
  updateProfile,
  updatePassword,
  addAddress,
  updateAddress,
  deleteAddress,
};
