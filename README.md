# Full-Stack Portfolio & Blog Application

Capstone project for **Web Data Management and Application**.

| | |
| --- | --- |
| Student | 苏楷程 (Su Kaicheng) |
| Student ID | 24998094 |
| Project type | Cumulative full-stack capstone (100 marks) |
| Repository layout | `server/` (Express + Mongoose API) · `client/` (React SPA) |

A production-ready personal portfolio and blog platform: a secure REST API backed
by MongoDB Atlas and a responsive React single-page application with
authentication, an admin dashboard, blog comments and a contact inbox.

---

## 1. Live deployment

| Deliverable | URL |
| --- | --- |
| **Front-end (SPA)** | **https://portfolio-blog-web.onrender.com** |
| **Back-end (API)** | **https://portfolio-blog-api-flto.onrender.com** |
| API health check | https://portfolio-blog-api-flto.onrender.com/health |
| Front-end mirror (Vercel) | https://capstone-portfolio-blog.vercel.app |
| Source code | https://github.com/Su-kaicheng/capstone-portfolio-blog |

> The Render static-site URL is the primary front-end link (reachable from
> mainland China). The Vercel mirror is a secondary copy because
> `*.vercel.app` can be blocked by some mainland DNS resolvers. Both builds
> call the same deployed Render API. Render free instances sleep after
> inactivity, so the first request may take up to ~30 seconds to wake up.
>
> Deployment details and the reproducible steps are in
> [Section 10](#10-deployment-guide).

## 2. Demo accounts

The seed script creates these accounts:

| Role | Email | Password | Use it to |
| --- | --- | --- | --- |
| **Admin** | `admin@portfolio.dev` | `Admin123!` | Demo the admin dashboard (project + blog CRUD, inbox) |
| Visitor | `visitor@portfolio.dev` | `Visitor123!` | Demo the normal user experience (comment, 403 on admin pages) |

Registration (`/register`) always creates a normal `user` account. To promote
any registered account to admin:

```powershell
cd server
npm.cmd run admin -- your-email@example.com
```

## 3. Technology stack

**Back-end**

- Node.js 24 + Express 5 REST API (MVC folder structure)
- MongoDB Atlas cloud database, modelled with Mongoose 9
- JWT authentication (`jsonwebtoken`), password hashing with `bcryptjs`
- Security: `helmet`, `cors` allow-list, 32 KB JSON limit, `express-rate-limit`
- Centralised JSON error handling, environment configuration with `dotenv`

**Front-end**

- React 19 + Vite 8 single-page application
- React Router 7 client-side routing (public + protected routes)
- Context API authentication state (token + user persisted in `localStorage`)
- Tailwind CSS v4 utility-first responsive design
- Custom `fetch` API layer with `Authorization: Bearer <token>` support

**Deployment**: Vercel (SPA) + Render (API) + MongoDB Atlas (database).

## 4. Project structure

```
capstone/
├── README.md                     ← this file
├── CAPSTONE_REQUIREMENTS.md      ← rubric checklist mapped to the implementation
├── docs/
│   └── API_CONTRACT.md           ← front-end/back-end API contract
├── server/                       ← Express + Mongoose back-end
│   ├── app.js                    ← express app: security middleware + routers
│   ├── server.js                 ← database connection + HTTP listener
│   ├── config/
│   │   ├── env.js                ← validated environment configuration
│   │   └── db.js                 ← MongoDB Atlas connection
│   ├── models/                   ← User, Project, BlogPost, Comment, Message
│   ├── controllers/              ← user, project, blog, comment, contact
│   ├── routes/                   ← /api/users, /api/projects, /api/blog, /api/contact
│   ├── middleware/               ← protect, adminOnly, limits, errorHandler, notFound
│   ├── utils/                    ← validators, JWT helpers, http errors, id validation
│   ├── scripts/
│   │   ├── seed.js               ← demo accounts + sample content (idempotent)
│   │   └── promoteAdmin.js       ← promote a registered account to admin
│   └── checks/
│       └── smoke-test.js         ← automated contract tests for every endpoint
└── client/                       ← React single-page application
    ├── src/
    │   ├── lib/api.js            ← typed API helper (VITE_API_URL, JWT)
    │   ├── context/AuthContext.jsx
    │   ├── components/           ← Header, Footer, ProtectedRoute, cards, forms…
    │   ├── pages/                ← Home, Projects, ProjectDetail, Blog, BlogDetail,
    │   │                            Contact, Login, Register, AdminDashboard, NotFound
    │   └── __tests__/            ← Vitest smoke + live-API integration tests
    ├── vercel.json               ← SPA routing rewrite for deployment
    └── .env.example              ← VITE_API_URL
```

## 5. Feature checklist

### Back-end (50 marks)

- [x] **Mongoose models with validation** — User (`username`, `email`, `password`,
      `role`), Project (`title`, `description`, `imageUrl`, `repoUrl`, `liveUrl`,
      `user`), BlogPost (`title`, `content`, `author` + timestamps),
      Comment (`body`, `author`, `post` + timestamps), Message (`name`, `email`,
      `message` + timestamps). MongoDB Atlas cloud database.
- [x] **Authentication** — bcrypt password hashing, JWT issued on login
      (7-day expiry, issuer/audience claims), `protect` middleware attaches the
      database user to `req.user`.
- [x] **Authorisation** — `adminOnly` guards project management; blog
      update/delete compares the JWT user with the post author (403 otherwise);
      `user` fields are always taken from the token, never from the request body.
- [x] **CRUD endpoints** — public project/blog reads; protected project writes;
      protected blog writes; full status-code contract (`201`, `200`, `204`,
      `400`, `401`, `403`, `404`, `409`, `413`, `429`, `500`).
- [x] **Relationships** — projects populated with `user.username`; posts
      populated with `author.username`; post detail embeds populated comments;
      comments bound to both user and post.
- [x] **Structure & error handling** — MVC folders, small single-purpose
      modules, one central error handler producing `{ "error": { "message": … } }`.
- [x] **Security (Lab 19)** — `helmet` headers, CORS restricted to
      `CLIENT_ORIGIN`, 32 KB JSON body limit, 10 auth attempts / 5 contact
      submissions per IP per 15 minutes, `Cache-Control: no-store` on auth and
      inbox responses, secrets in `.env`.

### Front-end (50 marks)

- [x] **React architecture & design** — reusable components (`Header`, `Footer`,
      `ProjectCard`, `BlogPostCard`, `CommentList`, `CommentForm`, `Loader`,
      `ErrorState`, admin forms…), props-driven, responsive Tailwind CSS v4
      design with mobile navigation.
- [x] **Routing** — `/`, `/projects`, `/projects/:id`, `/blog`, `/blog/:id`,
      `/contact`, `/login`, `/register`, `/admin` (protected) and a 404 page;
      `ProtectedRoute` redirects guests and restores the intended destination.
- [x] **API integration (read)** — `useEffect` + explicit **Loading…** and
      **Error** states on every data page; contact form posts to the API.
- [x] **Auth flow & global state** — Context API (`AuthContext`) stores
      token/user in `localStorage`, verifies the session with `/api/users/me` on
      boot, exposes `login`/`register`/`logout`; the header is auth-aware.
- [x] **API integration (protected)** — admin dashboard creates, edits and
      deletes projects and posts and reads the contact inbox; every request
      sends the JWT; comments can be posted from the blog detail page.
- [x] **Deployment** — Vercel SPA talking exclusively to the deployed Render API.

## 6. Quick start (local development)

### 6.1 Prerequisites

- Node.js 20+ and npm (developed with Node 24 / npm 11)
- A MongoDB Atlas cluster and database user (database name `portfolio_blog`)
- Your current public IP allowed in **Atlas → Network Access** (or `0.0.0.0/0`
  for the course demo)

### 6.2 Back-end

```powershell
cd server
npm.cmd install

# Create your private environment file
Copy-Item .env.example .env
# then edit .env and set MONGO_URI + JWT_SECRET

# Generate a JWT secret (64 hex characters)
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"

# Insert the demo accounts and sample content
npm.cmd run seed

# Start the API on http://localhost:3000
npm.cmd start
```

`npm run dev` starts the same server with `nodemon` auto-reload.

### 6.3 Front-end

```powershell
cd client
npm.cmd install

Copy-Item .env.example .env
# .env contains: VITE_API_URL=http://localhost:3000

npm.cmd run dev
```

Open **http://localhost:5173**.

> Run two terminals (API + client) at the same time. The API must be running
> before pages can load data.

### 6.4 Test the API (optional but recommended)

With the server running:

```powershell
cd server
npm.cmd run smoke
```

This executes 51 assertions covering authentication, authorisation, CRUD,
comments, contact, CORS, validation, the 32 KB body limit and 404 handling.

### 6.5 Test the front-end

```powershell
cd client
npm.cmd test
```

10 Vitest tests: 2 smoke tests (guest rendering, 404) plus 8 integration tests
that drive the real UI against the running API — data loading on Home/Projects/
Blog, blog detail, guest `/admin` redirect, contact form, admin login + project
CRUD + post CRUD + messages inbox, visitor commenting and registration
(auto-login). The integration tests skip automatically when the API is not
running, so `npm test` still passes without a back-end.

> On a restricted/agent shell that blocks Vite's config bundler (Windows
> `spawn EPERM`), append `-- --configLoader native` to the `dev`/`build`/`preview`
> commands, and run Vitest as
> `node node_modules/vitest/vitest.mjs run --config vitest.config.mjs --configLoader native --pool=threads`.
> On a normal developer machine the plain `npm run dev` / `npm run build` /
> `npm test` commands work as-is.

