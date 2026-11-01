/**
 * Independent QA edge-case probe for the Portfolio & Blog API.
 *
 * Authored by the QA verifier (not by the project author) to cover behaviour the
 * bundled `server/checks/smoke-test.js` does not reach: password-hash leakage,
 * JWT hardening (expiry / audience / issuer / signature / alg=none), invalid
 * ObjectIds, duplicate username vs. duplicate email, author-only blog rules,
 * project admin-only rules, request-body parsing (malformed / wrong content
 * type / 32 KB limit), CORS allow/deny behaviour, Helmet headers, cache headers
 * and the default rate limits on a freshly started instance.
 *
 * Usage (Node 20+; the API must already be running):
 *
 *   node capstone/tests/edge-cases.mjs
 *
 * Environment variables:
 *   API_URL          functional target          (default http://localhost:3101)
 *   RATE_LIMIT_URL   fresh default-limit target (default http://localhost:3103)
 *
 * 3101: normal functional probes (no rate-limit exhaustion).
 * 3103: a freshly started instance used only to exhaust the default limits.
 */

import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import { fileURLToPath } from "node:url";

const API_URL = (process.env.API_URL || "http://localhost:3101").replace(/\/$/, "");
const RATE_URL = (process.env.RATE_LIMIT_URL || "http://localhost:3103").replace(/\/$/, "");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@portfolio.dev";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin123!";
const VISITOR_EMAIL = process.env.VISITOR_EMAIL || "visitor@portfolio.dev";
const VISITOR_PASSWORD = process.env.VISITOR_PASSWORD || "Visitor123!";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

/* ------------------------------------------------------------------ */
/*  Tiny assertion + reporting helpers                                 */
/* ------------------------------------------------------------------ */

let passed = 0;
let failed = 0;
const failures = [];
const captured = [];
let currentSection = "";

function section(title) {
  currentSection = title;
  console.log(`\n## ${title}`);
}

