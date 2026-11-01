/**
 * Creates an Error carrying an HTTP status code so the central error handler
 * can produce a consistent JSON response.
 */
module.exports = function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
};
