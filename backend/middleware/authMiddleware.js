const asyncHandler = require('express-async-handler');
const admin = require('../config/firebaseAdmin');
const { getFirestore } = require('firebase-admin/firestore');
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@saanjhboutique.com').trim().toLowerCase();

// ─────────────────────────────────────────────────────────────────────────────
// protect — verify Firebase ID Token and load user profile from Firestore
// ─────────────────────────────────────────────────────────────────────────────
const protect = asyncHandler(async (req, res, next) => {
  let idToken;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    idToken = req.headers.authorization.split(' ')[1];
  }

  if (!idToken) {
    res.status(401);
    throw new Error('Not authorized — no token provided');
  }

  if (!admin) {
    res.status(503);
    throw new Error('Auth service unavailable — Firebase Admin not configured');
  }

  try {
    // Verify the Firebase ID token (checks signature, expiry, audience)
    const decoded = await admin.auth().verifyIdToken(idToken);

    // Load user profile from Firestore
    const db = getFirestore();
    const userRef = db.collection('users').doc(decoded.uid);
    const userDoc = await userRef.get();
    const isConfiguredAdmin = (decoded.email || '').toLowerCase() === ADMIN_EMAIL || decoded.admin === true;

    if (!userDoc.exists && isConfiguredAdmin) {
      await userRef.set({
        name: decoded.name || 'MAA Admin',
        email: decoded.email,
        phone: '',
        role: 'admin',
        avatar: '',
        addresses: [],
        preferences: { sizes: [], categories: [] },
        wishlist: [],
        isActive: true,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    const refreshedUserDoc = await userRef.get();

    if (!refreshedUserDoc.exists) {
      res.status(401);
      throw new Error('User profile not found');
    }

    const userData = refreshedUserDoc.data();

    if (isConfiguredAdmin && userData.role !== 'admin') {
      await userRef.set({ role: 'admin', updatedAt: new Date().toISOString() }, { merge: true });
      userData.role = 'admin';
    }

    if (userData.isActive === false) {
      res.status(401);
      throw new Error('Account has been deactivated');
    }

    // Attach user info to request (compatible with old req.user shape)
    req.user = {
      _id:   decoded.uid,   // kept as _id for backward compat with existing controllers
      uid:   decoded.uid,
      email: decoded.email,
      name:  userData.name,
      role:  userData.role || 'user',
      ...userData,
    };

    next();
  } catch (err) {
    // Firebase token errors: expired, revoked, malformed
    if (err.code?.startsWith('auth/')) {
      res.status(401);
      throw new Error('Not authorized — invalid or expired token');
    }
    throw err; // re-throw non-auth errors for the global error handler
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// adminOnly — must come AFTER protect
// ─────────────────────────────────────────────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    res.status(403);
    throw new Error('Admin access required');
  }
  next();
};

// ─────────────────────────────────────────────────────────────────────────────
// optionalAuth — doesn't fail if token is absent, just skips user lookup
// ─────────────────────────────────────────────────────────────────────────────
const optionalAuth = asyncHandler(async (req, res, next) => {
  let idToken;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    idToken = req.headers.authorization.split(' ')[1];
  }

  if (idToken && admin) {
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      const db = getFirestore();
      const userRef = db.collection('users').doc(decoded.uid);
      const userDoc = await userRef.get();
      const isConfiguredAdmin = (decoded.email || '').toLowerCase() === ADMIN_EMAIL || decoded.admin === true;

      if (!userDoc.exists && isConfiguredAdmin) {
        await userRef.set({
          name: decoded.name || 'MAA Admin',
          email: decoded.email,
          phone: '',
          role: 'admin',
          avatar: '',
          addresses: [],
          preferences: { sizes: [], categories: [] },
          wishlist: [],
          isActive: true,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }

      const refreshedUserDoc = await userRef.get();
      if (refreshedUserDoc.exists) {
        const userData = refreshedUserDoc.data();
        if (isConfiguredAdmin && userData.role !== 'admin') {
          await userRef.set({ role: 'admin', updatedAt: new Date().toISOString() }, { merge: true });
          userData.role = 'admin';
        }
        req.user = {
          _id: decoded.uid,
          uid: decoded.uid,
          email: decoded.email,
          ...userData,
        };
      }
    } catch (_) {
      // Silently skip — optional auth, not required
    }
  }

  next();
});

// generateToken kept as a no-op export for backward compat (unused now)
const generateToken = () => {
  throw new Error('generateToken is deprecated — Firebase handles tokens now');
};

module.exports = { protect, adminOnly, optionalAuth, generateToken };
