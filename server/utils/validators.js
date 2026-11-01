const httpError = require('./httpError');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ensureObject(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw httpError(400, 'Request body must be a JSON object');
  }
  return body;
}

function requireText(value, field) {
  if (typeof value !== 'string') {
    throw httpError(400, `${field} must be text`);
  }
  return value;
}

function trimmedText(value, field, min, max) {
  const text = requireText(value, field).trim();
  if (text.length < min || text.length > max) {
    const range = min === max ? `${min}` : `${min}-${max}`;
    throw httpError(400, `${field} must be ${range} characters long`);
  }
  return text;
}

function normaliseEmail(value) {
  const email = requireText(value, 'email').trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    throw httpError(400, 'A valid email address is required');
  }
  return email;
}

function optionalHttpsUrl(value, field) {
  if (value === undefined || value === null) return undefined;
  const url = requireText(value, field).trim();
  if (!url) return '';
  if (url.length > 500) {
    throw httpError(400, `${field} must be at most 500 characters`);
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw httpError(400, `${field} must be a valid https:// URL`);
  }
  if (parsed.protocol !== 'https:') {
    throw httpError(400, `${field} must be a valid https:// URL`);
  }
  return url;
}

/** POST /api/users/register — username + email + password */
function registerInput(body) {
  const data = ensureObject(body);
  const username = trimmedText(data.username, 'username', 3, 30).toLowerCase();
  if (!/^[a-z0-9_]+$/.test(username)) {
    throw httpError(400, 'Username may only contain letters, digits and underscores');
  }
  const email = normaliseEmail(data.email);
  const password = requireText(data.password, 'password');
  if (password.length < 6 || Buffer.byteLength(password, 'utf8') > 72) {
    throw httpError(400, 'Password must be 6-72 characters long');
  }
  return { username, email, password };
}

/** POST /api/users/login — email + password (no length rules, credentials decide) */
function loginInput(body) {
  const data = ensureObject(body);
  const email = normaliseEmail(data.email);
  const password = requireText(data.password, 'password');
  if (!password) throw httpError(400, 'Password is required');
  return { email, password };
}

/** POST /api/projects — every field validated */
function projectInput(body) {
  const data = ensureObject(body);
  return {
    title: trimmedText(data.title, 'title', 3, 120),
    description: trimmedText(data.description, 'description', 1, 2000),
    imageUrl: optionalHttpsUrl(data.imageUrl, 'imageUrl') ?? '',
    repoUrl: optionalHttpsUrl(data.repoUrl, 'repoUrl') ?? '',
    liveUrl: optionalHttpsUrl(data.liveUrl, 'liveUrl') ?? ''
  };
}

/** PUT /api/projects/:id — only the fields that were sent are updated */
function projectUpdateInput(body) {
  const data = ensureObject(body);
  const update = {};
  if ('title' in data) update.title = trimmedText(data.title, 'title', 3, 120);
  if ('description' in data) update.description = trimmedText(data.description, 'description', 1, 2000);
  if ('imageUrl' in data) update.imageUrl = optionalHttpsUrl(data.imageUrl, 'imageUrl');
  if ('repoUrl' in data) update.repoUrl = optionalHttpsUrl(data.repoUrl, 'repoUrl');
  if ('liveUrl' in data) update.liveUrl = optionalHttpsUrl(data.liveUrl, 'liveUrl');
  if (!Object.keys(update).length) {
    throw httpError(400, 'Provide at least one project field to update');
  }
  return update;
}

/** POST /api/blog — title + content */
function postInput(body) {
  const data = ensureObject(body);
  return {
    title: trimmedText(data.title, 'title', 3, 120),
    content: trimmedText(data.content, 'content', 1, 10000)
  };
}

/** PUT /api/blog/:id — only the fields that were sent are updated */
function postUpdateInput(body) {
  const data = ensureObject(body);
  const update = {};
  if ('title' in data) update.title = trimmedText(data.title, 'title', 3, 120);
  if ('content' in data) update.content = trimmedText(data.content, 'content', 1, 10000);
  if (!Object.keys(update).length) {
    throw httpError(400, 'Provide at least one post field to update');
  }
  return update;
}

/** POST /api/blog/:postId/comments — request field is called "body" */
function commentInput(body) {
  const data = ensureObject(body);
  return { body: trimmedText(data.body, 'body', 1, 1000) };
}

/** POST /api/contact — name + email + message */
function contactInput(body) {
  const data = ensureObject(body);
  return {
    name: trimmedText(data.name, 'name', 1, 80),
    email: normaliseEmail(data.email),
    message: trimmedText(data.message, 'message', 1, 2000)
  };
}

module.exports = {
  registerInput,
  loginInput,
  projectInput,
  projectUpdateInput,
  postInput,
  postUpdateInput,
  commentInput,
  contactInput
};
