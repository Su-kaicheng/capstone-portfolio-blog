const httpError = require('../utils/httpError');

module.exports = function notFound(req, res, next) {
  next(httpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};
