# Capstone Requirements — Full-Stack Portfolio & Blog Application

Course: Web Data Management and Application · Total marks: 100

This file distils the official project specification so both the back-end and the
front-end can be built and checked against the same checklist. The API contract
lives in `docs/API_CONTRACT.md`.

## Deliverables

1. Live front-end URL (deployed SPA, e.g. Vercel/Netlify).
2. Live back-end URL (deployed API, e.g. Render).
3. Source ZIP (`StudentID_StudentName_CapstoneProject.zip`) containing `server/`
   and `client/`, with all `node_modules` removed.
4. Root `README.md` with overview, live links, API endpoint list, local setup.

## Back-end (50 marks)

| Category | Weight | What is checked |
| --- | --- | --- |
| Database & models | 10 | Mongoose schemas User / Project / BlogPost / Comment / Message with validation; MongoDB Atlas connection. |
| Auth & authorization | 12 | Register + login, bcrypt hashing, JWT generation, `protect` middleware, author-only blog mutations, admin-only project writes. |
| CRUD endpoints | 10 | All project + blog endpoints (public reads, protected writes) and correct authorization logic. |
| Relationships & features | 8 | Comments on posts, contact messages, `populate()` of authors/users. |
| Structure & error handling | 5 | Clean MVC structure, central error middleware with consistent JSON errors. |
| Security & deployment | 5 | helmet, dotenv, rate limits, live deployed API. |

Required models (official spec):

- **User**: `username` (String, required, unique), `email` (String, required,
  unique), `password` (String, required, minlength 6), hashed with bcrypt.
- **Project**: `title`, `description`, `imageUrl`, `repoUrl`, `liveUrl`,
  `user` (ObjectId ref User, required).
- **BlogPost**: `title`, `content`, `author` (ObjectId ref User, required),
  timestamps.
- **Comment**: `body`, `author` (ObjectId ref User), `post` (ObjectId ref
  BlogPost), timestamps.
- **Message**: `name`, `email`, `message`, timestamps.

Required endpoints: see `docs/API_CONTRACT.md`.

## Front-end (50 marks)

| Category | Weight | What is checked |
| --- | --- | --- |
| React architecture & design | 10 | Responsive modern styling, reusable components, props. |
| Routing | 8 | All routes work; `/admin` protected and redirects unauthenticated users. |
| API integration (public) | 10 | `/projects`, `/blog`, `/blog/:id` fetch from live API; contact form works. |
| Auth flow & global state | 10 | Login/Register pages, Auth Context, auth-aware header. |
| API integration (protected) | 10 | Admin dashboard creates/updates/deletes projects and posts with JWT; commenting works. |
| Deployment | 2 | Deployed SPA talks to deployed API, polished and bug-free. |

Required routes:

- Public: `/` (Home/About), `/projects` (gallery), `/blog` (list),
  `/blog/:id` (detail with comments), `/contact`, `/login`, `/register`.
- Protected: `/admin` (dashboard to manage projects, posts and view messages).

Required behaviour:

- `useState` for all component state; `useEffect` for fetching; explicit
  "Loading..." and "Error" rendering during API calls.
- Controlled forms for contact, login, register, comments and admin forms.
- Auth Context provides token, user, login/logout to the whole app; header shows
  Login/Register or username + Admin + Logout depending on state.
- Admin requests send `Authorization: Bearer <token>`; all CRUD works from the UI.
- Modern styling approach: Tailwind CSS v4 (used), responsive, professional.

## Rubric checklist to demo in the viva

1. Register a new account → auto login, header updates, JWT stored.
2. Browse projects and blog as a guest; open a post; read comments.
3. Log in as `admin@portfolio.dev` / `Admin123!`; open `/admin`.
4. Create, edit and delete a project and a blog post from the dashboard.
5. Post a comment on a blog post; refresh and see it.
6. Send a contact message; see it in the admin Messages inbox.
7. Show that `/admin` redirects when logged out and that deleting someone
   else's post is rejected (403) — open the API URL to show it is live.
