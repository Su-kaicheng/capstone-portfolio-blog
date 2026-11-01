const mongoose = require('mongoose');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const messageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [80, 'Name must be at most 80 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      maxlength: [254, 'Email is too long'],
      match: [EMAIL_RE, 'Please provide a valid email address']
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [2000, 'Message must be at most 2000 characters']
    }
  },
  { timestamps: true, collection: 'messages' }
);

module.exports = mongoose.model('Message', messageSchema);
