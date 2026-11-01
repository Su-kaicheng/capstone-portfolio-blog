const BlogPost = require('../models/BlogPost');
const Comment = require('../models/Comment');
const httpError = require('../utils/httpError');
const { postInput, postUpdateInput } = require('../utils/validators');

const AUTHOR_FIELDS = 'username';

function assertAuthor(post, user) {
  if (String(post.author) !== String(user._id)) {
    throw httpError(403, 'Only the post author may change this post');
  }
}

/** GET /api/blog — public list, newest first, author username populated. */
exports.list = async (req, res) => {
  const posts = await BlogPost.find()
    .sort({ createdAt: -1, _id: -1 })
    .populate('author', AUTHOR_FIELDS);
  res.json(posts);
};

/** GET /api/blog/:id — public detail with author and populated comments. */
exports.detail = async (req, res) => {
  const post = await BlogPost.findById(req.params.id).populate('author', AUTHOR_FIELDS);
  if (!post) throw httpError(404, 'Post not found');

  const comments = await Comment.find({ post: post._id })
    .sort({ createdAt: 1 })
    .populate('author', AUTHOR_FIELDS);

  res.json({ ...post.toJSON(), comments });
};

/** POST /api/blog — any authenticated user becomes the author. */
exports.create = async (req, res) => {
  const post = await BlogPost.create({ ...postInput(req.body), author: req.user._id });
  await post.populate('author', AUTHOR_FIELDS);
  res.status(201).json(post);
};

/** PUT /api/blog/:id — only the original author may update. */
exports.update = async (req, res) => {
  const update = postUpdateInput(req.body);

  const post = await BlogPost.findById(req.params.id);
  if (!post) throw httpError(404, 'Post not found');
  assertAuthor(post, req.user);

  Object.assign(post, update);
  await post.save();
  await post.populate('author', AUTHOR_FIELDS);
  res.json(post);
};

/** DELETE /api/blog/:id — only the original author may delete. */
exports.remove = async (req, res) => {
  const post = await BlogPost.findById(req.params.id);
  if (!post) throw httpError(404, 'Post not found');
  assertAuthor(post, req.user);

  await post.deleteOne();
  res.status(204).end();
};
