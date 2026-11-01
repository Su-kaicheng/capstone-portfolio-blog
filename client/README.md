# Portfolio & Blog — Client (React SPA)

Front-end for the Full-Stack Portfolio & Blog capstone.
Course: **Web Data Management and Application** · Student: **Su Kaicheng (苏楷程)** · ID: **24998094**

## Stack

- **React 19** + **Vite 8** (JavaScript / JSX)
- **React Router 7** for client-side routing
- **Tailwind CSS v4** via `@tailwindcss/vite` (tokens in `src/index.css`)
- **Context API** auth state, JWT persisted in `localStorage` and verified on boot
- One API layer (`src/lib/api.js`) — the app never calls `fetch` directly elsewhere

## Run locally

```bash
npm install
cp .env.example .env        # optional — VITE_API_URL defaults to http://localhost:3000
npm run dev                 # http://localhost:5173
```

The API from `../server` must be running: `cd ../server && npm run seed && npm run dev`.
Demo admin account: `admin@portfolio.dev` / `Admin123!`.

## Scripts

| Command         | Purpose                                    |
| --------------- | ------------------------------------------ |
| `npm run dev`   | Vite dev server on port 5173 (HMR)         |
| `npm run build` | Production build to `dist/`                |
| `npm run preview` | Serve the production build locally       |

## Routes

| Route           | Access    | Description                                        |
| --------------- | --------- | -------------------------------------------------- |
| `/`             | public    | Hero, about, skills, featured projects, latest posts |
| `/projects`     | public    | Project gallery from `GET /api/projects`           |
| `/projects/:id` | public    | Project detail                                     |
| `/blog`         | public    | Blog list from `GET /api/blog`                     |
| `/blog/:id`     | public    | Post detail + comments (commenting requires login) |
| `/contact`      | public    | Contact form → `POST /api/contact`                 |
| `/login`        | guest     | Login, redirects authenticated users               |
| `/register`     | guest     | Registration with auto-login                       |
| `/admin`        | protected | Project/post CRUD + messages inbox                 |
| `*`             | public    | Friendly 404                                       |

## Structure

```
src/
  components/   reusable UI (Header, Footer, cards, forms, states, icons)
  context/      AuthContext — user, token, login, register, logout
  lib/          api.js (single API layer), format.js, validation.js
  pages/        one component per route
```

## Tests

```bash
npm test          # Vitest: smoke tests + integration suite
npm run test:watch
```

- `src/__tests__/smoke.test.jsx` — guest rendering and 404 routing; runs without a backend.
- `src/__tests__/integration.test.jsx` — drives the real UI against the running API:
  home/projects/blog data, blog detail, guest `/admin` redirect, contact form, admin login +
  project CRUD + post CRUD + messages inbox, visitor commenting and registration. The suite
  **skips automatically** when the API is not reachable, so `npm test` still passes without a
  back-end. To run it against the demo data: start `../server` (`npm start`) and seed it once
  (`npm run seed`).

## Deployment

`npm run build` emits a static bundle in `dist/`. `vercel.json` rewrites every
path to `/index.html` so client-side routes survive a refresh. Set the
`VITE_API_URL` environment variable to the deployed API origin in the hosting
dashboard, and make sure the API's `CLIENT_ORIGIN` includes the deployed SPA.

## Build notes

If a locked-down/agent shell blocks Vite from bundling its config file (the
build stops with `spawn EPERM` inside `optimizeSafeRealPathSync`), load the
Vite config natively instead — the emitted bundle is identical:

```bash
npm run build -- --configLoader native
npm run dev -- --configLoader native
```

On a normal developer machine the plain `npm run build` command works as-is.
