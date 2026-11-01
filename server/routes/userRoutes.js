const express = require('express');
const controller = require('../controllers/userController');
const protect = require('../middleware/protect');
const limits = require('../middleware/limits');

const router = express.Router();

// Account responses (including tokens) must never be cached.
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

router.post('/register', limits.authLimit, controller.register);
router.post('/login', limits.authLimit, controller.login);
router.get('/me', protect, controller.me);

module.exports = router;
