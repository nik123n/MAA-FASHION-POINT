require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// --- Route Imports ---
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const couponRoutes = require('./routes/couponRoutes');

// --- Middleware Imports ---
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// ==========================================
// 1. SECURITY & UTILITY MIDDLEWARE
// ==========================================

// Basic security headers
app.use(helmet());

// Logging for requests
app.use(morgan('dev'));

// Payload size limitations
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==========================================
// 2. CORS CONFIGURATION
// ==========================================
// To enable CORS for your frontend dynamically
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL // Will allow your Render/GitHub pages URL if defined
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);
    
    // You can temporarily replace this logic with `return callback(null, true);` 
    // to allow ALL origins during early testing on Render.
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // If the origin is not allowed
    return callback(new Error(`CORS policy: The origin ${origin} is not allowed.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ==========================================
// 3. RATE LIMITING
// ==========================================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per 15 mins
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
});
app.use('/api/', limiter);

// ==========================================
// 4. STATIC DIRECTORIES
// ==========================================
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  },
}));

// ==========================================
// 5. APPLICATION ROUTES
// ==========================================

// Root Route (fixes the "Route not found: /" issue)
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running 🚀",
    env: process.env.NODE_ENV || 'development'
  });
});

// Health check route for Render
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    backend: 'firebase-ready',
    timestamp: new Date().toISOString(),
  });
});

// Core API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/coupons', couponRoutes);

// ==========================================
// 6. ERROR HANDLING
// ==========================================

// Catch-all for unknown routes (404)
app.use('*', (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.originalUrl}`
  });
});

// Global Error Handler
app.use(errorHandler);

// ==========================================
// 7. SERVER INITIALIZATION
// ==========================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=================================`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.FRONTEND_URL) {
    console.log(`🔗 Allowed Frontend: ${process.env.FRONTEND_URL}`);
  }
  console.log(`=================================\n`);
});

module.exports = app;
