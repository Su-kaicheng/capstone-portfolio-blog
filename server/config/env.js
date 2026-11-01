require('dotenv').config({ quiet: true });

function required(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`${name} is required. Copy .env.example to .env and fill it in.`);
  }
  return String(value).trim();
}

const mongoUri = required('MONGO_URI');
const jwtSecret = required('JWT_SECRET');

if (jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters (use a 64-character hex string)');
}

const clientOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

module.exports = {
  mongoUri,
  jwtSecret,
  port: Number(process.env.PORT || 3000),
  clientOrigins,
  trustProxy: process.env.TRUST_PROXY === '1',
  production: process.env.NODE_ENV === 'production',
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX || 10),
  contactRateLimitMax: Number(process.env.CONTACT_RATE_LIMIT_MAX || 5)
};
