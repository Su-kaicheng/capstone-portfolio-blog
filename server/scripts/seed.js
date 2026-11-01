/**
 * Seeds MongoDB Atlas with demo content so the portfolio is not empty:
 *   - admin account  : admin@portfolio.dev / Admin123!
 *   - visitor account: visitor@portfolio.dev / Visitor123!  (normal user)
 *   - portfolio projects, blog posts, comments and one contact message
 *
 * The script is idempotent: running it twice does not duplicate records.
 *
 *   npm run seed
 */
const { connectDB, closeDB } = require('../config/db');
const User = require('../models/User');
const Project = require('../models/Project');
const BlogPost = require('../models/BlogPost');
const Comment = require('../models/Comment');
const Message = require('../models/Message');

const ADMIN = {
  username: 'kaicheng',
  email: 'admin@portfolio.dev',
  password: 'Admin123!',
  role: 'admin'
};

const VISITOR = {
  username: 'visitor',
  email: 'visitor@portfolio.dev',
  password: 'Visitor123!',
  role: 'user'
};

const PROJECTS = [
  {
    title: 'Full-Stack Portfolio & Blog Platform',
    description:
      'A production-ready personal portfolio and blog application. React + Vite single-page app with React Router and Context API on the front end, Express + Mongoose REST API on the back end, MongoDB Atlas for persistence. Features JWT authentication, an admin dashboard with full project and post CRUD, comments, a contact inbox, security middleware and a responsive Tailwind interface.'
  },
  {
    title: 'Portfolio & Blog REST API',
    description:
      'Secure REST API built across Labs 16-19: MVC structure, Mongoose schemas with validation, bcrypt password hashing, JWT authentication, author-only ownership rules, Helmet security headers, CORS restricted to the front-end origin, a 32 KB JSON body limit and per-IP rate limiting. Consumed by this portfolio site.'
  },
  {
    title: 'React Portfolio SPA',
    description:
      'Single-page portfolio built with React 19, React Router 7 and the Context API. Auth-aware navigation, protected admin routes, loading and error states, reusable components and a modern responsive Tailwind design that works on phones as well as wide desktop screens.'
  }
];

const POSTS = [
  {
    title: 'Building a Secure REST API with Express and Mongoose',
    content: `Every full-stack project starts with a solid API. In this project the back end is organised around the MVC pattern so each concern stays in its own place: Mongoose models define the data, controllers hold the business rules, routes map HTTP verbs to controllers, and middleware handles authentication, rate limiting and error handling.

Validation happens twice. The Mongoose schema is the last line of defence (required fields, string lengths, https-only URLs, unique usernames and emails), while small input helpers reject malformed request bodies early with a clear 400 response. That combination keeps the database clean even when the client misbehaves.

Security follows the Lab 19 checklist: helmet() sets safe response headers, CORS only allows the configured front-end origin, JSON bodies are capped at 32 KB, and login, registration and contact submissions are rate limited per IP. Passwords are hashed with bcrypt and never leave the server.

The result is an API that is predictable to consume: every error uses the same { "error": { "message": "..." } } shape, lists are sorted newest first, and populated relations expose only a username instead of private account details.`
  },
  {
    title: 'JWT Authentication: From Login to Protected Routes',
    content: `Authentication in the portfolio app is a three-step flow. Registration hashes the password with bcrypt before the user document is saved. Login compares the plain password against the stored hash and, on success, signs a JSON Web Token whose subject is the user id. The token expires after seven days and is signed with a secret that lives only in the .env file.

On the client the token is stored in localStorage and added to every protected request as an Authorization: Bearer <token> header. On the server the protect middleware verifies the signature, checks the issuer and audience claims, loads the user from MongoDB and attaches it to req.user. A missing, invalid or expired token produces a clean 401 response; the React AuthContext then clears the session and sends the visitor back to the login page.

Authorisation is a separate layer. The adminOnly middleware protects project management, while blog updates and deletes compare the post author with the authenticated user. That is why the admin dashboard can fully manage portfolio projects but cannot rewrite another author's blog post.`
  },
  {
    title: 'How I Built This Portfolio: React, Context and Protected Routes',
    content: `The front end is a single-page application built with React 19 and React Router 7. Every page is a small, reusable component tree: cards for projects and posts, a comment list and form, shared loading and error states, and an auth-aware header that switches between Login/Register and the account menu.

Global state lives in one place: an AuthContext that persists the token and user to localStorage, verifies the session with GET /api/users/me on startup and exposes login, register and logout to the whole tree. A ProtectedRoute wrapper renders the admin dashboard only when a user is present; otherwise it redirects to /login and returns the visitor to the dashboard after signing in.

Data fetching uses useEffect with explicit loading, error and empty states, so slow or failed requests never leave the interface blank. The admin dashboard uses the same API helpers with the stored JWT to create, edit and delete projects and posts, and to read the contact inbox.

Styling is utility-first with Tailwind CSS v4: a deep ink palette, emerald accents, soft borders and a responsive layout that works the same on a phone and on a wide desktop screen.`
  }
];

