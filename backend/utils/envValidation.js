/**
 * envValidation.js
 * Validates required environment variables at startup.
 * Fails fast if critical config is missing — prevents silent failures in production.
 */

const { logger } = require('./logger');

const REQUIRED_VARS = [
  { key: 'NODE_ENV', description: 'Node environment (production/development)' },
  { key: 'RAZORPAY_KEY_ID', description: 'Razorpay API Key ID' },
  { key: 'RAZORPAY_KEY_SECRET', description: 'Razorpay API Key Secret' },
  { key: 'RAZORPAY_WEBHOOK_SECRET', description: 'Razorpay Webhook Secret (separate from key secret)' },
  { key: 'EMAIL_USER', description: 'SMTP email username' },
  { key: 'EMAIL_PASS', description: 'SMTP email password / app password' },
  { key: 'FRONTEND_URL', description: 'Frontend URL for CORS' },
];

const FIREBASE_VARS = [
  { key: 'FIREBASE_SERVICE_ACCOUNT_JSON', description: 'Firebase service account JSON string' },
  { key: 'FIREBASE_SERVICE_ACCOUNT_PATH', description: 'Firebase service account file path' },
];

/**
 * Validates all required env vars.
 * @param {boolean} exitOnFailure - If true, process.exit(1) on missing critical vars
 */
const validateEnv = (exitOnFailure = true) => {
  const missing = [];
  const warnings = [];

  // Check required vars
  for (const { key, description } of REQUIRED_VARS) {
    if (!process.env[key] || process.env[key].trim() === '') {
      missing.push({ key, description });
    }
  }

  // Firebase: at least one must be present
  const hasFirebaseConfig = FIREBASE_VARS.some(
    ({ key }) => process.env[key] && process.env[key].trim() !== ''
  );
  if (!hasFirebaseConfig) {
    missing.push({
      key: 'FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH',
      description: 'Firebase Admin SDK credentials',
    });
  }

  // Warn about optional but recommended vars
  if (!process.env.SENTRY_DSN) {
    warnings.push('SENTRY_DSN not set — error tracking disabled');
  }
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    warnings.push('UPSTASH_REDIS_REST_URL not set — caching disabled');
  }

  // Log warnings
  warnings.forEach((w) => logger.warn(`[ENV] ${w}`));

  // Handle missing required vars
  if (missing.length > 0) {
    logger.error('❌ Missing required environment variables:', {
      missing: missing.map(({ key }) => key),
    });
    missing.forEach(({ key, description }) => {
      logger.error(`  → ${key}: ${description}`);
    });

    if (exitOnFailure && process.env.NODE_ENV === 'production') {
      logger.error('💀 Exiting: cannot start without required configuration in production.');
      process.exit(1);
    }

    return false;
  }

  logger.info('✅ Environment validation passed');
  return true;
};

module.exports = { validateEnv };
