/**
 * rateLimiter.js
 * Centralized rate limiting configuration.
 * Different limits for different endpoint sensitivity levels.
 */

const rateLimit = require('express-rate-limit');

const createLimiter = (windowMinutes, max, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message },
    skipSuccessfulRequests: false,
  });

// General API browsing (products, catalog)
const globalLimiter = createLimiter(15, 200, 'Too many requests, please try again later');

// Strict: auth endpoints (login, register, token operations)
const authLimiter = createLimiter(15, 10, 'Too many auth attempts, please wait 15 minutes');

// OTP requests — very strict (5 per hour per IP)
const otpLimiter = createLimiter(60, 5, 'Too many OTP requests, please wait an hour');

// Payment endpoints
const paymentLimiter = createLimiter(15, 20, 'Too many payment requests, please try again later');

// Admin endpoints — strict
const adminLimiter = createLimiter(15, 100, 'Admin rate limit exceeded');

// Write operations (cart, orders)
const writeLimiter = createLimiter(15, 50, 'Too many write requests, please try again later');

module.exports = { globalLimiter, authLimiter, otpLimiter, paymentLimiter, adminLimiter, writeLimiter };