const COMMENTS = [
  {
    postTitle: 'Building a Secure REST API with Express and Mongoose',
    authorEmail: VISITOR.email,
    body: 'Great write-up. The validation and error-shape advice is exactly what our lab project needed.'
  },
  {
    postTitle: 'Building a Secure REST API with Express and Mongoose',
    authorEmail: ADMIN.email,
    body: 'Thanks! The central error handler makes the client much simpler to build.'
  },
  {
    postTitle: 'JWT Authentication: From Login to Protected Routes',
    authorEmail: VISITOR.email,
    body: 'The distinction between authentication and authorisation finally clicked for me.'
  }
];

const MESSAGE = {
  name: 'Ming Zhao',
  email: 'ming.zhao@example.com',
  message:
    'Hi Kaicheng — I reviewed your portfolio and really liked the admin dashboard. Would you be open to a short chat about the project?'
};

async function ensureUser(definition) {
  let user = await User.findOne({ email: definition.email });
  if (user) {
    if (user.role !== definition.role) {
      user.role = definition.role;
      await user.save();
      console.log(`updated role for ${definition.email}`);
    }
    return user;
  }
  user = await User.create(definition);
  console.log(`created user ${definition.email}`);
  return user;
}

async function ensureProject(admin, definition) {
  let project = await Project.findOne({ title: definition.title });
  if (!project) {
    project = await Project.create({ ...definition, user: admin._id });
    console.log(`created project: ${definition.title}`);
  }
  return project;
}

async function ensurePost(admin, definition) {
  let post = await BlogPost.findOne({ title: definition.title });
  if (!post) {
    post = await BlogPost.create({ ...definition, author: admin._id });
    console.log(`created post: ${definition.title}`);
  }
  return post;
}

async function ensureComment(post, author, body) {
  const existing = await Comment.findOne({ post: post._id, body });
  if (!existing) {
    await Comment.create({ post: post._id, author: author._id, body });
    console.log('created comment');
  }
}

async function ensureMessage(definition) {
  const existing = await Message.findOne({ email: definition.email, message: definition.message });
  if (!existing) {
    await Message.create(definition);
    console.log('created contact message');
  }
}

async function main() {
  await connectDB();

  const admin = await ensureUser(ADMIN);
  const visitor = await ensureUser(VISITOR);

  const projects = [];
  for (const project of PROJECTS) {
    projects.push(await ensureProject(admin, project));
  }

  const posts = [];
  for (const post of POSTS) {
    posts.push(await ensurePost(admin, post));
  }

  const postByTitle = new Map(posts.map(post => [post.title, post]));
  const usersByEmail = new Map([
    [ADMIN.email, admin],
    [VISITOR.email, visitor]
  ]);

  for (const comment of COMMENTS) {
    const post = postByTitle.get(comment.postTitle);
    const author = usersByEmail.get(comment.authorEmail);
    if (post && author) await ensureComment(post, author, comment.body);
  }

  await ensureMessage(MESSAGE);

  console.log('\nSeed complete.');
  console.log(`Projects: ${projects.length}, posts: ${posts.length}`);
  console.log('Demo accounts:');
  console.log(`  admin   ${ADMIN.email} / ${ADMIN.password}`);
  console.log(`  visitor ${VISITOR.email} / ${VISITOR.password}`);
}

main()
  .catch(error => {
    console.error('Seeding failed:', error.message);
    process.exitCode = 1;
  })
  .finally(closeDB);
