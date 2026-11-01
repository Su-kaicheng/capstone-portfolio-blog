const httpError = require('../utils/httpError');

/**
 * Allows only users whose role is "admin". Must run after protect().
 */
module.exports = function adminOnly(req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  return next(httpError(403, 'Administrator access required'));
};
