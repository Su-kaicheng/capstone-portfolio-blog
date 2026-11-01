const express = require('express');
const blogController = require('../controllers/blogController');
const commentController = require('../controllers/commentController');
const protect = require('../middleware/protect');
const validId = require('../utils/validId');

const router = express.Router();

const validateId = (req, res, next, id) => {
  validId(id);
  next();
};
router.param('id', validateId);
router.param('postId', validateId);

// Posts: public reads, protected writes
router.get('/', blogController.list);
router.post('/', protect, blogController.create);
router.get('/:id', blogController.detail);
router.put('/:id', protect, blogController.update);
router.delete('/:id', protect, blogController.remove);

// Comments belong to a post
router.get('/:postId/comments', commentController.list);
router.post('/:postId/comments', protect, commentController.create);

module.exports = router;
