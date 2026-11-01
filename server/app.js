const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');
const config = require('./config/env');

const app = express();

// Render / other reverse proxies need this for correct client IPs (rate limits).
if (config.trustProxy) {
  app.set('trust proxy', 1);
}

// --- Security middleware (Lab 19 order: helmet -> cors -> body parser) ---
app.use(helmet());

const LOCAL_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients (curl, Postman, server-to-server) with no Origin.
      if (!origin) return callback(null, true);
      if (config.clientOrigins.includes(origin)) return callback(null, true);
      // In local development also accept any localhost / 127.0.0.1 port (dev + preview).
      if (!config.production && LOCAL_ORIGIN_RE.test(origin)) return callback(null, true);
      // Rejected origins simply receive no CORS headers; the browser blocks the read.
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400
  })
);

// Reject JSON bodies larger than 32 KB before any controller runs.
app.use(express.json({ limit: '32kb' }));

// --- API information ---
app.get('/', (req, res) => {
  res.json({
    name: 'Portfolio & Blog API',
    version: '1.0.0',
    message: 'Capstone back-end for the full-stack portfolio and blog application.',
    endpoints: {
      users: '/api/users',
      projects: '/api/projects',
      blog: '/api/blog',
      postsAlias: '/api/posts',
      comments: '/api/blog/:postId/comments',
      contact: '/api/contact',
      health: '/health'
    }
  });
});

app.get('/health', (req, res) => {
  const db = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: db === 'connected' ? 'ok' : 'degraded',
    uptime: Math.round(process.uptime()),
    db
  });
});

// --- Resource routers ---
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/blog', require('./routes/blogRoutes'));
// Lab 19 kept /api/posts as an alias of the blog routes.
app.use('/api/posts', require('./routes/blogRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));

// --- 404 + central error handling (must be last) ---
app.use(require('./middleware/notFound'));
app.use(require('./middleware/errorHandler'));

module.exports = app;
