const User = require('../models/User');
const httpError = require('../utils/httpError');
const { verifyToken } = require('../utils/signToken');

/**
 * Verifies the JWT from the Authorization header and attaches the matching
 * user document to req.user. Any protected route must run after this.
 */
module.exports = async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw httpError(401, 'Not authorized: no token provided');
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      const message = error.name === 'TokenExpiredError'
        ? 'Session expired, please log in again'
        : 'Not authorized: invalid token';
      throw httpError(401, message);
    }

    const user = await User.findById(decoded.sub);
    if (!user) {
      throw httpError(401, 'Not authorized: this account no longer exists');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
