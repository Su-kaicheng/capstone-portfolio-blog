const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

const ISSUER = 'portfolio-blog-api';
const AUDIENCE = 'portfolio-client';

function signToken(userId) {
  return jwt.sign({}, jwtSecret, {
    subject: String(userId),
    algorithm: 'HS256',
    expiresIn: '7d',
    issuer: ISSUER,
    audience: AUDIENCE
  });
}

function verifyToken(token) {
  return jwt.verify(token, jwtSecret, {
    algorithms: ['HS256'],
    issuer: ISSUER,
    audience: AUDIENCE
  });
}

module.exports = { signToken, verifyToken, ISSUER, AUDIENCE };
