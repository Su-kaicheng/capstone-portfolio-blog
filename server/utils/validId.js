const httpError = require('./httpError');

/**
 * Validates a MongoDB ObjectId route parameter before any database query runs.
 */
module.exports = function validId(value) {
  if (typeof value !== 'string' || !/^[0-9a-fA-F]{24}$/.test(value)) {
    throw httpError(400, 'Invalid document id');
  }
  return value;
};