## 7. Environment variables

### `server/.env`

| Variable | Required | Example | Purpose |
| --- | --- | --- | --- |
| `MONGO_URI` | yes | `mongodb+srv://user:pass@cluster.mongodb.net/portfolio_blog?retryWrites=true&w=majority` | MongoDB Atlas connection string |
| `JWT_SECRET` | yes | (64 random hex characters) | Signs and verifies JWTs |
| `PORT` | no | `3000` | HTTP port (Render sets this automatically) |
| `CLIENT_ORIGIN` | no | `http://localhost:5173` | Allowed CORS origin(s); comma-separate for production. In local development any `localhost`/`127.0.0.1` port (dev + preview servers) is also accepted; production honours only the configured origins. |
| `TRUST_PROXY` | no | `0` / `1` | Set to `1` behind Render's proxy so rate limiting sees real IPs |
| `AUTH_RATE_LIMIT_MAX` | no | `10` | Login + registration attempts per IP / 15 min |
| `CONTACT_RATE_LIMIT_MAX` | no | `5` | Contact submissions per IP / 15 min |

### `client/.env`

| Variable | Required | Example | Purpose |
| --- | --- | --- | --- |
| `VITE_API_URL` | no (defaults to localhost) | `http://localhost:3000` | Base URL of the API |

