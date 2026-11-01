const User = require('../models/User');
const httpError = require('../utils/httpError');
const { signToken } = require('../utils/signToken');
const { registerInput, loginInput } = require('../utils/validators');

/** POST /api/users/register — creates a normal user and logs them straight in. */
exports.register = async (req, res) => {
  const { username, email, password } = registerInput(req.body);

  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    throw httpError(
      409,
      existing.email === email
        ? 'An account with that email already exists'
        : 'That username is already taken'
    );
  }

  const user = await User.create({ username, email, password });
  res.status(201).json({
    success: true,
    token: signToken(user._id),
    user: user.toSafeJSON()
  });
};

/** POST /api/users/login — checks hashed password and returns a JWT. */
exports.login = async (req, res) => {
  const { email, password } = loginInput(req.body);

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    throw httpError(401, 'Invalid email or password');
  }

  res.json({
    success: true,
    token: signToken(user._id),
    user: user.toSafeJSON()
  });
};

/** GET /api/users/me — returns the authenticated account. */
exports.me = async (req, res) => {
  res.json({ success: true, user: req.user.toSafeJSON() });
};
