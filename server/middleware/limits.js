const { rateLimit } = require('express-rate-limit');
const config = require('../config/env');

/**
 * Shared limiter for login + registration: 10 attempts per IP per 15 minutes
 * by default (Lab 19 requirement). Failed input counts as an attempt.
 */
exports.authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many attempts. Try again in 15 minutes.' } }
});

/**
 * Contact form limiter: 5 submissions per IP per 15 minutes by default.
 */
exports.contactLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.contactRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many messages. Try again in 15 minutes.' } }
});
