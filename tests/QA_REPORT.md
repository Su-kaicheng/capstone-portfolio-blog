# Independent QA Report — Full-Stack Portfolio & Blog Capstone

**Project:** `capstone/` — Express + Mongoose REST API (`server/`), React 19 + Vite 8 SPA (`client/`), MongoDB Atlas
**Course:** Web Data Management and Application · Student 24998094 · 苏楷程 (Su Kaicheng)
**Verifier:** independent QA (not an author of the project code)
**Date:** 2026-11-01 (Asia/Shanghai) · **Verified snapshot:** frozen at ~12:08 (+08:00)
**Reference documents:** `CAPSTONE_REQUIREMENTS.md`, `docs/API_CONTRACT.md`, `README.md`

**QA write scope:** only `capstone/tests/**`. No application file, README, document or
server/client source was modified by the verifier. All issues found were reported to the
project Lead, who fixed the document/test items listed in §6.1.

---

## 1. Overall verdict

### ✅ PASS — submission-ready for the code + documentation deliverables

| Area | Weight | Verdict |
| --- | --- | --- |
| Back-end: models, auth, CRUD, relationships, error handling, security | 50 marks | **PASS** (51/51 contract smoke, 209/209 independent edge checks) |
| Front-end: architecture, routing, public/protected API integration, auth flow | 50 marks | **PASS** (96/96 full headless-SPA checks; 10/10 author Vitest suite) |
| Production build of the SPA | — | **PASS** (56 modules, deterministic, no external resources) |
| Root README + API contract + requirements alignment | — | **PASS**, with the minor notes in §6.2 |
| Live deployment URLs | — | **Not verifiable offline** — README still uses placeholders (INFO-1) |

**No blocker and no major defect was found.** Every endpoint, model, authorisation rule,
security control, required route and rubric behaviour was exercised against the real
Express/Mongoose API and the real production SPA bundle. Two classes of small defects were
found, and the Lead fixed the documentation/test ones during the verification round (§6.1);
the remaining items are cosmetic/cleanliness notes (§6.2).

---

## 2. Verification environment & method

### 2.1 Snapshot verified

