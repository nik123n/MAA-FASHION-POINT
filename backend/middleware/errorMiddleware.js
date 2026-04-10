/**
 * errorMiddleware.js
 * Global error handler — structured, hides internals in production.
 */

const { logger } = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || res.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Log the error (structured, with redaction of sensitive data)
  logger.error('Request error', {
    error: err,
    message: err.message,
    statusCode,
    method: req.method,
    url: req.originalUrl,
    uid: req.user?._id,
  });

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    // Only expose stack trace in development
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

module.exports = { errorHandler };