> **Campus-network note:** some networks block the DNS TXT lookups required by
> `mongodb+srv://`. If the server reports `queryTxt ETIMEOUT`, use the
> cluster's direct seed-list URI instead (Atlas → Connect → Drivers → *Node.js*
> shows the SRV form; choosing a non-SRV variant or listing the three shard
> hosts works as well). The local `server/.env` is pre-configured with the
> direct seed-list form for this reason.

## 8. API documentation

- Base URL (local): `http://localhost:3000`
- Base URL (production): `https://<your-api>.onrender.com`
- All bodies are JSON. Authenticated requests send
  `Authorization: Bearer <jwt>`.
- **Errors always look like** `{ "error": { "message": "…" } }`.

### 8.1 Health & information

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health` | – | `{ status, uptime, db }` — used as Render health check |
| GET | `/` | – | API name, version and endpoint map |

### 8.2 Users

| Method | Endpoint | Auth | Body / params | Success |
| --- | --- | --- | --- | --- |
| POST | `/api/users/register` | – | `{ username, email, password }` | `201 { success, token, user }` |
| POST | `/api/users/login` | – | `{ email, password }` | `200 { success, token, user }` |
| GET | `/api/users/me` | Bearer | – | `200 { success, user }` |

Validation: `username` 3–30 chars (`a-z`, `0-9`, `_`), valid unique `email`,
`password` 6–72 chars. Duplicate email/username → `409`.

```jsonc
// POST /api/users/login  →  200
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs…",
  "user": {
    "_id": "674…", "username": "kaicheng",
    "email": "admin@portfolio.dev", "role": "admin",
    "createdAt": "2026-11-01T…", "updatedAt": "2026-11-01T…"
  }
}
```

### 8.3 Projects (portfolio)

| Method | Endpoint | Auth | Body / params | Success |
| --- | --- | --- | --- | --- |
| GET | `/api/projects` | – | – | `200 Project[]` (newest first) |
| GET | `/api/projects/:id` | – | 24-char id | `200 Project`, `400` bad id, `404` |
| POST | `/api/projects` | Bearer + admin | `{ title, description, imageUrl?, repoUrl?, liveUrl? }` | `201 Project` |
| PUT | `/api/projects/:id` | Bearer + admin | any subset of the fields above | `200 Project` |
| DELETE | `/api/projects/:id` | Bearer + admin | – | `204` no body |

`Project` = `{ _id, title, description, imageUrl, repoUrl, liveUrl, user: { _id, username }, createdAt, updatedAt }`.
`title` 3–120 chars, `description` ≤ 2000 chars, URLs must be `https://`.
`user` is set from the JWT (never from the request body). Non-admins get `403`.

