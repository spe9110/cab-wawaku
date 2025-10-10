// backend/middlewares/errorHandler.js
import logger from '../config/logger.js';

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Log structured error for monitoring
  logger.error('ErrorHandler', {
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    route: req.originalUrl,
    method: req.method,
  });

  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

/*

✅ Unified error handler with:

404 handler

Structured logging for production

Secure stack trace in dev only

*/ 