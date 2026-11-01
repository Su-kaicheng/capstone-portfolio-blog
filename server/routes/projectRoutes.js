const express = require('express');
const controller = require('../controllers/projectController');
const protect = require('../middleware/protect');
const adminOnly = require('../middleware/adminOnly');
const validId = require('../utils/validId');

const router = express.Router();

router.param('id', (req, res, next, id) => {
  validId(id);
  next();
});

// Public reads
router.get('/', controller.list);
router.get('/:id', controller.detail);

// Admin-only management (owner is attached from the JWT)
router.post('/', protect, adminOnly, controller.create);
router.put('/:id', protect, adminOnly, controller.update);
router.delete('/:id', protect, adminOnly, controller.remove);

module.exports = router;
