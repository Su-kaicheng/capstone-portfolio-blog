const httpError = require('../utils/httpError');

/**
 * Central error handler. Every failure ends up here as JSON:
 *   { "error": { "message": "..." } }
 */
module.exports = function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  let status = Number(error.status) || 500;
  let message = error.message || 'Server error';

  if (error.name === 'ValidationError' && error.errors) {
    status = 400;
    message = Object.values(error.errors)[0]?.message || 'Invalid field value';
  } else if (error.name === 'CastError') {
    status = 400;
    message = 'Invalid field value';
  } else if (error.code === 11000) {
    status = 409;
    const field = Object.keys(error.keyValue || {})[0];
    message = field === 'username'
      ? 'That username is already taken'
      : 'An account with that email already exists';
  } else if (error.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON in request body';
  } else if (error.type === 'entity.too.large') {
    status = 413;
    message = 'JSON body exceeds the 32 KB limit';
  } else if (error.type === 'request.aborted') {
    status = 400;
    message = 'Request was aborted';
  }

  if (status < 400 || status > 599) status = 500;

  if (status >= 500) {
    console.error('Unhandled request error:', error.stack || error.message);
    message = 'Server error';
  }

  res.status(status).json({ error: { message } });
};

module.exports.httpError = httpError;