### 8.4 Blog posts

| Method | Endpoint | Auth | Body / params | Success |
| --- | --- | --- | --- | --- |
| GET | `/api/blog` | – | – | `200 Post[]` (author username populated) |
| GET | `/api/blog/:id` | – | – | `200 PostDetail` (author + comments populated) |
| POST | `/api/blog` | Bearer | `{ title, content }` | `201 Post` |
| PUT | `/api/blog/:id` | Bearer + author | `{ title?, content? }` | `200 Post`; `403` if not the author |
| DELETE | `/api/blog/:id` | Bearer + author | – | `204`; `403` if not the author |

`Post` = `{ _id, title, content, author: { _id, username }, createdAt, updatedAt }`.
`PostDetail` additionally contains `comments: Comment[]`. `title` 3–120 chars,
`content` 1–10000 chars. `/api/posts` is a Lab 19 alias of `/api/blog`.

### 8.5 Comments

| Method | Endpoint | Auth | Body / params | Success |
| --- | --- | --- | --- | --- |
| GET | `/api/blog/:postId/comments` | – | – | `200 Comment[]`; `404` unknown post |
| POST | `/api/blog/:postId/comments` | Bearer | `{ "body": "text" }` | `201 Comment`; `404` unknown post |

`Comment` = `{ _id, body, author: { _id, username }, post, createdAt, updatedAt }`.
Comment text 1–1000 chars; author is taken from the JWT.

### 8.6 Contact

| Method | Endpoint | Auth | Body | Success |
| --- | --- | --- | --- | --- |
| POST | `/api/contact` | – | `{ name, email, message }` | `201 { id, message: "Message received" }` |
| GET | `/api/contact` | Bearer + admin | – | `200 Message[]` (`Cache-Control: no-store`) |

`name` 1–80, valid `email`, `message` 1–2000 chars. Public submissions are
limited to 5 per IP per 15 minutes.

### 8.7 Rate limits and security headers

- `POST /api/users/register` + `POST /api/users/login` share **10 attempts per IP
  per 15 minutes** → `429` after that.
- `POST /api/contact` allows **5 submissions per IP per 15 minutes**.
- Responses include Helmet headers (`X-Content-Type-Options: nosniff`,
  `Content-Security-Policy`, …) and `Access-Control-Allow-Origin` only for the
  configured front-end origin.

## 9. Data models

```text
User                          Project                        BlogPost
├── username (unique)         ├── title                      ├── title
├── email (unique)            ├── description                ├── content
├── password (bcrypt hash)    ├── imageUrl / repoUrl / liveUrl├── author ──► User
├── role: user | admin        ├── user ──────────────────►    └── timestamps
└── timestamps                    User
                                                              Comment
Message                       (timestamps)                    ├── body
├── name                                                     ├── author ──► User
├── email                                                     ├── post ────► BlogPost
├── message                                                   └── timestamps
└── timestamps
```

## 10. Deployment guide

The project is already deployed with this exact pipeline (see Section 1):

- **Back-end** → Render **Web Service** from the `server/` folder
  (Singapore, free plan, Node 24).
- **Front-end** → Render **Static Site** from the `client/` folder
  (`npm install && npm run build` → `dist/`), plus a Vercel mirror.

Both services are declared in [`render.yaml`](render.yaml), so a Render
Blueprint can recreate the whole stack from this repository.

### 10.1 Back-end → Render (Web Service)

1. Push this folder to a GitHub repository (do **not** commit `node_modules` or
   `.env`; the included `.gitignore` already excludes them).
2. In Render: **New → Web Service**, connect the repository.
3. Settings:
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`
4. Environment variables:
   - `MONGO_URI` = your MongoDB Atlas SRV connection string
   - `JWT_SECRET` = the 64-character hex secret
   - `CLIENT_ORIGIN` = your deployed front-end URL (e.g. `https://your-app.vercel.app`)
   - `TRUST_PROXY` = `1`
   - (`PORT` is provided by Render automatically.)
5. Deploy, then open `https://<service>.onrender.com/health` — it must return
   `{"status":"ok","db":"connected"}`.
6. In MongoDB Atlas → **Network Access**, add `0.0.0.0/0` (or Render's static
   outbound IPs if enabled) so the API can reach the cluster.

> Render's free tier sleeps after inactivity; the first request may take
> ~30 seconds to wake up. The React client shows a loading state while waiting.

