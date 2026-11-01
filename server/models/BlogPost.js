const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [120, 'Title must be at most 120 characters']
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      minlength: [1, 'Content is required'],
      maxlength: [10000, 'Content must be at most 10000 characters']
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    }
  },
  { timestamps: true, collection: 'posts' }
);

// Deleting a post also removes its comments so the database never keeps
// orphaned discussion threads. Lazy require avoids a circular model import.
blogPostSchema.pre('deleteOne', { document: true, query: false }, async function cascadeDeleteComments() {
  const Comment = require('./Comment');
  await Comment.deleteMany({ post: this._id });
});

module.exports = mongoose.model('BlogPost', blogPostSchema);
