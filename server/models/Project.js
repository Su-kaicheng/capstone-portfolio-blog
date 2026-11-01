const mongoose = require('mongoose');

function isHttpsUrl(value) {
  if (!value) return true;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

const linkField = {
  type: String,
  default: '',
  trim: true,
  maxlength: [500, 'URL must be at most 500 characters'],
  validate: {
    validator: isHttpsUrl,
    message: 'URL must be a valid https:// link'
  }
};

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [120, 'Title must be at most 120 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description must be at most 2000 characters']
    },
    imageUrl: linkField,
    repoUrl: linkField,
    liveUrl: linkField,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    }
  },
  { timestamps: true, collection: 'projects' }
);

module.exports = mongoose.model('Project', projectSchema);