function check(condition, label, detail) {
  const suffix = detail === undefined ? "" : ` [${detail}]`;
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}${suffix}`);
  } else {
    failed += 1;
    failures.push(`${currentSection} :: ${label}${suffix}`);
    console.log(`  FAIL  ${label}${suffix}`);
  }
  return Boolean(condition);
}

function eq(actual, expected, label) {
  return check(actual === expected, label, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isErrorShape(data) {
  return isObject(data) && isObject(data.error) && typeof data.error.message === "string" && data.error.message.length > 0;
}

/* ------------------------------------------------------------------ */
/*  HTTP helper                                                        */
/* ------------------------------------------------------------------ */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Perform one HTTP request. `rawBody` allows malformed JSON and oversized
 * payloads; `contentType` overrides the request content type.
 */
async function request(base, path, options = {}) {
  const { method = "GET", body, rawBody, token, headers = {}, contentType } = options;
  const requestHeaders = { Accept: "application/json", ...headers };
  let payload;

  if (rawBody !== undefined) {
    payload = rawBody;
    if (contentType) requestHeaders["Content-Type"] = contentType;
    else if (!requestHeaders["Content-Type"]) requestHeaders["Content-Type"] = "application/json";
  } else if (body !== undefined) {
    payload = JSON.stringify(body);
    requestHeaders["Content-Type"] = contentType || "application/json";
  }
  if (token) requestHeaders.Authorization = `Bearer ${token}`;

  const response = await fetch(base + path, { method, headers: requestHeaders, body: payload });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  const record = { base, method, path, status: response.status, data, text, headers: response.headers };
  captured.push(record);
  return record;
}

const api = (path, options) => request(API_URL, path, options);
const rlApi = (path, options) => request(RATE_URL, path, options);

function header(response, name) {
  return response.headers.get(name);
}

/* ------------------------------------------------------------------ */
/*  JWT helpers (test-only)                                            */
/* ------------------------------------------------------------------ */

function readServerSecret() {
  const envPath = fileURLToPath(new URL("../server/.env", import.meta.url));
  const text = readFileSync(envPath, "utf8");
  const value = text
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*JWT_SECRET\s*=\s*(.+)$/))
    .find(Boolean);
  if (!value) throw new Error("JWT_SECRET not found in server/.env");
  return value[1].trim().replace(/^["']|["']$/g, "");
}

const JWT_SECRET = readServerSecret();
const ISSUER = "portfolio-blog-api";
const AUDIENCE = "portfolio-client";

function b64url(input) {
  return Buffer.from(input).toString("base64url");
}

function signJwt(payload, { secret = JWT_SECRET, header = { alg: "HS256", typ: "JWT" } } = {}) {
  const encodedHeader = b64url(JSON.stringify(header));
  const encodedPayload = b64url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret).update(`${encodedHeader}.${encodedPayload}`).digest("base64url");
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function claimsFor(subject, overrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  return { sub: String(subject), iat: now, exp: now + 3600, iss: ISSUER, aud: AUDIENCE, ...overrides };
}

function decodePayload(token) {
  return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
}

/* ------------------------------------------------------------------ */
/*  Recursive secret-leak scanner                                      */
/* ------------------------------------------------------------------ */

function scanForSecrets(value, path = "$") {
  const findings = [];
  if (Array.isArray(value)) {
    value.forEach((item, index) => findings.push(...scanForSecrets(item, `${path}[${index}]`)));
  } else if (isObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      const childPath = `${path}.${key}`;
      if (key === "password") findings.push(`${childPath} (password key)`);
      if (typeof child === "string" && /\$2[aby]\$[0-9]{2}\$/.test(child)) {
        findings.push(`${childPath} (bcrypt hash)`);
      }
      findings.push(...scanForSecrets(child, childPath));
    }
  } else if (typeof value === "string" && /\$2[aby]\$[0-9]{2}\$/.test(value)) {
    findings.push(`${path} (bcrypt hash)`);
  }
  return findings;
}

function assertNoSecretKeys(label, data) {
  const findings = scanForSecrets(data);
  return check(findings.length === 0, `${label} contains no password key / bcrypt hash`, findings.slice(0, 3).join(", "));
}

function assertPopulatedUser(label, user) {
  const ok =
    isObject(user) &&
    typeof user._id === "string" &&
    typeof user.username === "string" &&
    !("email" in user) &&
    !("password" in user);
  return check(ok, `${label} is populated as { _id, username } only`, JSON.stringify(user).slice(0, 120));
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

const suffix = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
const tempUsername = `qa_${suffix}`.slice(0, 30);
const tempEmail = `qa_${suffix}@example.com`;
const created = { projectId: null, postId: null };

async function main() {
  console.log(`\nIndependent QA edge-case probe`);
  console.log(`Functional target: ${API_URL}`);
  console.log(`Rate-limit target: ${RATE_URL}\n`);

  /* ---------------------------------------------------------------- */
  section("1. API health, info and response basics");
  /* ---------------------------------------------------------------- */
  let r = await api("/health");
  eq(r.status, 200, "GET /health -> 200");
  check(isObject(r.data) && r.data.status === "ok", "health status is ok", JSON.stringify(r.data));
  check(r.data?.db === "connected", "health reports MongoDB connected");
  check(typeof r.data?.uptime === "number", "health uptime is a number");
  check((header(r, "content-type") || "").includes("application/json"), "health response is JSON");

  r = await api("/");
  eq(r.status, 200, "GET / -> 200");
  check(isObject(r.data) && typeof r.data.name === "string" && typeof r.data.version === "string", "GET / exposes name + version");
  check(isObject(r.data?.endpoints) && r.data.endpoints.blog === "/api/blog", "GET / exposes endpoint map");

  check(header(r, "x-powered-by") === null, "X-Powered-By header is not exposed (no Express fingerprint)");

  /* ---------------------------------------------------------------- */
  section("2. Public reads: shapes, populate and ordering");
  /* ---------------------------------------------------------------- */
  r = await api("/api/projects");
  eq(r.status, 200, "GET /api/projects -> 200");
  check(Array.isArray(r.data) && r.data.length > 0, "seeded projects are returned", `count=${r.data?.length}`);
  const projects = Array.isArray(r.data) ? r.data : [];
  const firstProject = projects[0];
  check(isObject(firstProject), "project list items are objects");
  check(typeof firstProject?.title === "string" && typeof firstProject?.description === "string", "project has title + description");
  for (const field of ["imageUrl", "repoUrl", "liveUrl"]) {
    check(typeof firstProject?.[field] === "string", `project.${field} is a string ("" allowed)`);
  }
  assertPopulatedUser("project.user", firstProject?.user);
  assertNoSecretKeys("project list", r.data);
  const projectTimes = projects.map((project) => new Date(project.createdAt).getTime()).filter(Number.isFinite);
  check(
    projectTimes.every((time, index) => index === 0 || projectTimes[index - 1] >= time),
    "GET /api/projects is sorted newest first",
  );

  const seededProjectId = firstProject?._id;
  r = await api(`/api/projects/${seededProjectId}`);
  eq(r.status, 200, "GET /api/projects/:id -> 200");
  eq(r.data?._id, seededProjectId, "project detail returns the requested id");
  check(typeof r.data?.createdAt === "string" && typeof r.data?.updatedAt === "string", "project detail has timestamps");
  assertNoSecretKeys("project detail", r.data);

  r = await api("/api/blog");
  eq(r.status, 200, "GET /api/blog -> 200");
  const posts = Array.isArray(r.data) ? r.data : [];
  check(posts.length > 0, "seeded blog posts are returned", `count=${posts.length}`);
  const firstPost = posts[0];
  check(typeof firstPost?.title === "string" && typeof firstPost?.content === "string", "post has title + content");
  assertPopulatedUser("post.author", firstPost?.author);
  assertNoSecretKeys("blog list", r.data);
  const postTimes = posts.map((post) => new Date(post.createdAt).getTime()).filter(Number.isFinite);
  check(
    postTimes.every((time, index) => index === 0 || postTimes[index - 1] >= time),
    "GET /api/blog is sorted newest first",
  );

  const seededPostId = firstPost?._id;
  r = await api(`/api/blog/${seededPostId}`);
  eq(r.status, 200, "GET /api/blog/:id -> 200");
  eq(r.data?._id, seededPostId, "post detail returns the requested id");
  check(Array.isArray(r.data?.comments), "post detail embeds a comments array");
  if (Array.isArray(r.data?.comments) && r.data.comments.length > 0) {
    assertPopulatedUser("comment.author", r.data.comments[0].author);
    assertNoSecretKeys("post detail comment", r.data.comments[0]);
  }
  assertNoSecretKeys("post detail", r.data);

  r = await api(`/api/blog/${seededPostId}/comments`);
  eq(r.status, 200, "GET /api/blog/:postId/comments -> 200");
  check(Array.isArray(r.data), "comments list is an array");
  if (Array.isArray(r.data) && r.data.length > 0) {
    assertPopulatedUser("comments[0].author", r.data[0].author);
    assertNoSecretKeys("comments list", r.data);
  }

  // Documented Lab 19 compatibility alias: /api/posts === /api/blog
  r = await api("/api/posts");
  eq(r.status, 200, "GET /api/posts alias -> 200");
  check(Array.isArray(r.data) && r.data.length === posts.length, "GET /api/posts returns the same blog list", `count=${r.data?.length}`);
  r = await api(`/api/posts/${seededPostId}`);
  eq(r.status, 200, "GET /api/posts/:id alias -> 200");
  check(Array.isArray(r.data?.comments), "posts alias detail embeds the comments array");

  /* ---------------------------------------------------------------- */
  section("3. Error format: 404, invalid ids, unknown records");
  /* ---------------------------------------------------------------- */
  r = await api("/api/does-not-exist");
  eq(r.status, 404, "unknown route -> 404");
  check(isErrorShape(r.data), "unknown route uses { error: { message } }");
  check((header(r, "content-type") || "").includes("application/json"), "404 response is JSON, not HTML");

  r = await api("/api/projects", { method: "PATCH", body: {} });
  eq(r.status, 404, "unsupported method (PATCH /api/projects) -> 404");
  check(isErrorShape(r.data), "unsupported method uses the JSON error shape");

  for (const [path, label] of [
    ["/api/projects/not-an-id", "invalid project id"],
    ["/api/blog/not-an-id", "invalid blog id"],
    ["/api/blog/not-an-id/comments", "invalid postId for comments"],
  ]) {
    r = await api(path);
    eq(r.status, 400, `${label} -> 400`);
    check(isErrorShape(r.data), `${label} uses the JSON error shape`);
  }

  const missingId = "000000000000000000000000";
  r = await api(`/api/projects/${missingId}`);
  eq(r.status, 404, "unknown but valid project id -> 404");
  check(isErrorShape(r.data), "unknown project uses the JSON error shape");

  r = await api(`/api/blog/${missingId}`);
  eq(r.status, 404, "unknown but valid blog id -> 404");
  check(isErrorShape(r.data), "unknown post uses the JSON error shape");

  r = await api(`/api/blog/${missingId}/comments`);
  eq(r.status, 404, "comments for an unknown post -> 404");
  check(isErrorShape(r.data), "unknown post comments use the JSON error shape");

  r = await api(`/api/blog/${missingId}/comments`, {
    method: "POST",
    body: { body: "ghost comment" },
    token: "dummy",
  });
  check(r.status === 401 || r.status === 404, "comment on unknown post with bad token -> 401/404", `${r.status}`);
  check(isErrorShape(r.data), "comment error uses the JSON error shape");

  /* ---------------------------------------------------------------- */
  section("4. Security headers and CORS");
  /* ---------------------------------------------------------------- */
  r = await api("/health", { headers: { Origin: CLIENT_ORIGIN } });
  eq(header(r, "access-control-allow-origin"), CLIENT_ORIGIN, "CORS allows CLIENT_ORIGIN");
  check(header(r, "x-content-type-options") === "nosniff", "helmet: X-Content-Type-Options: nosniff");
  const csp = header(r, "content-security-policy");
  check(typeof csp === "string" && csp.includes("default-src"), "helmet: Content-Security-Policy present", (csp || "").slice(0, 80));
  check(header(r, "x-frame-options") !== null || /frame-ancestors/.test(csp || ""), "helmet: clickjacking protection (X-Frame-Options or frame-ancestors)");

  const preflight = await api("/api/blog", {
    method: "OPTIONS",
    headers: {
      Origin: CLIENT_ORIGIN,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type,authorization",
    },
  });
  check(preflight.status === 200 || preflight.status === 204, "CORS preflight succeeds", `status ${preflight.status}`);
  check(header(preflight, "access-control-allow-origin") === CLIENT_ORIGIN, "preflight returns Access-Control-Allow-Origin");
  const allowedMethods = header(preflight, "access-control-allow-methods") || "";
  check(/POST/.test(allowedMethods) && /DELETE/.test(allowedMethods), "preflight allows POST and DELETE methods", allowedMethods);
  const allowedHeaders = (header(preflight, "access-control-allow-headers") || "").toLowerCase();
  check(allowedHeaders.includes("authorization") && allowedHeaders.includes("content-type"), "preflight allows Authorization + Content-Type headers");

  const evil = await api("/health", { headers: { Origin: "http://evil.example.com" } });
  check(!header(evil, "access-control-allow-origin"), "disallowed CORS origin receives no Access-Control-Allow-Origin");
  const evilPreflight = await api("/api/blog", {
    method: "OPTIONS",
    headers: { Origin: "http://evil.example.com", "Access-Control-Request-Method": "POST" },
  });
  check(!header(evilPreflight, "access-control-allow-origin"), "disallowed origin preflight receives no ACAO header");

  const localPreview = await api("/health", { headers: { Origin: "http://localhost:4173" } });
  check(
    header(localPreview, "access-control-allow-origin") === "http://localhost:4173",
    "non-production builds accept other localhost dev ports (documented dev convenience)",
  );

  /* ---------------------------------------------------------------- */
  section("5. Body parsing: malformed JSON, wrong content type, 32 KB limit");
  /* ---------------------------------------------------------------- */
  r = await api("/api/contact", { method: "POST", rawBody: '{"name": "broken"', contentType: "application/json" });
  eq(r.status, 400, "malformed JSON -> 400");
  check(isErrorShape(r.data), "malformed JSON uses the JSON error shape", r.data?.error?.message);

  r = await api("/api/contact", { method: "POST", rawBody: JSON.stringify({ name: "x" }), contentType: "text/plain" });
  eq(r.status, 400, "non-JSON content type -> 400");
  check(isErrorShape(r.data), "wrong content type uses the JSON error shape");

  r = await api("/api/contact", {
    method: "POST",
    rawBody: JSON.stringify({ name: "Oversized", email: "big@example.com", message: "x".repeat(40000) }),
    contentType: "application/json",
  });
  eq(r.status, 413, "32 KB JSON body limit -> 413");
  check(isErrorShape(r.data), "413 response uses the JSON error shape");
  check((r.data?.error?.message || "").toLowerCase().includes("32 kb"), "413 message mentions the 32 KB limit", r.data?.error?.message);

  r = await api("/api/contact", { method: "POST", body: {} });
  eq(r.status, 400, "empty contact body -> 400 validation error");
  check(isErrorShape(r.data), "empty contact body uses the JSON error shape");

  /* ---------------------------------------------------------------- */
  section("6. Authentication (rate-limited routes - kept under the default 10)");
  /* ---------------------------------------------------------------- */
  const adminLogin = await api("/api/users/login", { method: "POST", body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  eq(adminLogin.status, 200, "admin login -> 200");
  const adminToken = adminLogin.data?.token;
  check(typeof adminToken === "string" && adminToken.split(".").length === 3, "admin login returns a 3-part JWT");
  check(adminLogin.data?.user?.role === "admin", "admin login returns the admin role");
  check(typeof adminLogin.data?.user?.email === "string", "auth user shape includes the email");
  check(typeof adminLogin.data?.user?.createdAt === "string" && typeof adminLogin.data?.user?.updatedAt === "string", "auth user shape includes timestamps");
  assertNoSecretKeys("admin login response", adminLogin.data);
  check((header(adminLogin, "cache-control") || "").includes("no-store"), "login response is Cache-Control: no-store");
  const authPolicy = header(adminLogin, "ratelimit-policy") || header(adminLogin, "ratelimit-limit") || "";
  check(/10/.test(authPolicy), "auth rate-limit policy advertises 10 attempts", authPolicy);

  const visitorLogin = await api("/api/users/login", { method: "POST", body: { email: VISITOR_EMAIL, password: VISITOR_PASSWORD } });
  eq(visitorLogin.status, 200, "visitor login -> 200");
  const visitorToken = visitorLogin.data?.token;
  check(visitorLogin.data?.user?.role === "user", "visitor login returns the user role");

  const adminId = adminLogin.data?.user?._id;
  const visitorId = visitorLogin.data?.user?._id;
  const adminClaims = decodePayload(adminToken);
  eq(adminClaims.sub, adminId, "JWT subject is the user id");
  eq(adminClaims.iss, ISSUER, "JWT issuer claim is present");
  eq(adminClaims.aud, AUDIENCE, "JWT audience claim is present");
  check(adminClaims.exp - adminClaims.iat === 7 * 24 * 60 * 60, "JWT expires after 7 days", `lifetime=${adminClaims.exp - adminClaims.iat}s`);

  const wrongPassword = await api("/api/users/login", { method: "POST", body: { email: ADMIN_EMAIL, password: "definitely-wrong" } });
  eq(wrongPassword.status, 401, "wrong password -> 401");
  check(isErrorShape(wrongPassword.data), "wrong password uses the JSON error shape");
  check(!wrongPassword.data?.token, "wrong password returns no token");

  const unknownEmail = await api("/api/users/login", { method: "POST", body: { email: "nobody@example.com", password: "Whatever123!" } });
  eq(unknownEmail.status, 401, "unknown email -> 401");
  eq(
    unknownEmail.data?.error?.message,
    wrongPassword.data?.error?.message,
    "wrong password and unknown email share one message (no account enumeration)",
  );

  const registerBody = {
    username: tempUsername,
    email: tempEmail.replace("qa_", "QA_").replace("@example.com", "@Example.com"),
    password: "QaPass123!",
    role: "admin", // must be ignored by the API
  };
  r = await api("/api/users/register", { method: "POST", body: registerBody });
  eq(r.status, 201, "register new account -> 201");
  check(typeof r.data?.token === "string", "register auto-logs-in with a token");
  eq(r.data?.user?.role, "user", "role in the request body is ignored (always user)");
  eq(r.data?.user?.username, tempUsername, "registered username is normalised to lowercase");
  check(!("password" in (r.data?.user || {})), "register response does not include the password");
  assertNoSecretKeys("register response", r.data);
  const tempToken = r.data?.token;

  r = await api("/api/users/register", { method: "POST", body: { username: tempUsername, email: `other_${suffix}@example.com`, password: "QaPass123!" } });
  eq(r.status, 409, "duplicate username -> 409");
  check(isErrorShape(r.data), "duplicate username uses the JSON error shape");
  check((r.data?.error?.message || "").toLowerCase().includes("username"), "duplicate username message names the field", r.data?.error?.message);

  r = await api("/api/users/register", { method: "POST", body: { username: `other_${suffix}`.slice(0, 30), email: tempEmail, password: "QaPass123!" } });
  eq(r.status, 409, "duplicate email -> 409");
  check((r.data?.error?.message || "").toLowerCase().includes("email"), "duplicate email message names the field", r.data?.error?.message);

  // Contract says "password 6-72 characters"; the implementation enforces a
  // 72-BYTE guard instead (bcrypt truncates at 72 bytes). Documented as a minor
  // documentation nuance in the QA report rather than a functional failure.
  const multibytePassword = "密".repeat(40); // 40 characters but 120 UTF-8 bytes
  r = await api("/api/users/register", {
    method: "POST",
    body: { username: `mb_${suffix}`.slice(0, 30), email: `mb_${suffix}@example.com`, password: multibytePassword },
  });
  eq(r.status, 400, "40-char multibyte password rejected by the 72-byte bcrypt guard");

  /* ---------------------------------------------------------------- */
  section("7. JWT hardening: /api/users/me with tampered tokens");
  /* ---------------------------------------------------------------- */
  r = await api("/api/users/me", { token: adminToken });
  eq(r.status, 200, "GET /api/users/me with a valid token -> 200");
  eq(r.data?.user?.role, "admin", "GET /api/users/me returns the current user");
  check(typeof r.data?.user?.email === "string" && r.data?.success === true, "GET /api/users/me returns { success, user } with email");
  assertNoSecretKeys("GET /api/users/me", r.data);
  check((header(r, "cache-control") || "").includes("no-store"), "GET /api/users/me is Cache-Control: no-store");

  r = await api("/api/users/me");
  eq(r.status, 401, "no Authorization header -> 401");
  check(isErrorShape(r.data), "401 uses the JSON error shape");

  r = await api("/api/users/me", { headers: { Authorization: `Basic ${adminToken}` } });
  eq(r.status, 401, "wrong auth scheme (Basic) -> 401");

  r = await api("/api/users/me", { token: "not.a.valid.jwt" });
  eq(r.status, 401, "structurally invalid token -> 401");

  const now = Math.floor(Date.now() / 1000);
  const expired = signJwt(claimsFor(adminId, { iat: now - 120, exp: now - 60 }));
  r = await api("/api/users/me", { token: expired });
  eq(r.status, 401, "expired JWT -> 401");
  check((r.data?.error?.message || "").toLowerCase().includes("expired"), "expired JWT returns a session-expired message", r.data?.error?.message);

  r = await api("/api/users/me", { token: signJwt(claimsFor(adminId, { aud: "some-other-audience" })) });
  eq(r.status, 401, "JWT with wrong audience -> 401");

  r = await api("/api/users/me", { token: signJwt(claimsFor(adminId, { iss: "evil-issuer" })) });
  eq(r.status, 401, "JWT with wrong issuer -> 401");

  r = await api("/api/users/me", { token: signJwt(claimsFor(adminId), { secret: "x".repeat(64) }) });
  eq(r.status, 401, "JWT signed with the wrong secret -> 401");

  const tampered = `${adminToken.slice(0, -4)}AAAA`;
  r = await api("/api/users/me", { token: tampered });
  eq(r.status, 401, "tampered JWT signature -> 401");

  const noneHeader = b64url(JSON.stringify({ alg: "none", typ: "JWT" }));
  const nonePayload = b64url(JSON.stringify(claimsFor(adminId)));
  r = await api("/api/users/me", { token: `${noneHeader}.${nonePayload}.` });
  eq(r.status, 401, "alg=none JWT -> 401");

  r = await api("/api/users/me", { token: signJwt(claimsFor(missingId)) });
  eq(r.status, 401, "valid JWT for a non-existent account -> 401");
  check((r.data?.error?.message || "").toLowerCase().includes("no longer exists"), "deleted-account token returns the expected message", r.data?.error?.message);

  r = await api("/api/projects", { method: "POST", body: { title: "No token project", description: "should be rejected" } });
  eq(r.status, 401, "protected write without a token -> 401");

  /* ---------------------------------------------------------------- */
  section("8. Projects: admin-only writes and server-side ownership");
  /* ---------------------------------------------------------------- */
  r = await api("/api/projects", {
    method: "POST",
    token: adminToken,
    body: {
      title: `QA Edge Project ${suffix}`,
      description: "Created by the independent QA edge-case probe.",
      repoUrl: "https://github.com/example/qa-edge",
      user: visitorId, // must be ignored: owner comes from the JWT
    },
  });
  eq(r.status, 201, "admin create project -> 201");
  created.projectId = r.data?._id;
  eq(r.data?.user?._id, adminId, "project owner comes from the JWT, not the request body");
  assertPopulatedUser("created project.user", r.data?.user);
  check(typeof r.data?.createdAt === "string" && typeof r.data?.updatedAt === "string", "created project has timestamps");
  assertNoSecretKeys("created project", r.data);
  const projectId = created.projectId;

  r = await api(`/api/projects/${projectId}`, { method: "PUT", token: adminToken, body: { title: `QA Edge Project updated ${suffix}` } });
  eq(r.status, 200, "admin partial update project -> 200");
  eq(r.data?.title, `QA Edge Project updated ${suffix}`, "project title was updated");
  eq(r.data?.repoUrl, "https://github.com/example/qa-edge", "partial update keeps untouched fields");

  r = await api(`/api/projects/${projectId}`, { method: "PUT", token: adminToken, body: { imageUrl: "" } });
  eq(r.status, 200, "admin can clear an optional project URL with an empty string");
  eq(r.data?.imageUrl, "", "cleared imageUrl is stored as an empty string");

  r = await api("/api/projects", { method: "POST", token: adminToken, body: { title: "Missing description project" } });
  eq(r.status, 400, "project without description -> 400");

  r = await api(`/api/projects/${projectId}`, { method: "PUT", token: adminToken, body: {} });
  eq(r.status, 400, "empty project update -> 400");
  check(isErrorShape(r.data), "empty project update uses the JSON error shape");

  r = await api(`/api/projects/${projectId}`, { method: "PUT", token: adminToken, body: { liveUrl: "http://insecure.example.com" } });
  eq(r.status, 400, "non-https project URL -> 400");
  check(isErrorShape(r.data), "non-https URL uses the JSON error shape");

  r = await api("/api/projects", { method: "POST", token: visitorToken, body: { title: "Visitor project", description: "should be forbidden" } });
  eq(r.status, 403, "non-admin create project -> 403");
  check(isErrorShape(r.data), "403 project create uses the JSON error shape");

  r = await api(`/api/projects/${projectId}`, { method: "PUT", token: visitorToken, body: { title: "Hijacked project" } });
  eq(r.status, 403, "non-admin update project -> 403");

  r = await api(`/api/projects/${projectId}`, { method: "DELETE", token: visitorToken });
  eq(r.status, 403, "non-admin delete project -> 403");

  r = await api("/api/projects", { method: "POST", token: adminToken, body: [] });
  eq(r.status, 400, "array request body on project create -> 400");
  check(isErrorShape(r.data), "array body uses the JSON error shape");

  r = await api(`/api/projects/${projectId}`, { method: "DELETE", token: adminToken });
  eq(r.status, 204, "admin delete project -> 204");
  eq(r.text, "", "delete project returns an empty body");
  r = await api(`/api/projects/${projectId}`);
  eq(r.status, 404, "deleted project -> 404");
  created.projectId = null;

  /* ---------------------------------------------------------------- */
  section("9. Blog posts: author-only mutations");
  /* ---------------------------------------------------------------- */
  r = await api("/api/blog", {
    method: "POST",
    token: visitorToken,
    body: {
      title: `QA Edge Post ${suffix}`,
      content: "A temporary post created and removed by the independent QA probe.",
      author: adminId, // must be ignored: author comes from the JWT
    },
  });
  eq(r.status, 201, "authenticated user create post -> 201");
  created.postId = r.data?._id;
  eq(r.data?.author?._id, visitorId, "post author comes from the JWT, not the request body");
  assertPopulatedUser("created post.author", r.data?.author);
  assertNoSecretKeys("created post", r.data);
  const postId = created.postId;

  r = await api(`/api/blog/${postId}`, { method: "PUT", token: adminToken, body: { title: "Admin hijack" } });
  eq(r.status, 403, "non-author (admin) update post -> 403");
  check(isErrorShape(r.data), "non-author update uses the JSON error shape");

  r = await api(`/api/blog/${postId}`, { method: "DELETE", token: adminToken });
  eq(r.status, 403, "non-author (admin) delete post -> 403");

  r = await api(`/api/blog/${postId}`, { method: "PUT", token: visitorToken, body: { title: `QA Edge Post updated ${suffix}` } });
  eq(r.status, 200, "author update own post -> 200");
  eq(r.data?.title, `QA Edge Post updated ${suffix}`, "post title was updated");

  r = await api(`/api/blog/${postId}`, { method: "PUT", token: visitorToken, body: {} });
  eq(r.status, 400, "empty post update -> 400");

  // A normal user (not just an admin) must also be rejected on someone else's post.
  r = await api(`/api/blog/${seededPostId}`, { method: "PUT", token: visitorToken, body: { title: "Visitor hijack of seeded post" } });
  eq(r.status, 403, "non-author normal user update of another user's post -> 403");
  r = await api(`/api/blog/${seededPostId}`, { method: "DELETE", token: visitorToken });
  eq(r.status, 403, "non-author normal user delete of another user's post -> 403");
  r = await api(`/api/blog/${seededPostId}`);
  eq(r.status, 200, "seeded post still exists after the forbidden delete");

  r = await api("/api/blog", { method: "POST", token: visitorToken, body: { title: "x", content: "" } });
  eq(r.status, 400, "invalid post payload -> 400");
  check(isErrorShape(r.data), "invalid post payload uses the JSON error shape");

  /* ---------------------------------------------------------------- */
  section("10. Comments");
  /* ---------------------------------------------------------------- */
  r = await api(`/api/blog/${postId}/comments`, { method: "POST", token: visitorToken, body: { body: "QA edge-case comment." } });
  eq(r.status, 201, "authenticated comment -> 201");
  const commentId = r.data?._id;
  eq(r.data?.body, "QA edge-case comment.", "comment body is returned");
  eq(r.data?.post, postId, "comment is bound to the post id");
  eq(r.data?.author?._id, visitorId, "comment author is the JWT user");
  assertPopulatedUser("comment.author", r.data?.author);
  assertNoSecretKeys("created comment", r.data);

  r = await api(`/api/blog/${postId}/comments`);
  eq(r.status, 200, "GET comments after create -> 200");
  check(Array.isArray(r.data) && r.data.some((comment) => comment._id === commentId), "new comment appears in the list");
  assertNoSecretKeys("comments after create", r.data);

  r = await api(`/api/blog/${postId}`);
  eq(r.status, 200, "post detail after comment -> 200");
  check(
    Array.isArray(r.data?.comments) && r.data.comments.some((comment) => comment._id === commentId),
    "post detail includes the new comment",
  );

  r = await api(`/api/blog/${postId}/comments`, { method: "POST", token: visitorToken, body: {} });
  eq(r.status, 400, "empty comment body -> 400");
  r = await api(`/api/blog/${postId}/comments`, { method: "POST", token: visitorToken, body: { body: "x".repeat(1001) } });
  eq(r.status, 400, "comment longer than 1000 characters -> 400");
  r = await api(`/api/blog/${postId}/comments`, { method: "POST", body: { body: "anonymous" } });
  eq(r.status, 401, "anonymous comment -> 401");

  /* ---------------------------------------------------------------- */
  section("11. Contact inbox: admin-only, no password leakage");
  /* ---------------------------------------------------------------- */
  r = await api("/api/contact");
  eq(r.status, 401, "contact inbox without token -> 401");
  r = await api("/api/contact", { token: visitorToken });
  eq(r.status, 403, "contact inbox as normal user -> 403");
  check(isErrorShape(r.data), "inbox 403 uses the JSON error shape");
  r = await api("/api/contact", { token: adminToken });
  eq(r.status, 200, "contact inbox as admin -> 200");
  check(Array.isArray(r.data) && r.data.length > 0, "inbox returns messages", `count=${r.data?.length}`);
  if (Array.isArray(r.data) && r.data.length > 0) {
    const message = r.data[0];
    check(typeof message.name === "string" && typeof message.email === "string" && typeof message.message === "string", "message has name + email + message");
    check(typeof message.createdAt === "string", "message has a createdAt timestamp");
    assertNoSecretKeys("inbox message", message);
  }
  check((header(r, "cache-control") || "").includes("no-store"), "inbox response is Cache-Control: no-store");

  /* ---------------------------------------------------------------- */
  section("12. Cleanup of QA-created records");
  /* ---------------------------------------------------------------- */
  if (created.postId) {
    r = await api(`/api/blog/${created.postId}`, { method: "DELETE", token: visitorToken });
    eq(r.status, 204, "author delete own post -> 204");
    r = await api(`/api/blog/${created.postId}`);
    eq(r.status, 404, "deleted post -> 404");
    r = await api(`/api/blog/${created.postId}`, { method: "DELETE", token: visitorToken });
    eq(r.status, 404, "deleting an already deleted post -> 404");
    created.postId = null;
  }

  /* ---------------------------------------------------------------- */
  section("13. Secret-leak scan across every captured response");
  /* ---------------------------------------------------------------- */
  const leaks = captured.flatMap((record) =>
    typeof record.data === "string" ? [] : scanForSecrets(record.data).map((finding) => `${record.method} ${record.path} -> ${finding}`),
  );
  check(leaks.length === 0, "no response body contains a password key or bcrypt hash", leaks.slice(0, 3).join(" | "));

  /* ---------------------------------------------------------------- */
  section("14. Default rate limits on a fresh instance");
  /* ---------------------------------------------------------------- */
  console.log(`  (target ${RATE_URL})`);
  let rl = await rlApi("/health");
  eq(rl.status, 200, "fresh rate-limit instance is healthy");

  let authLimitedAt = null;
  let authStatuses = [];
  for (let attempt = 1; attempt <= 11; attempt += 1) {
    const body = attempt === 1 ? { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } : { email: ADMIN_EMAIL, password: `wrong-${attempt}` };
    const response = await rlApi("/api/users/login", { method: "POST", body });
    authStatuses.push(response.status);
    if (response.status === 429) authLimitedAt = attempt;
  }
  check(
    authStatuses.slice(0, 10).every((status) => status !== 429),
    "first 10 auth attempts are allowed (default limit 10)",
    authStatuses.join(","),
  );
  eq(authLimitedAt, 11, "11th auth attempt within the window -> 429");
  const auth429 = captured[captured.length - 1];
  check(isErrorShape(auth429.data), "429 auth response uses the JSON error shape", JSON.stringify(auth429.data));
  check((auth429.data?.error?.message || "").toLowerCase().includes("too many attempts"), "429 auth message is descriptive", auth429.data?.error?.message);
  check((header(auth429, "cache-control") || "").includes("no-store"), "429 auth response is Cache-Control: no-store");
  const limitPolicy = header(auth429, "ratelimit-policy") || header(auth429, "ratelimit-limit") || "";
  check(limitPolicy.length > 0, "429 response advertises the rate-limit policy", limitPolicy);

  await sleep(50); // keep request ordering deterministic

  const contactStatuses = [];
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const response = await rlApi("/api/contact", { method: "POST", body: {} });
    contactStatuses.push(response.status);
  }
  check(
    contactStatuses.slice(0, 5).every((status) => status === 400),
    "first 5 contact submissions pass the limiter and fail validation (default limit 5)",
    contactStatuses.join(","),
  );
  eq(contactStatuses[5], 429, "6th contact submission -> 429");
  const contact429 = captured[captured.length - 1];
  check(isErrorShape(contact429.data), "429 contact response uses the JSON error shape", JSON.stringify(contact429.data));
  check((contact429.data?.error?.message || "").toLowerCase().includes("too many messages"), "429 contact message is descriptive", contact429.data?.error?.message);

  /* ---------------------------------------------------------------- */
  console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log("Failures:");
    for (const failure of failures) console.log(`  - ${failure}`);
    process.exitCode = 1;
  } else {
    console.log("All independent edge-case checks passed.");
  }
}

main().catch((error) => {
  console.error("\nEDGE-CASE PROBE CRASHED:", error);
  process.exitCode = 1;
});
