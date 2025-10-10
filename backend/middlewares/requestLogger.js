// backend/middlewares/requestLogger.js
import { v4 as uuidv4 } from 'uuid';
import promClient from 'prom-client';
import logger from '../config/logger.js';

// ---------------------
// 🧠 Prometheus metrics setup
// ---------------------
const httpDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'statusCode'],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5],
});

const httpRequests = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'statusCode'],
});

const httpErrors = new promClient.Counter({
  name: 'http_requests_errors_total',
  help: 'Total HTTP error requests',
  labelNames: ['method', 'route'],
});

// ---------------------
// 🧹 Helper: Scrub sensitive fields
// ---------------------
function scrub(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  const SENSITIVE = ['password', 'token', 'access_token', 'refresh_token', 'credit_card', 'ssn'];

  for (const key of Object.keys(clone)) {
    const value = clone[key];
    if (SENSITIVE.includes(key.toLowerCase())) {
      clone[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      clone[key] = scrub(value);
    }
  }
  return clone;
}

// ---------------------
// 🧩 Request Logger Middleware
// ---------------------
const requestLogger = (req, res, next) => {
  const requestId = uuidv4();
  const start = process.hrtime();
  const { method, path, originalUrl } = req;

  // Attach requestId for later reference
  req.requestId = requestId;

  // Log request start (safe body)
  const safeBody = scrub(req.body);
  logger.info('HTTP request start', {
    request_id: requestId,
    method,
    path,
    endpoint: originalUrl,
    query: req.query,
    body: safeBody,
    client_ip: req.ip,
    user_id: req.user ? req.user.id : 'anonymous',
  });

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationSec = diff[0] + diff[1] / 1e9;
    const statusCode = res.statusCode;

    // Prometheus metrics
    httpDuration.labels(method, path, String(statusCode)).observe(durationSec);
    httpRequests.labels(method, path, String(statusCode)).inc();
    if (statusCode >= 400) httpErrors.labels(method, path).inc();

    // Log request end
    logger.info('HTTP request end', {
      request_id: requestId,
      method,
      path,
      endpoint: originalUrl,
      status_code: statusCode,
      duration: `${durationSec.toFixed(3)}s`,
      client_ip: req.ip,
      user_id: req.user ? req.user.id : 'anonymous',
    });
  });

  next();
};

export default requestLogger;

/*

This code - ✅ Logs every request, with:

Scrubbing of sensitive data

Prometheus metrics for performance

JSON-structured log output

*/ 
