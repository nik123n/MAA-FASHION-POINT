/**
 * roleController.js
 *
 * ONLY the backend can assign roles via Firebase custom claims.
 * This is the single source of truth for admin role management.
 *
 * Security: All routes protected by verifyFirebaseToken + requireAdmin.
 */

const asyncHandler = require('express-async-handler');
const admin = require('../config/firebaseAdmin');
const { getFirestore } = require('firebase-admin/firestore');
const { logger } = require('../utils/logger');

const getDb = () => getFirestore();
const nowIso = () => new Date().toISOString();

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Assign or revoke admin role via Firebase custom claims
// @route POST /api/v1/admin/roles/assign
// Body: { uid: string, role: 'admin' | 'user' }
// ─────────────────────────────────────────────────────────────────────────────
const assignRole = asyncHandler(async (req, res) => {
  const { uid, role } = req.body;

  if (!admin) {
    return res.status(503).json({ success: false, message: 'Firebase Admin not available' });
  }

  // Prevent self-demotion
  if (uid === req.user._id && role !== 'admin') {
    return res.status(400).json({ success: false, message: 'You cannot remove your own admin role' });
  }

  const isAdmin = role === 'admin';

  // Set Firebase custom claim — this is the ONLY place roles are set
  await admin.auth().setCustomUserClaims(uid, { admin: isAdmin });

  // Write audit log
  const db = getDb();
  await db.collection('auditLogs').add({
    action: isAdmin ? 'ROLE_ASSIGNED_ADMIN' : 'ROLE_REVOKED_ADMIN',
    targetUid: uid,
    performedBy: req.user._id,
    performedByEmail: req.user.email,
    timestamp: nowIso(),
  });

  logger.info('Role assigned via custom claims', {
    targetUid: uid,
    role,
    assignedBy: req.user._id,
  });

  res.json({
    success: true,
    message: `Role '${role}' assigned to user ${uid}. User must re-login for changes to take effect.`,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get Firebase Auth user info + claims
// @route GET /api/v1/admin/roles/:uid
// ─────────────────────────────────────────────────────────────────────────────
const getUserClaims = asyncHandler(async (req, res) => {
  if (!admin) {
    return res.status(503).json({ success: false, message: 'Firebase Admin not available' });
  }

  const userRecord = await admin.auth().getUser(req.params.uid);
  res.json({
    success: true,
    uid: userRecord.uid,
    email: userRecord.email,
    disabled: userRecord.disabled,
    customClaims: userRecord.customClaims || {},
    role: userRecord.customClaims?.admin === true ? 'admin' : 'user',
  });
});

module.exports = { assignRole, getUserClaims };
