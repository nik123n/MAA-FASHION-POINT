require('dotenv').config();

// ── 1. ENV VALIDATION (fail fast before anything else) ────────────────────────
const { validateEnv } = require('./utils/envValidation');
validateEnv();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const compression = require('compression');
const Sentry = require('@sentry/node');
const { logger } = require('./utils/logger');
const { globalLimiter, authLimiter, paymentLimiter, adminLimiter, writeLimiter } = require('./middleware/rateLimiter');

// ── Route Imports ─────────────────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const couponRoutes = require('./routes/couponRoutes');
const activityRoutes = require('./routes/activityRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');

const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
const parseAllowedOrigins = () => {
  const configured = [process.env.FRONTEND_URL, process.env.ADDITIONAL_FRONTEND_URLS]
    .filter(Boolean)
    .flatMap((v) => String(v).split(','))
    .map((v) => v.trim().replace(/\/$/, ''))
    .filter(Boolean);

  const devOrigins =
    process.env.NODE_ENV !== 'production'
      ? ['http://localhost:5173', 'http://127.0.0.1:5173']
      : [];

  return [...new Set([...devOrigins, ...configured])];
};

// ── Capture raw body for Razorpay webhook HMAC verification ───────────────────
const captureWebhookRawBody = (req, res, buffer) => {
  if (req.originalUrl.includes('/payments/webhook') && buffer?.length) {
    req.rawBody = Buffer.from(buffer);
  }
};

// ── Sentry initialization ──────────────────────────────────────────────────────
const sentryDsn = (process.env.SENTRY_DSN || '').trim();
const sentryEnabled = /^https?:\/\//i.test(sentryDsn);
const isProduction = process.env.NODE_ENV === 'production';

if (sentryEnabled) {
  Sentry.init({
    dsn: sentryDsn,
    // ✅ 10% sampling in production — not 100%
    tracesSampleRate: isProduction ? 0.1 : 1.0,
    integrations: [Sentry.expressIntegration()],
    environment: process.env.NODE_ENV || 'development',
  });
  logger.info('Sentry initialized', { dsn: sentryDsn.slice(0, 30) + '...' });
} else {
  logger.warn('Sentry disabled — SENTRY_DSN not configured');
}

// ============================================================
// MIDDLEWARE STACK
// ============================================================

// Security headers (strict in production)
app.use(
  helmet({
    contentSecurityPolicy: isProduction
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", 'https://checkout.razorpay.com'],
            frameSrc: ["'self'", 'https://api.razorpay.com'],
            imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com', 'https://firebasestorage.googleapis.com'],
            connectSrc: ["'self'", 'https://api.razorpay.com', 'https://*.googleapis.com'],
          },
        }
      : false, // Disable CSP in development for easy debugging
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Structured logging — JSON in prod, colorized in dev
app.use(
  morgan(isProduction ? 'combined' : 'dev', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
    // Skip health check logs in production to reduce noise
    skip: (req) => isProduction && req.path === '/api/health',
  })
);

// Parse JSON (with rawBody capture for webhook)
app.use(express.json({ limit: '5mb', verify: captureWebhookRawBody }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// GZIP compression
app.use(compression());

// CORS
const allowedOrigins = parseAllowedOrigins();
logger.info('CORS allowed origins', { origins: allowedOrigins });

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Server-to-server / curl
      const normalized = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(normalized)) return callback(null, true);
      return callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ============================================================
// RATE LIMITING — applied per route group
// ============================================================
app.use('/api/', globalLimiter);
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1/payments', paymentLimiter);
app.use('/api/v1/admin', adminLimiter);
app.use('/api/v1/orders', writeLimiter);
app.use('/api/v1/cart', writeLimiter);

// ============================================================
// ROUTES — versioned under /api/v1/
// ============================================================

// Root
app.get('/', (req, res) => {
  res.json({ success: true, message: 'MAA Fashion Point API 🚀', version: 'v1' });
});

// Health check — includes Firebase connection test
app.get('/api/health', async (req, res) => {
  const status = { status: 'ok', version: 'v1', timestamp: new Date().toISOString() };

  try {
    const { getFirestore } = require('firebase-admin/firestore');
    const db = getFirestore();
    await db.collection('_health').doc('ping').set({ ping: true }, { merge: true });
    status.firebase = 'connected';
  } catch (err) {
    status.firebase = 'error';
    status.firebaseError = err.message;
    return res.status(503).json(status);
  }

  res.json(status);
});

// Versioned API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/activity', activityRoutes);
app.use('/api/v1/recommendations', recommendationRoutes);

// Backward-compatible aliases (v0 → v1 redirect)
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/coupons', couponRoutes);

// ============================================================
// ERROR HANDLING
// ============================================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

if (sentryEnabled) {
  Sentry.setupExpressErrorHandler(app);
}

app.use(errorHandler);

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server started`, {
    port: PORT,
    env: process.env.NODE_ENV || 'development',
    frontend: process.env.FRONTEND_URL,
  });
});

module.exports = app;
