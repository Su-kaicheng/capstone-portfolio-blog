# Independent QA test scripts

These scripts were written by the **independent QA verifier** (not by the project author)
to verify the capstone beyond the author's own suites (`server/checks/smoke-test.js` and
`client/src/__tests__/`). The evidence they produced is summarised in
[`QA_REPORT.md`](./QA_REPORT.md).

| Script | What it checks | Count |
| --- | --- | --- |
| `edge-cases.mjs` | Contract edge cases and security behaviour: password-hash leakage, JWT hardening (expiry / audience / issuer / signature / `alg:none`), invalid ObjectIds, duplicate username vs. duplicate email, author-only blog rules for both admin and normal users, admin-only project rules, body parsing (malformed JSON / wrong content type / 32 KB `413`), CORS allow/deny + preflight, Helmet headers, cache headers, orderings, the `/api/posts` alias and the default rate limits on a fresh instance | 209 checks |
| `spa-smoke.mjs` | The real production bundle from `client/dist` executed in jsdom against the real API: all routes, guest `/admin` redirect, auth-aware header, admin UI project CRUD / post create / comment / contact form with `Authorization: Bearer` verified on the wire, no runtime errors, no external network calls | 96 checks |

## Prerequisites

1. Node.js 20+.
2. A running API built from the frozen `server/` code with MongoDB Atlas access
   (the repo's `server/.env` is sufficient).
3. A production build of the client: `cd client; npm run build -- --configLoader native`
   (on a normal developer machine plain `npm run build` also works).
4. `client/node_modules` installed (the SPA probe resolves `jsdom` from there; if it is
   missing the script prints a SKIP notice and exits 0).

## Running the edge-case probe

Use a **separate** API instance for functional probes so the main `:3000` instance is not
rate-limit exhausted, and a **fresh** instance for the default rate-limit checks:

```powershell
# functional target on :3101
cd server; $env:PORT='3101'; npm.cmd start

# fresh default-limit target on :3103 (separate shell)
cd server; $env:PORT='3103'; npm.cmd start

# from the repository root
# (defaults: API_URL=http://localhost:3101, RATE_LIMIT_URL=http://localhost:3103)
node capstone/tests/edge-cases.mjs
```

Notes:

- Against a default-configured API the probe deliberately exhausts the auth limit
  (10 attempts) and the contact limit (5 attempts) on `RATE_LIMIT_URL`, so point that
  variable at a throwaway instance.
- The probe registers one temporary account (usernames cannot be deleted through the API)
  and creates/deletes its own project and post.

## Running the SPA probe

```powershell
cd client; npm.cmd run build -- --configLoader native

# from the repository root
$env:API_TARGET='http://localhost:3101'; node capstone/tests/spa-smoke.mjs
```

Environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `API_TARGET` | `http://localhost:3101` | API the SPA's `fetch` is bridged to |
| `SPA_ORIGIN` | `http://localhost:5173` | Origin simulated in jsdom |
| `QA_SKIP_CONTACT_SUBMIT` | unset | Set to `1` to skip the one live contact-form POST (keeps a shared demo inbox pristine; the POST path is still covered by `edge-cases.mjs` and by a full run when not set) |

The probe reads `JWT_SECRET` from `server/.env` to mint admin/visitor tokens (no login
requests are made, so it does not consume the auth rate limit), and it deletes the
projects/posts it creates. One comment document can remain orphaned when the temporary
comment-target post is deleted — comments are not cascade-deleted by the API (see
MINOR-3 in the report).

## Requirements

- No browser automation is required: the SPA probe runs the bundle inside jsdom (no
  spawning of browsers or child processes).
- On locked-down shells where Vite cannot spawn its config loader, always use
  `--configLoader native` for builds (same workaround as the production build).