### 10.2 Front-end → Render Static Site (primary) / Vercel (mirror)

**Render Static Site (used for the live URL in Section 1):**

1. In Render: **New → Static Site**, connect the same repository.
2. Settings:
   - **Root Directory:** `client`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
3. Environment variable: `VITE_API_URL` = `https://<api-service>.onrender.com`
4. Deploy, then set the API's `CLIENT_ORIGIN` to the static-site URL and let the
   API restart so browser requests pass CORS.
5. Add a SPA rewrite rule so deep links such as `/blog/674…` work on refresh:
   **Redirects/Rewrites → Add Rule**: Source `/*`, Destination `/index.html`,
   Action **Rewrite** (also declared in `render.yaml` and applied to the live
   site through the Render API).

**Vercel mirror (optional, same repository/build):**

1. In Vercel: **Add New → Project**, import the repository.
2. **Root Directory** `client`, framework **Vite**, build `npm run build`,
   output `dist`; environment variable `VITE_API_URL` = the deployed API URL.
3. Deploy. `client/vercel.json` rewrites every route to `/index.html`.
   (Note: `*.vercel.app` can be blocked in mainland China, which is why the
   Render static site is the primary link.)

6. Open the deployed site, log in with the admin demo account and confirm the
   dashboard works against the live API.

## 11. Submission checklist (Chaoxing)

- [x] Live front-end URL: **https://portfolio-blog-web.onrender.com**
- [x] Live back-end URL: **https://portfolio-blog-api-flto.onrender.com**
- [x] ZIP named `24998094_苏楷程_CapstoneProject.zip`
- [x] ZIP contains `README.md`, `CAPSTONE_REQUIREMENTS.md`, `docs/`, `server/` and `client/`
- [x] All `node_modules` folders are excluded from the ZIP
- [x] This README's live URLs are updated to the deployed links
- [x] Source code: https://github.com/Su-kaicheng/capstone-portfolio-blog

Included for the local demo / viva (no extra setup needed):

- `server/.env` is already configured for the course MongoDB Atlas cluster. It
  is listed in the submission so the marker can run the app immediately; delete
  it before publishing the code anywhere public, or rotate the database password
  after the course.
- Automated tests: `cd server; npm run smoke` (51 API checks) and
  `cd client; npm test` (10 UI/integration tests).

Create the archive from the project root (PowerShell):

```powershell
# Delete dependency/build folders first (they are never submitted)
Remove-Item server\node_modules, client\node_modules, client\dist -Recurse -Force -ErrorAction SilentlyContinue

# Create 24998094_苏楷程_CapstoneProject.zip
Compress-Archive -Path .\README.md, .\CAPSTONE_REQUIREMENTS.md, .\render.yaml, .\docs, .\server, .\client `
  -DestinationPath ..\24998094_苏楷程_CapstoneProject.zip -Force
```

## 12. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `queryTxt ETIMEOUT` / server cannot reach Atlas | The network blocks DNS TXT/SRV lookups. Use the direct seed-list connection string (see Section 7) and allow your IP in Atlas → Network Access. |
| Browser shows CORS error | `CLIENT_ORIGIN` on the API must exactly match the page origin (scheme + host + port, no trailing slash). Restart/redeploy the API after changing it. |
| `429 Too many attempts` while testing login | Lab 19 rate limit (10 per 15 min). Restart the API to clear the in-memory counters, or raise `AUTH_RATE_LIMIT_MAX` locally. |
| Admin dashboard returns `403` | The logged-in account is not an admin. Use `admin@portfolio.dev` or run `npm run admin -- <email>`, then log in again. |
| Blog edit/delete returns `403` | Correct behaviour: only the post's original author may modify it. |
| `VITE_API_URL` change has no effect | Restart `npm run dev` (Vite reads env vars at startup) and rebuild for production. |
| API sleeps on Render | Free-tier cold start (~30 s). Open `/health` first to warm it up before the demo. |

## 13. How this project builds on the labs

The back-end intentionally preserves the Lab 16-19 structure and security
conventions (MVC folders, `utils/` validators, `protect` / `adminOnly`
middleware, `httpError`, the central error handler, Helmet + CORS + 32 KB body
limit + rate limiters) and extends them with the capstone requirements:
`username`-based accounts with roles, comments, the admin inbox and the complete
React client. The previous lab's `/api/posts` alias is kept for compatibility.

---

© 2026 苏楷程 (Su Kaicheng) · Web Data Management and Application capstone.
