/**
 * authMiddleware.js
 * Zero-Trust Firebase Auth middleware.
 *
 * Security design:
 *  - Role is read EXCLUSIVELY from Firebase custom claims (set only by backend via Admin SDK).
 *  - Firestore profile is NEVER trusted for role or isActive.
 *  - Account disabled state is checked via Firebase Auth record (not Firestore flag).
 */

const admin = require('../config/firebaseAdmin');
const { logger } = require('../utils/logger');

/**
 * Extracts and verifies the Firebase ID token from the Authorization header.
 * Attaches req.user with uid, email, name, role (from claims only).
 */
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authorized — no token provided' });
    }

    const idToken = authHeader.split(' ')[1];

    if (!admin) {
      return res.status(503).json({ success: false, message: 'Auth service unavailable' });
    }

    // Verify the token (throws if invalid or expired)
    const decoded = await admin.auth().verifyIdToken(idToken, true); // checkRevoked=true

    // ✅ Role comes ONLY from Firebase custom claims — never Firestore
    const isAdmin = decoded.admin === true;

    req.user = {
      _id: decoded.uid,
      uid: decoded.uid,
      email: decoded.email || '',
      name: decoded.name || '',
      role: isAdmin ? 'admin' : 'user',
      emailVerified: decoded.email_verified || false,
    };

    next();
  } catch (err) {
    if (err.code === 'auth/id-token-revoked') {
      return res.status(401).json({ success: false, message: 'Session revoked — please sign in again' });
    }
    if (err.code?.startsWith('auth/')) {
      return res.status(401).json({ success: false, message: 'Not authorized — invalid or expired token' });
    }
    logger.error('verifyFirebaseToken error', { error: err.message });
    return res.status(500).json({ success: false, message: 'Internal auth error' });
  }
};

/**
 * Middleware: requires admin custom claim.
 * Must be used AFTER verifyFirebaseToken.
 */
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

/**
 * Optional auth — attaches req.user if valid token present, else continues.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ') && admin) {
      const idToken = authHeader.split(' ')[1];
      const decoded = await admin.auth().verifyIdToken(idToken);
      req.user = {
        _id: decoded.uid,
        uid: decoded.uid,
        email: decoded.email || '',
        name: decoded.name || '',
        role: decoded.admin === true ? 'admin' : 'user',
        emailVerified: decoded.email_verified || false,
      };
    }
  } catch (_) {
    // Silent — optional auth does not block request
  }
  next();
};

// ─── Backward-compatible aliases ──────────────────────────────────────────────
const protect = verifyFirebaseToken;
const adminOnly = requireAdmin;

// Deprecated stub
const generateToken = () => {
  throw new Error('generateToken is deprecated — Firebase handles tokens');
};

module.exports = { verifyFirebaseToken, requireAdmin, protect, adminOnly, optionalAuth, generateToken };
