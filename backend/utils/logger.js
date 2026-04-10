/**
 * logger.js
 * Structured logger — JSON in production, human-readable in development.
 * Wraps console methods with structured output + Sentry integration.
 *
 * SECURITY: Never log passwords, tokens, card numbers, or full request bodies.
 */

const Sentry = require('@sentry/node');

const isProduction = process.env.NODE_ENV === 'production';

const SENSITIVE_KEYS = ['password', 'token', 'secret', 'key', 'authorization', 'credit_card', 'card_number', 'cvv'];

/**
 * Recursively redact sensitive fields from an object.
 */
const redact = (obj, depth = 0) => {
  if (depth > 5 || typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map((item) => redact(item, depth + 1));

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some((s) => lowerKey.includes(s))) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = redact(value, depth + 1);
    }
  }
  return result;
};

const formatLog = (level, message, meta = {}) => ({
  timestamp: new Date().toISOString(),
  level,
  message,
  ...redact(meta),
  service: 'maa-fashion-backend',
  env: process.env.NODE_ENV || 'development',
});

const logger = {
  info: (message, meta = {}) => {
    if (isProduction) {
      process.stdout.write(JSON.stringify(formatLog('INFO', message, meta)) + '\n');
    } else {
      console.log(`[INFO] ${message}`, Object.keys(meta).length ? meta : '');
    }
  },

  warn: (message, meta = {}) => {
    if (isProduction) {
      process.stdout.write(JSON.stringify(formatLog('WARN', message, meta)) + '\n');
    } else {
      console.warn(`[WARN] ${message}`, Object.keys(meta).length ? meta : '');
    }
  },

  error: (message, meta = {}) => {
    if (isProduction) {
      process.stderr.write(JSON.stringify(formatLog('ERROR', message, meta)) + '\n');
    } else {
      console.error(`[ERROR] ${message}`, Object.keys(meta).length ? meta : '');
    }

    // Capture to Sentry if error object provided
    if (meta.error instanceof Error) {
      Sentry.captureException(meta.error, { extra: redact(meta) });
    } else if (meta.error) {
      Sentry.captureMessage(message, { level: 'error', extra: redact(meta) });
    }
  },

  debug: (message, meta = {}) => {
    if (!isProduction) {
      console.debug(`[DEBUG] ${message}`, Object.keys(meta).length ? meta : '');
    }
  },
};

module.exports = { logger, redact };