| Item | Detail |
| --- | --- |
| Server source | last modified **11:49:51** (before QA started → never changed during verification) |
| Client application source | last modified **11:54:57** (never changed during verification) |
| Docs / README / client tests | final revision **12:08:18** (frozen by the Lead) |
| SPA production build | rebuilt after the freeze — `dist/assets/index-CJotENvB.js`, `index-BG_dWO-7.css` |
| MongoDB | Atlas cluster, database `portfolio_blog`; final visible state = **2 users, 3 projects, 3 posts, 3 comments, 1 contact message** (re-verified after the Lead's clean-up and again after the final QA run) |

### 2.2 Method (no browser automation available)

| Probe | Location | Purpose |
| --- | --- | --- |
| Author's contract smoke test | `server/checks/smoke-test.js` | Re-ran the shipped suite once against the Lead's API on `:3000` |
| **Independent edge-case probe** | `tests/edge-cases.mjs` (new) | Deep API/security/validation probes against isolated instances `:3101` (functional) and `:3103` (fresh default rate limits), so `:3000` was never rate-limit-exhausted |
| **Independent headless SPA probe** | `tests/spa-smoke.mjs` (new) | Boots the real `client/dist` bundle inside jsdom, bridges `fetch` to the real API, drives routes/forms/clicks like a browser |
| Author's client Vitest suite | `client/src/__tests__/` | Ran the full suite (10 tests) and, after the Lead's fix, the fixed admin spec on frozen code |
| Production build | `npm.cmd run build -- --configLoader native` | Rebuilt after freeze; confirmed output and determinism (two consecutive builds produced identical hashes) |

Toolchain: Node.js v24.20.0 · Vite 8.3.5 · React 19.2 · React Router 7 · Tailwind CSS 4.3.3 ·
Express 5.3 · Mongoose 9.11 · Vitest 5.0.5 · jsdom 30.1.3.

Isolated API instances were started only from the frozen `server/` code with the real
`server/.env`, on ports `:3101` (functional probes) and `:3103` (fresh default limits), and
stopped afterwards. `:3000` (the Lead's instance) was only used for the one shipped smoke
run and read-only clean-state checks; during the final phase it ran with
`AUTH_RATE_LIMIT_MAX=100` as notified by the Lead, which is why default rate-limit
behaviour was verified on the fresh `:3103` instance instead.

### 2.3 Summary of executed suites

| Suite | Target | Result |
| --- | --- | --- |
| `server/checks/smoke-test.js` (author's) | `http://localhost:3000` | **51 passed / 0 failed** — `All contract checks passed.` |
| `tests/edge-cases.mjs` (independent) | `:3101` functional + `:3103` default limits | **209 passed / 0 failed** |
| `client` Vitest suite (author's) | live API (`:3101`, full suite) | **10 passed / 0 failed** (2 smoke + 8 integration) |
| `tests/spa-smoke.mjs` (independent, full) | `:3101`, real `dist` | **96 passed / 0 failed** |
| `tests/spa-smoke.mjs` (independent, frozen dist re-run, live contact POST skipped to keep the shared DB pristine) | `:3101`, real `dist` | **92 passed / 0 failed** (+1 intentional SKIP) |
| Fixed admin integration spec (targeted re-run on frozen code) | `:3000` | **1 passed** (creates + deletes its own project/post → net-zero DB writes) |
| `npm.cmd run build -- --configLoader native` | `client/` | **PASS** — 56 modules transformed in 231 ms |

---

## 3. Back-end verification (50 marks)

### 3.1 Database & models — PASS (10/10 rubric category)

Evidence: `server/models/*.js`, live payload shapes, live validation responses.

| Requirement | Result | Evidence |
| --- | --- | --- |
| `User` schema: username required/unique 3–30, email required/unique, password min 6 hashed with bcrypt, role `user|admin` | PASS | `server/models/User.js:6-46`; registered account returned `role:"user"`; duplicate username/email → `409` with field-named messages; login successful only with the correct password against the bcrypt hash |
| `Project` schema: title/description/imageUrl/repoUrl/liveUrl/user ref required | PASS | `server/models/Project.js:23-49`; GET payload contains all fields + populated `user` |
| `BlogPost` schema: title/content/author ref + timestamps | PASS | `server/models/BlogPost.js:3-27`; `createdAt`/`updatedAt` present in responses |
| `Comment` schema: body/author/post + timestamps | PASS | `server/models/Comment.js:3-29`; comment created through the API returns populated author and `post` id |
| `Message` schema: name/email/message + timestamps | PASS | `server/models/Message.js:5-29`; admin inbox items carry all fields + timestamps |
| Server-side validation on every writable field | PASS | `server/utils/validators.js`; probes: short/blank/oversized/invalid-type fields → `400` with JSON error shape |
| MongoDB Atlas connection | PASS | `GET /health` → `{"status":"ok","db":"connected"}`; `server/config/db.js:4-12` |

### 3.2 Authentication & authorisation — PASS (12/12 rubric category)

| Check | Result | Evidence |
| --- | --- | --- |
| Register hashes password + returns JWT + safe user | PASS | `POST /api/users/register` → `201 { success, token, user }`; `user` has `_id/username/email/role/createdAt/updatedAt`, **never** `password` |
| Login verifies bcrypt hash | PASS | wrong password → `401 "Invalid email or password"`; unknown email → identical message (no account enumeration) |
| JWT: HS256, 7-day expiry, issuer `portfolio-blog-api`, audience `portfolio-client`, subject = user id | PASS | decoded token claims; expiry delta `604800 s` |
| `protect` middleware attaches the DB user | PASS | `server/middleware/protect.js:9-38`; `GET /api/users/me` returns the current user |
| Token hardening: no token / Basic scheme / malformed / expired / wrong audience / wrong issuer / wrong signature / tampered payload / `alg:none` / valid token for deleted account | PASS | all → `401` with `{ error: { message } }`; expired token message: *"Session expired, please log in again"*; deleted account: *"…account no longer exists"* |
| Role in the request body is ignored (new accounts always `user`) | PASS | registration body `{ role: "admin" }` → stored/returned role `user` |
| `user` / `author` fields are always taken from the JWT, never from the body | PASS | project create with injected `user: <visitor id>` → owner stayed the admin; post create with injected `author` → author stayed the JWT user |
| Admin-only project writes | PASS | visitor POST/PUT/DELETE `/api/projects*` → `403` |
| Author-only blog writes (admin is also rejected on someone else's post) | PASS | admin PUT/DELETE a visitor's post → `403`; visitor PUT/DELETE the seeded admin post → `403`; author's own post update/delete → `200`/`204` |

### 3.3 CRUD endpoints, status codes and error format — PASS (10/10 rubric category)

Every endpoint in `docs/API_CONTRACT.md` exists and behaves as documented:

- `GET /health`, `GET /` → `200` with expected bodies.
- Users: `POST /api/users/register` `201`, `POST /api/users/login` `200`, `GET /api/users/me` `200`.
- Projects: `GET /api/projects` `200` newest-first, `GET /api/projects/:id` `200`, `POST` `201`, `PUT` `200`, `DELETE` `204` empty body.
- Blog: `GET /api/blog` `200` newest-first, `GET /api/blog/:id` `200` detail+comments, `POST` `201`, `PUT` `200`, `DELETE` `204`; legacy alias `GET/POST /api/posts*` works identically.
- Comments: `GET /api/blog/:postId/comments` `200`, `POST` `201`; unknown post → `404`, invalid postId → `400`.
- Contact: `POST /api/contact` `201 { id, message: "Message received" }`, `GET /api/contact` admin `200` (+`Cache-Control: no-store`), anonymous `401`, non-admin `403`.

Status-code matrix verified live: `200`, `201`, `204` (empty body), `400` (validation / malformed JSON / invalid ObjectId / empty update), `401`, `403`, `404` (unknown route + unknown record, JSON not HTML), `409` (duplicate username and duplicate email separately), `413` (JSON body > 32 KB), `429` (both rate limits, JSON error shape). Every error body was the documented `{ "error": { "message": "…" } }` shape (`server/middleware/errorHandler.js:7-44`, `notFound.js:3-5`).

### 3.4 Relationships & features — PASS (8/8 rubric category)

- Project lists/details populate `user` as `{ _id, username }` only.
- Blog lists/details populate `author` as `{ _id, username }` only; post detail embeds the populated comments array.
- Comment lists/details populate `author`; comments are bound to both user and post.
- Contact messages are stored and readable only from the admin inbox.
- No response anywhere contained an `email` inside a populated relation or any bcrypt hash.

### 3.5 Structure & error handling — PASS (5/5 rubric category)

Clean MVC layout (`config/`, `models/`, `controllers/`, `routes/`, `middleware/`, `utils/`,
`scripts/`, `checks/`), one central error middleware, consistent JSON errors, 404 JSON
handler, and small single-purpose modules. Verified by code review + live probes.

### 3.6 Security & deployment readiness — PASS (5/5 rubric category)

| Control | Result | Evidence |
| --- | --- | --- |
| `helmet()` headers | PASS | `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, clickjacking protection; `X-Powered-By` absent |
| CORS allow-list + preflight | PASS | `Access-Control-Allow-Origin` returned for `CLIENT_ORIGIN`; preflight `204` allows `GET,POST,PUT,DELETE,OPTIONS` and `Authorization, Content-Type`; a disallowed origin (`http://evil.example.com`) receives **no** ACAO header |
| 32 KB JSON body limit → `413` | PASS | oversized payload → `413 {"error":{"message":"JSON body exceeds the 32 KB limit"}}` |
| Shared auth rate limit 10 / IP / 15 min | PASS | fresh default instance: first 10 attempts allowed, 11th → `429`; policy header `10;w=900` |
| Contact limit 5 / IP / 15 min | PASS | first 5 parsed submissions pass the limiter, 6th → `429`; policy header reflects 5 |
| Auth + inbox `Cache-Control: no-store` | PASS | login/register/me + inbox responses verified; rate-limit 429s also carry it |
| Passwords hashed, never returned | PASS | recursive scan of every captured response (lists, details, comments, inbox, auth, errors) → no `password` key and no `$2a/$2b$` bcrypt string |
| Secrets from `.env` (not hard-coded) | PASS | `server/config/env.js:1-21`; `.env` is git-ignored; repo `.gitignore` / `server/.gitignore` exclude `.env` |
| Deployment configuration | PASS (static) | `render.yaml` (`rootDir: server`, `npm start`, health check `/health`, `TRUST_PROXY=1`), `client/vercel.json` SPA rewrite; README §10 matches both |

---

## 4. Front-end verification (50 marks)

Method: static review of every source file under `client/src` **plus** the independent jsdom
probe that evaluated the real production bundle and drove the real API — including real
clicks, controlled-input typing, form submits and the network calls they produce.

### 4.1 React architecture & design — PASS (10/10)

35 source files reviewed; reusable, props-driven components (`Header`, `Footer`,
`ProtectedRoute`, `ProjectCard`, `BlogPostCard`, `CommentList`, `CommentForm`, `Loader`,
`ErrorState`, `EmptyState`, `Field`, `Button`, `Alert`, `ProjectMedia`, `PageHeader`,
`RoleBadge`, `Icons`, `AdminProjectForm`, `AdminPostForm`); responsive Tailwind CSS v4 with
mobile navigation (hamburger sheet, Escape closes, closes on navigation); inline hand-written
SVG icon set (no external asset dependency); accessible labels/`aria-*`/focus states,
reduced-motion support. Rendering is always text-based (no `dangerouslySetInnerHTML`).

### 4.2 Routing — PASS (8/8)

All required routes render and were exercised headlessly:

| Route | Result | Evidence |
| --- | --- | --- |
| `/` | PASS | hero + seeded projects + latest posts rendered from the API |
| `/projects` | PASS | all 3 seeded projects rendered |
| `/projects/:id` (extra detail route) | PASS | renders project detail |
| `/blog` | PASS | all 3 seeded posts rendered |
| `/blog/:id` | PASS | post + seeded comments rendered |
| `/contact` | PASS | controlled contact form rendered |
| `/login`, `/register` | PASS | controlled forms rendered; authenticated users redirected away |
| `/admin` protected | PASS | guest is redirected to `/login` and the login page renders; intended destination is preserved in router state |
| `*` (404) | PASS | friendly 404 page |
| unknown post id | PASS | "Post not found" empty state |

### 4.3 API integration (public) — PASS (10/10)

- `/projects`, `/blog`, `/blog/:id` fetch from `VITE_API_URL` via the single API layer
  (`client/src/lib/api.js`, default `http://localhost:3000`).
- Every data page implements `useState` + `useEffect` with explicit loading skeletons /
  "Error" states and retry actions (`Loader.jsx`, `ErrorState.jsx`; Home/Projects/Blog/
  BlogDetail/ProjectDetail/AdminDashboard).
- Contact form: client-side validation blocks the request when empty (verified: no network
  call), then a valid submit POSTs to `/api/contact` without an `Authorization` header and
  shows the "Message received" receipt with a reference number (verified on the wire and in
  the DOM). The success path was proven against the real API.

### 4.4 Auth flow & global state — PASS (10/10)

- `AuthContext` (`client/src/context/AuthContext.jsx`) owns `user`, `token`, `loading`,
  `isAuthenticated`, `login`, `register`, `logout`; persists token + user in `localStorage`
  and verifies the stored session with `GET /api/users/me`.
- Auth-aware header: guest sees **Log in / Register**; authenticated sees username + role
  badge + **Admin** link + **Log out**; footer exposes the admin link only when
  authenticated. All three header states were observed in the headless probe.
- Invalid/expired stored JWT: session cleared from `localStorage` and `/admin` redirects to
  `/login` (verified).
- Register auto-logs in; login restores the intended protected destination
  (`ProtectedRoute` passes `state.from`, `Login` redirects back).
- All verified `fetch` calls from the SPA went to the configured API origin only — no CDN,
  no third-party calls.

### 4.5 API integration (protected) — PASS (10/10)

Verified end-to-end by driving the built UI against the real API and inspecting the actual
request headers (all mutating requests carried `Authorization: Bearer <token>`):

- Admin dashboard project **create → edit → delete** from the UI (form → API → list refresh;
  delete asks for confirmation first; DB checked after each step).
- Admin dashboard blog post **create** from the UI (`Publish post`) with the admin as author.
- Author-only UI: posts by other authors show an "Author only" lock and no edit/delete
  controls for the current user; server enforces the same rule with `403`.
- Normal-user dashboard is read-only for projects ("Read-only access") and shows
  "Inbox is admin-only" for messages; admin sees the inbox with a Bearer-authenticated
  `GET /api/contact` and a Refresh control.
- Commenting from `/blog/:id` as an authenticated user: controlled textarea → POST →
  success alert → comment appended to the thread and persisted by the API.
- Form feedback/error alerts, loading skeletons and empty states all render; no runtime
  errors or React warnings were observed on any route.

### 4.6 Build & deployment readiness — PASS (2/2 deployment rubric, static part)

- Production build: `56 modules transformed`, `dist/index.html` + hashed CSS/JS, gzip
  ~103.8 kB JS / 9.56 kB CSS, build deterministic (two consecutive builds identical SHA-256).
- `dist/index.html` references only local, hashed assets (no external `<script>`/`<link>`);
  no external CDN, web-font or icon dependency anywhere in source or dist. The only
  `https://` strings in the bundle are library error-message URLs / license comments /
  SVG namespaces, not network resources.
- `client/vercel.json` rewrites all routes to `/index.html` (deep links survive refresh);
  `VITE_API_URL` wired through `client/src/lib/api.js:8` and documented in
  `client/.env.example`.

---

## 5. Documentation audit (README.md, docs/API_CONTRACT.md, CAPSTONE_REQUIREMENTS.md)

| README section | Result | Notes |
| --- | --- | --- |
| §1 Live deployment | PASS (placeholders) | front-end/API/health URL placeholders present; replacement instructions given (see INFO-1) |
| §2 Demo accounts | PASS | admin **and** visitor match `server/scripts/seed.js`; promote-admin command matches `scripts/promoteAdmin.js` |
| §3 Technology stack | PASS | versions/dependencies match `package.json` files and code |
| §4 Project structure | PASS | every referenced path exists (23/23 checked, including the new `client/src/__tests__/`) |
| §5 Feature checklist | PASS | claims match verified behaviour |
| §6 Quick start (server + client + tests) | PASS | commands work as documented; smoke assertion count now correctly states **51**; client test section matches the 2 smoke + 8 integration tests that exist |
| §7 Environment variables | PASS | all variables match `server/config/env.js`; `.env.example` files exist; CORS dev behaviour clarified |
| §8 API documentation | PASS | all tables/bodies/status codes match implementation; alias, rate limits and cache headers documented |
| §9 Data models | PASS | matches Mongoose schemas |
| §10 Deployment guide | PASS | matches `render.yaml`, `client/vercel.json` and the code's env requirements |
| §11 Submission checklist | PASS | archive command updated (includes `render.yaml`); `.env` inclusion is explicitly disclosed by the author (see MINOR-4) |
| §12 Troubleshooting | PASS | rate-limit/CORS/403/VITE_API_URL/Atlas notes are accurate |
| `docs/API_CONTRACT.md` | PASS | error format, shapes, endpoints, validation, security behaviour and demo accounts all match live behaviour |
| `CAPSTONE_REQUIREMENTS.md` | PASS | every listed model, endpoint, route and rubric item is implemented and verified |

---

## 6. Defect list (severity-ranked)

### 6.1 Fixed during the verification round (all re-verified after the fix)

| ID | Severity | Finding | Status / verification |
| --- | --- | --- | --- |
| DOC-1 | minor | `docs/API_CONTRACT.md` "Demo accounts" table listed only the admin account although the seed creates the `visitor@portfolio.dev` account too | **FIXED** — table now lists both accounts (`docs/API_CONTRACT.md:122-132`); cross-checked against `server/scripts/seed.js:18-30` |
| DOC-2 | minor | Contract said `password` is "6–72 characters", while the API enforces the bcrypt **72-byte** limit (a 40-char multibyte password is rejected with `400`) | **FIXED** — wording now "6–72 characters (at most 72 UTF-8 bytes, the bcrypt limit)" (`docs/API_CONTRACT.md:61-63`); behaviour verified as `400` |
| DOC-3 | minor | README claimed CORS only allows `CLIENT_ORIGIN`, while development mode also accepts any `localhost`/`127.0.0.1` port (`server/app.js:17,26`) | **FIXED** — README §7 env table now explains the development-only localhost allowance and the production strictness (`README.md:233`) |
| DOC-4 | minor | README §6.4 previously said the smoke test executes "~55 assertions"; the shipped suite runs **51** | **FIXED** — README now states 51 (`README.md:207`); measured `RESULT: 51 passed, 0 failed` |
| TEST-1 | minor | `client/src/__tests__/integration.test.jsx:191` asserted `/post created/i` although the dashboard feedback is "Post published." — it only passed accidentally because the post *content* contained the phrase "post created" | **FIXED** — assertion is now `/post published/i` and the post content was reworded (`integration.test.jsx:191`); targeted re-run on frozen code: **1/1 PASS** |

### 6.2 Open minor / informational items (none blocking submission)

| ID | Severity | Finding | Recommendation |
| --- | --- | --- | --- |
| MINOR-1 | minor (cleanliness) | Every Mongoose payload includes a `__v` field (e.g. `Project` keys = `_id,title,description,imageUrl,repoUrl,liveUrl,user,createdAt,updatedAt,__v`), which is not part of the documented data shapes (`docs/API_CONTRACT.md:23-42`) | Optional: add `versionKey:false` to the schemas or `.select('-__v')` in responses. Harmless extra field; contract consumers ignore it. |
| MINOR-2 | minor (environment-specific docs) | Plain `npm test` fails in this locked-down sandbox with Vite's `spawn EPERM` (same root cause as the known `npm run build` issue). The working command is documented only in a code comment (`client/src/__tests__/integration.test.jsx:13`) and in `client/README.md:80-91` for build/dev, not in README §6.5 | Optional: add the one-line workaround `node node_modules/vitest/vitest.mjs run --config vitest.config.mjs --configLoader native --pool=threads` to README §6.5 / client README "Tests". On a normal developer machine `npm test` works as documented. |
| MINOR-3 | minor (data hygiene) | Deleting a blog post does not cascade-delete its comments (`server/controllers/blogController.js:56-62`), so comment documents can become orphaned. They are unreachable (comments for a deleted post → `404`) and not counted in any public response, but they accumulate in MongoDB | Optional: delete the post's comments in the same handler, or accept as documented behaviour (the contract does not require cascade). |
| MINOR-4 | minor (security risk, disclosed) | README §11 deliberately includes `server/.env` (real Atlas connection string + JWT secret) in the submission ZIP so the marker can run it; the README discloses this and warns to delete/rotate before public release (`README.md:416-421`) | Accepted author decision. Recommendation: rotate the Atlas database password and JWT secret after grading, and never publish the ZIP or repo with `.env`. |
| MINOR-5 | cosmetic | Copy still says "capstone in progress" after completion (`client/src/pages/Home.jsx:194` — "status: capstone in progress"; `client/src/components/Footer.jsx:42` — "Capstone project · in progress") | Optional wording change for the final submission, e.g. "Capstone project · 2026". |
| INFO-1 | informational (deliverable pending a deploy) | Required live URLs are placeholders: `https://<your-frontend>.vercel.app`, `https://<your-api>.onrender.com` (`README.md:22-24`) | Must be replaced with the real Vercel/Render URLs before the Chaoxing submission; deployment configuration itself is correct and static-verified. |

---

## 7. Evidence appendix

### 7.1 Command log excerpts

**Author's contract smoke test (`cd server; npm.cmd run smoke` against `:3000`)**

```
Portfolio & Blog API contract smoke test
Target: http://localhost:3000
...
RESULT: 51 passed, 0 failed
All contract checks passed.
```

**Independent edge-case probe (`tests/edge-cases.mjs`, `:3101` + `:3103`)**

```
RESULT: 209 passed, 0 failed
All independent edge-case checks passed.
## 14. Default rate limits on a fresh instance
  PASS  first 10 auth attempts are allowed (default limit 10) [200,401,401,401,401,401,401,401,401,401,429]
  PASS  11th auth attempt within the window -> 429 [expected 11, got 11]
  PASS  429 auth response uses the JSON error shape [{"error":{"message":"Too many attempts. Try again in 15 minutes."}}]
  PASS  first 5 contact submissions pass the limiter and fail validation (default limit 5) [400,400,400,400,400,429]
  PASS  6th contact submission -> 429 [expected 429, got 429]
```

**Author's client Vitest suite (full run, live API)**

```
 ✓ src/__tests__/smoke.test.jsx (2 tests)
 ✓ src/__tests__/integration.test.jsx (8 tests) 26089ms
 Test Files  2 passed (2)
      Tests  10 passed (10)
```

**Targeted re-run of the fixed admin spec on frozen code**

```
 ✓ src/__tests__/integration.test.jsx (8 tests | 7 skipped) 13155ms
   ✓ admin can log in and manage projects, posts and the inbox
 Tests  1 passed | 9 skipped (10)
```

**Independent headless SPA probe (full, before freeze; real `dist` + real API)**

```
RESULT: 96 passed, 0 failed
All SPA smoke checks passed.
```

**Independent headless SPA probe on the frozen rebuild (live contact POST skipped to keep
the shared DB inbox pristine — the POST path was already proven in the full run)**

```
RESULT: 92 passed, 0 failed
All SPA smoke checks passed.
  SKIP  live contact submission (QA_SKIP_CONTACT_SUBMIT=1 keeps the shared database inbox pristine)
```

**Final production build (frozen sources)**

```
vite v8.3.5 building client environment for production...
✓ 56 modules transformed.
dist/index.html                   1.06 kB │ gzip:   0.60 kB
dist/assets/index-BG_dWO-7.css   57.62 kB │ gzip:   9.56 kB
dist/assets/index-CJotENvB.js   357.94 kB │ gzip: 103.80 kB
✓ built in 231ms
```

Deterministic artifacts (two consecutive frozen builds identical):

```
dist/index.html                  SHA256 602C217F760C15372E7E313C91CE206D842AAB014EB5D6F1E6341711FF016DE4
dist/assets/index-CJotENvB.js    SHA256 08B69D8E600E13EB698D5B10568A3F2080D0596BA2E4726897120425FF48BB9E
dist/assets/index-BG_dWO-7.css   SHA256 8C12D4A64665052E351EC5CDF3AFD323FB7D164D2C72400738A1312D3F50A717
```

**Clean-state snapshot of the shared database (after all QA runs)**

```
admin login:   role=admin username=kaicheng tokenParts=3
visitor login: role=user  username=visitor
inbox count: 1        (inbox[0]: name=Ming Zhao)
counts: users=2 projects=3 posts=3 comments=3
```

### 7.2 Security sweep

- Recursive scan of **every** response captured by the edge probe (well over 100 HTTP
  responses, including auth, lists, details, comments, inbox and all error bodies) for a
  `password` key or a `$2a$/$2b$` bcrypt string: **0 findings**.
- 9 JWT tampering variants (missing token, Basic scheme, malformed, expired, wrong
  audience, wrong issuer, wrong signature, tampered payload, `alg:none`, deleted account)
  all returned `401` with the documented JSON error shape.
- CORS denials verified for a non-allow-listed origin; Helmet headers verified; no
  `X-Powered-By`; 32 KB limit verified.
- Default secrets are min length enforced (`JWT_SECRET` ≥ 32 chars, `server/config/env.js:14-16`).

### 7.3 Test data and residual state

The independent probes create and delete their own projects/posts, and the final visible
database state was verified to be exactly the seed state (2 users / 3 projects / 3 posts /
3 comments / 1 message) after QA finished. Because post deletion does not cascade comments
(MINOR-3), the temporary post used by the comment-form probe leaves one orphaned comment
document; it is not reachable through any endpoint (comments for the deleted post → `404`)
and does not appear in any public count.

### 7.4 QA artifacts (inside `capstone/tests/`)

| File | Description |
| --- | --- |
| `QA_REPORT.md` | this report |
| `edge-cases.mjs` | 209-check independent API/security edge-case probe (`API_URL`, `RATE_LIMIT_URL`) |
| `spa-smoke.mjs` | 96-check independent headless SPA probe of the production bundle (`API_TARGET`; `QA_SKIP_CONTACT_SUBMIT=1` for a non-polluting run) |
| `README.md` | how to run the two probes |

---

## 8. Sign-off

All rubric items required by `CAPSTONE_REQUIREMENTS.md` are implemented and were verified
against the real API, the real production SPA bundle and the live MongoDB Atlas data.
The documented fixes from this verification round were re-checked on the frozen snapshot.
No blocker or major defect remains; only the minor documentation/cleanliness items in §6.2
and the deployment URLs pending a live deploy (INFO-1).

**Recommendation: submit after filling in the deployed front-end/back-end URLs.**

---

## 9. Lead addendum — post-QA fixes (2026-11-01, ~12:20 +08:00)

After the QA snapshot, the remaining minor items were fixed and re-verified by the project Lead:

| Item | Fix | Re-verification |
| --- | --- | --- |
| MINOR-5 (copy) | `client/src/pages/Home.jsx:194` → "status: shipped · v1.0"; `client/src/components/Footer.jsx:42` → "Capstone project · 2026" | SPA rebuilt successfully (56 modules, 229 ms) |
| MINOR-3 (orphaned comments) | `server/models/BlogPost.js` now cascades comment deletion in a `pre('deleteOne', { document: true })` hook; the orphaned comment from QA was removed from the database | Backend contract smoke re-run: **51/51 PASS** (includes create-comment → delete-post flow) |
| MINOR-2 (docs) | README §6.5 now documents the `--configLoader native` workaround for restricted shells | Docs review |
| MINOR-1 (`__v`) | Accepted: standard Mongoose version key, harmless extra field not used by the client | — |

Final client suite re-run on the post-QA code: **10/10 PASS**. Final database state remains
exactly the seed state: **2 users / 3 projects / 3 posts / 3 comments / 1 message**.

Remaining open item: **INFO-1** — live deployment URLs are still placeholders; they must be
filled in after deploying to Vercel (front-end) and Render (back-end) as described in README §10.
