const BlogPost = require('../models/BlogPost');
const Comment = require('../models/Comment');
const httpError = require('../utils/httpError');
const { commentInput } = require('../utils/validators');

const AUTHOR_FIELDS = 'username';

async function findPost(req) {
  const post = await BlogPost.findById(req.params.postId);
  if (!post) throw httpError(404, 'Post not found');
  return post;
}

/** GET /api/blog/:postId/comments — public list of a post's comments. */
exports.list = async (req, res) => {
  const post = await findPost(req);
  const comments = await Comment.find({ post: post._id })
    .sort({ createdAt: 1 })
    .populate('author', AUTHOR_FIELDS);
  res.json(comments);
};

/** POST /api/blog/:postId/comments — authenticated users can comment. */
exports.create = async (req, res) => {
  const post = await findPost(req);
  const input = commentInput(req.body);

  const comment = await Comment.create({
    body: input.body,
    author: req.user._id,
    post: post._id
  });
  await comment.populate('author', AUTHOR_FIELDS);

  res.status(201).json(comment);
};
