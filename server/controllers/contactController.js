const Message = require('../models/Message');
const { contactInput } = require('../utils/validators');

/** POST /api/contact — public contact form; stores a Message document. */
exports.create = async (req, res) => {
  const input = contactInput(req.body);
  const message = await Message.create(input);
  res.status(201).json({ id: message.id, message: 'Message received' });
};

/** GET /api/contact — admin-only inbox. Never cached. */
exports.list = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const messages = await Message.find().sort({ createdAt: -1, _id: -1 });
  res.json(messages);
};
