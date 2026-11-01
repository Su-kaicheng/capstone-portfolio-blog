/**
 * Headless SPA smoke test for the production build in `client/dist`.
 *
 * There is no browser automation available in this environment, so this script
 * boots the real Vite production bundle inside jsdom (no network browser is
 * involved), bridges the SPA's `fetch` to a running API instance and then
 * renders each route to assert that:
 *   - every required route renders without runtime errors,
 *   - unauthenticated `/admin` redirects to `/login`,
 *   - the header is auth-aware (guest vs. member vs. admin),
 *   - data from the live API (projects, posts, comments) reaches the DOM,
 *   - admin-only controls are hidden from normal users,
 *   - the SPA only talks to the configured API origin (no CDN calls).
 *
 * Usage (after `npm run build -- --configLoader native` in client/):
 *
 *   node capstone/tests/spa-smoke.mjs
 *
 * Environment variables:
 *   API_TARGET   API the SPA is bridged to (default http://localhost:3101)
 *   SPA_ORIGIN   origin simulated in jsdom        (default http://localhost:5173)
 *
 * jsdom is resolved from `client/node_modules`; when it is unavailable the
 * script exits with code 0 after printing a SKIP notice.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { createHmac } from "node:crypto";
import { fileURLToPath } from "node:url";

const API_TARGET = (process.env.API_TARGET || "http://localhost:3101").replace(/\/$/, "");
const SPA_ORIGIN = process.env.SPA_ORIGIN || "http://localhost:5173";
const CLIENT_DIR = fileURLToPath(new URL("../client/", import.meta.url));
const DIST_DIR = `${CLIENT_DIR}dist/`;

const requireFromClient = createRequire(new URL("../client/package.json", import.meta.url));
let JSDOM;
try {
  ({ JSDOM } = requireFromClient("jsdom"));
} catch {
  console.log("SKIP: jsdom is not available in client/node_modules — install it to run the SPA smoke test.");
  process.exit(0);
}

/* ------------------------------------------------------------------ */
/*  Reporting                                                          */
/* ------------------------------------------------------------------ */
let passed = 0;
let failed = 0;
const failures = [];

function check(condition, label, detail) {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    failures.push(label + (detail !== undefined ? ` [${detail}]` : ""));
    console.log(`  FAIL  ${label}${detail !== undefined ? ` [${detail}]` : ""}`);
  }
  return Boolean(condition);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(predicate, { timeout = 10000, interval = 60, label = "condition" } = {}) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    try {
      if (await predicate()) return true;
    } catch {
      /* keep polling */
    }
    await sleep(interval);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

/* ------------------------------------------------------------------ */
/*  Load the real production bundle                                    */
/* ------------------------------------------------------------------ */
const { html, js, assets } = loadBuild();

function loadBuild() {
  const indexPath = `${DIST_DIR}index.html`;
  if (!existsSync(indexPath)) {
    console.error(`SKIP: ${indexPath} not found. Run "npm run build -- --configLoader native" in client/ first.`);
    process.exit(0);
  }
  const indexHtml = readFileSync(indexPath, "utf8");
  const scriptMatch = indexHtml.match(/<script[^>]+src="([^"]+)"/);
  if (!scriptMatch) throw new Error("No module script found in dist/index.html");
  const scriptPath = scriptMatch[1].replace(/^\//, "");
  const scriptFile = `${DIST_DIR}${scriptPath}`;
  return { html: indexHtml, js: readFileSync(scriptFile, "utf8"), scriptPath, assets: readdirSync(`${DIST_DIR}assets`) };
}

/* ------------------------------------------------------------------ */
/*  JWT minting (same secret the API uses — server/.env)               */
/* ------------------------------------------------------------------ */
function readJwtSecret() {
  const envPath = fileURLToPath(new URL("../server/.env", import.meta.url));
  const line = readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((entry) => /^\s*JWT_SECRET\s*=/.test(entry));
  if (!line) throw new Error("JWT_SECRET not found in server/.env");
  return line.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");
}

const JWT_SECRET = readJwtSecret();

function signJwt(subject) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ sub: String(subject), iat: now, exp: now + 3600, iss: "portfolio-blog-api", aud: "portfolio-client" }),
  ).toString("base64url");
  const signature = createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

/* ------------------------------------------------------------------ */
/*  Boot one SPA instance at a given route                             */
/* ------------------------------------------------------------------ */
async function boot(path, storage = {}) {
  const dom = new JSDOM(html, {
    url: `${SPA_ORIGIN}${path}`,
    runScripts: "outside-only",
    pretendToBeVisual: true,
  });
  const { window } = dom;
  const errors = [];
  const requests = [];

  window.addEventListener("error", (event) => errors.push(`uncaught: ${event.message}`));
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    errors.push(`unhandled rejection: ${reason?.message || String(reason)}`);
  });

  window.fetch = async (input, init) => {
    const raw = typeof input === "string" ? input : input?.url;
    const requested = String(raw);
    const options = init || {};
    const headers = options.headers ? { ...options.headers } : {};
    requests.push({
      url: requested,
      method: String(options.method || "GET").toUpperCase(),
      headers,
    });
    const url = requested.replace("http://localhost:3000", API_TARGET);
    return globalThis.fetch(url, init);
  };
  window.scrollTo = () => {};
  if (!window.matchMedia) {
    window.matchMedia = () => ({
      matches: false,
      media: "",
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false;
      },
    });
  }

  for (const [key, value] of Object.entries(storage)) window.localStorage.setItem(key, value);
  window.eval(js);
  return { dom, window, errors, requests };
}

function bodyText(window) {
  return window.document.body.textContent.replace(/\s+/g, " ");
}

function findButton(window, text) {
  return [...window.document.querySelectorAll("button")].find((button) => button.textContent.trim().includes(text));
}

function findButtonIn(element, text) {
  return [...element.querySelectorAll("button")].find((button) => button.textContent.trim().includes(text));
}

function setFieldValue(window, element, value) {
  const prototype = element.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value").set.call(element, value);
  element.dispatchEvent(new window.Event("input", { bubbles: true }));
}

function submitForm(window, form) {
  form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
}

function hasBearer(headerValue) {
  return typeof headerValue === "string" && /^Bearer\s+\S+/.test(headerValue);
}

function authorizationHeader(request) {
  return request.headers.Authorization || request.headers.authorization;
}

async function waitForRequest(requests, predicate, label) {
  await waitFor(() => requests.some(predicate), { label });
  return requests.find(predicate);
}

function findRow(window, text) {
  return [...window.document.querySelectorAll("li")].find((row) => row.textContent.includes(text));
}

function hardErrors(errors) {
  return errors.filter((message) => /undefined|not a function|not defined|Cannot read|Minified React error|Maximum update/i.test(message));
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */
async function main() {
  console.log(`\nHeadless SPA smoke test (jsdom) — production bundle from client/dist`);
  console.log(`Bundle: ${js.length} bytes | assets: ${assets.length} files | API bridge: ${API_TARGET}\n`);

  /* ---------- 0. Build artefact sanity ---------- */
  console.log("## 0. Build artefact sanity");
  check(html.includes('<div id="root"></div>'), "dist/index.html contains the React root");
  check(/<script type="module"[^>]+src="\/assets\/[^"]+\.js"/.test(html), "dist/index.html references a hashed module bundle");
  check(/<link rel="stylesheet"[^>]+href="\/assets\/[^"]+\.css"/.test(html), "dist/index.html references a hashed stylesheet");
  check(!/<script[^>]+src="https?:\/\//.test(html), "dist/index.html loads no external script");
  check(!/<link[^>]+href="https?:\/\//.test(html), "dist/index.html loads no external stylesheet/font");
  const cssName = assets.find((file) => file.endsWith(".css"));
  check(Boolean(cssName) && readFileSync(`${DIST_DIR}assets/${cssName}`, "utf8").length > 10000, "emitted stylesheet is non-trivial", cssName);

  /* ---------- API fixtures ---------- */
  const projects = await (await fetch(`${API_TARGET}/api/projects`)).json();
  const posts = await (await fetch(`${API_TARGET}/api/blog`)).json();
  if (!Array.isArray(projects) || !Array.isArray(posts) || projects.length === 0 || posts.length === 0) {
    throw new Error(`API at ${API_TARGET} has no seed data — cannot run the SPA smoke test.`);
  }
  const firstProject = projects[0];
  const firstPost = posts[0];
  const firstPostDetail = await (await fetch(`${API_TARGET}/api/blog/${firstPost._id}`)).json();
  const seededComment = (firstPostDetail.comments || [])[0];

  const admin = { id: projects[0].user._id, username: projects[0].user.username };
  let visitor = null;
  for (const post of posts) {
    const detail = await (await fetch(`${API_TARGET}/api/blog/${post._id}`)).json();
    const found = (detail.comments || []).find((comment) => comment.author?.username === "visitor");
    if (found) {
      visitor = { id: found.author._id, username: found.author.username };
      break;
    }
  }
  check(Boolean(visitor), "fixture: a normal-user (visitor) account is present in seeded comments");

  const adminToken = signJwt(admin.id);
  const adminMe = await (await fetch(`${API_TARGET}/api/users/me`, { headers: { Authorization: `Bearer ${adminToken}` } })).json();
  check(adminMe?.user?.role === "admin", "fixture: minted admin JWT authenticates against the live API");

  const visitorToken = visitor ? signJwt(visitor.id) : null;
  const visitorMe = visitor
    ? await (await fetch(`${API_TARGET}/api/users/me`, { headers: { Authorization: `Bearer ${visitorToken}` } })).json()
    : null;
  check(visitorMe?.user?.role === "user", "fixture: minted visitor JWT authenticates against the live API");

  const adminStorage = {
    portfolio_token: adminToken,
    portfolio_user: JSON.stringify(adminMe.user),
  };
  const visitorStorage = {
    portfolio_token: visitorToken,
    portfolio_user: JSON.stringify(visitorMe.user),
  };

  /* ---------- 1. Guest: Home ---------- */
  console.log("\n## 1. Guest — / (Home)");
  {
    const { window, errors } = await boot("/");
    await waitFor(() => bodyText(window).includes(firstProject.title) && bodyText(window).includes(firstPost.title), {
      label: "home project + post data",
    });
    let text = bodyText(window);
    check(text.includes("Su Kaicheng"), "renders the hero/name");
    check(text.includes("Featured projects"), "renders the featured-projects section");
    check(text.includes(firstProject.title), "renders project data from GET /api/projects");
    check(text.includes("Latest writing"), "renders the latest-writing section");
    check(text.includes(firstPost.title), "renders post data from GET /api/blog");
    check(text.includes("Log in") && text.includes("Register"), "guest header shows Log in + Register");
    check(!text.includes("Log out"), "guest header does not show Log out");
    check(hardErrors(errors).length === 0, "no runtime/undefined errors while rendering Home", hardErrors(errors).join(" | "));
  }

  /* ---------- 2. Guest: Projects gallery ---------- */
  console.log("\n## 2. Guest — /projects");
  {
    const { window, errors } = await boot("/projects");
    await waitFor(() => bodyText(window).includes(projects[projects.length - 1].title), { label: "projects gallery data" });
    const text = bodyText(window);
    check(projects.every((project) => text.includes(project.title)), "renders every seeded project", `count=${projects.length}`);
    check(text.includes("Project") && /Projects/.test(text), "renders the Projects page heading");
    check(hardErrors(errors).length === 0, "no runtime errors while rendering /projects", hardErrors(errors).join(" | "));
  }

  /* ---------- 3. Guest: Blog list ---------- */
  console.log("\n## 3. Guest — /blog");
  {
    const { window, errors } = await boot("/blog");
    await waitFor(() => bodyText(window).includes(posts[posts.length - 1].title), { label: "blog list data" });
    const text = bodyText(window);
    check(posts.every((post) => text.includes(post.title)), "renders every seeded post", `count=${posts.length}`);
    check(hardErrors(errors).length === 0, "no runtime errors while rendering /blog", hardErrors(errors).join(" | "));
  }

  /* ---------- 4. Guest: Blog detail + comments ---------- */
  console.log("\n## 4. Guest — /blog/:id");
  {
    const { window, errors } = await boot(`/blog/${firstPost._id}`);
    await waitFor(() => bodyText(window).includes(firstPost.title), { label: "blog detail data" });
    const text = bodyText(window);
    check(text.includes(firstPost.title), "renders the requested post");
    check(firstPost.content.slice(0, 40).replace(/\s+/g, " ") && text.includes(firstPost.content.slice(0, 24)), "renders the post body text");
    check(text.includes("Comments"), "renders the comments section");
    if (seededComment) check(text.includes(seededComment.body), "renders seeded comments from the API", seededComment.body.slice(0, 40));
    check(text.includes("Log in to join the discussion"), "guest is prompted to log in before commenting");
    check(hardErrors(errors).length === 0, "no runtime errors while rendering the post detail", hardErrors(errors).join(" | "));
  }

  /* ---------- 5. Guest: Contact form ---------- */
  console.log("\n## 5. Guest — /contact");
  {
    const { window, errors } = await boot("/contact");
    await waitFor(() => Boolean(window.document.querySelector("#contact-name")), { label: "contact form" });
    const document = window.document;
    check(Boolean(document.querySelector("#contact-name")), "renders a controlled name input");
    check(Boolean(document.querySelector("#contact-email")), "renders a controlled email input");
    check(Boolean(document.querySelector("#contact-message")), "renders a controlled message textarea");
    check(bodyText(window).includes("Send a message"), "renders the contact form heading");
    check(hardErrors(errors).length === 0, "no runtime errors while rendering /contact", hardErrors(errors).join(" | "));
  }

  /* ---------- 6. Guest: /admin redirects to /login ---------- */
  console.log("\n## 6. Guest — /admin is protected");
  {
    const { window, errors } = await boot("/admin");
    await waitFor(() => window.location.pathname === "/login", { label: "redirect to /login" });
    await waitFor(() => bodyText(window).includes("Welcome back"), { label: "login page content" });
    check(window.location.pathname === "/login", "unauthenticated /admin redirects to /login", window.location.pathname);
    check(bodyText(window).includes("Welcome back"), "login page is rendered after the redirect");
    check(Boolean(window.document.querySelector("#login-email")), "login form fields are rendered");
    check(hardErrors(errors).length === 0, "no runtime errors during the protected-route redirect", hardErrors(errors).join(" | "));
  }

  /* ---------- 7. Unknown route + invalid post id ---------- */
  console.log("\n## 7. Not-found handling");
  {
    const { window, errors } = await boot("/definitely-not-a-real-route");
    await waitFor(() => bodyText(window).includes("could not be found"), { label: "404 page" });
    check(bodyText(window).includes("This page could not be found"), "unknown SPA route renders the 404 page");
    check(hardErrors(errors).length === 0, "no runtime errors on the 404 page", hardErrors(errors).join(" | "));

    const invalid = await boot("/blog/000000000000000000000000");
    await waitFor(() => bodyText(invalid.window).includes("Post not found"), { label: "empty post state" });
    check(bodyText(invalid.window).includes("Post not found"), "unknown post id renders the 'Post not found' state");
    check(hardErrors(invalid.errors).length === 0, "no runtime errors for an unknown post id", hardErrors(invalid.errors).join(" | "));
  }

  /* ---------- 8. Authenticated admin — /admin dashboard ---------- */
  console.log("\n## 8. Admin — /admin dashboard (minted JWT in localStorage)");
  {
    const { window, errors, requests } = await boot("/admin", adminStorage);
    await waitFor(() => bodyText(window).includes("Dashboard"), { label: "dashboard heading" });
    await waitFor(() => bodyText(window).includes(firstProject.title), { label: "dashboard project list" });
    const text = bodyText(window);
    check(text.includes("Dashboard"), "authenticated admin sees the dashboard");
    check(text.includes("New project"), "admin sees the project create button on the default tab");
    check(text.includes(admin.username), "header/dashboard shows the admin username");
    check(text.includes("Log out") && text.includes("Admin"), "authenticated header shows Admin + Log out");
    check(text.includes(firstProject.title), "dashboard lists projects from GET /api/projects");
    check(text.includes("Messages"), "dashboard exposes the messages section");
    check(
      requests.some((request) => request.url.includes("/api/users/me") && hasBearer(authorizationHeader(request))),
      "AuthContext sends the stored JWT to GET /api/users/me as a Bearer token",
    );
    const adminCalls = requests.filter((request) => /\/api\/(projects|blog|contact)/.test(request.url));
    check(adminCalls.length > 0, "dashboard performs API requests", `${adminCalls.length} calls`);
    check(requests.every((request) => request.url.startsWith(API_TARGET) || request.url.startsWith("http://localhost:3000")), "SPA only calls the configured API origin (no CDN/external calls)");
    check(hardErrors(errors).length === 0, "no runtime errors while rendering the admin dashboard", hardErrors(errors).join(" | "));

    // The posts tab has its own create button; it is only rendered on that tab.
    const postsTab = await boot("/admin?tab=posts", adminStorage);
    await waitFor(() => bodyText(postsTab.window).includes("New post"), { label: "admin posts tab" });
    check(bodyText(postsTab.window).includes("New post"), "admin sees the post create button on the posts tab");
    check(hardErrors(postsTab.errors).length === 0, "no runtime errors on the admin posts tab", hardErrors(postsTab.errors).join(" | "));

    // The messages tab loads the admin-only inbox.
    const messagesTab = await boot("/admin?tab=messages", adminStorage);
    await waitFor(() => bodyText(messagesTab.window).includes("Refresh inbox"), { label: "admin messages tab" });
    check(bodyText(messagesTab.window).includes("Refresh inbox"), "admin sees the inbox refresh control on the messages tab");
    check(
      messagesTab.requests.some((request) => request.url.includes("/api/contact") && hasBearer(authorizationHeader(request))),
      "admin inbox request GET /api/contact carries the Bearer JWT",
    );
    check(hardErrors(messagesTab.errors).length === 0, "no runtime errors on the admin messages tab", hardErrors(messagesTab.errors).join(" | "));
  }

  /* ---------- 9. Normal user — read-only admin dashboard ---------- */
  console.log("\n## 9. Normal user — /admin?tab=messages is read-only");
  {
    const { window, errors } = await boot("/admin?tab=messages", visitorStorage);
    await waitFor(() => bodyText(window).includes("Inbox is admin-only"), { label: "read-only messages panel" });
    const text = bodyText(window);
    check(text.includes("Inbox is admin-only"), "normal user sees the admin-only inbox notice");
    check(!text.includes("New project"), "normal user does not see the admin project-create button");
    check(text.includes("Log out"), "authenticated normal user sees Log out");
    check(text.includes("Member"), "normal user role badge is rendered");
    check(hardErrors(errors).length === 0, "no runtime errors for the read-only dashboard", hardErrors(errors).join(" | "));
  }

  /* ---------- 10. Invalid stored JWT — session is cleared ---------- */
  console.log("\n## 10. Invalid stored JWT — session cleared and redirected");
  {
    const { window, errors } = await boot("/admin", {
      portfolio_token: "not.a.valid.jwt",
      portfolio_user: JSON.stringify({ _id: "000000000000000000000000", username: "ghost", role: "user" }),
    });
    await waitFor(() => window.location.pathname === "/login", { label: "redirect after invalid token" });
    check(window.location.pathname === "/login", "invalid stored JWT redirects /admin to /login");
    check(window.localStorage.getItem("portfolio_token") === null, "invalid session is removed from localStorage");
    check(hardErrors(errors).length === 0, "no runtime errors with an invalid stored JWT", hardErrors(errors).join(" | "));
  }

  /* ---------- 11. Admin UI — project CRUD from the dashboard ---------- */
  console.log("\n## 11. Admin UI — project create / edit / delete");
  const uiProjectTitle = `UI QA Project ${Date.now()}`;
  let uiProjectId = null;
  try {
    const { window, errors, requests } = await boot("/admin", adminStorage);
    await waitFor(() => bodyText(window).includes(firstProject.title), { label: "admin dashboard data" });

    const newProjectButton = findButton(window, "New project");
    check(Boolean(newProjectButton), "dashboard renders the New project button");
    newProjectButton?.click();
    await waitFor(() => Boolean(window.document.querySelector("#project-title")), { label: "project form" });
    check(
      Boolean(window.document.querySelector("#project-title")) &&
        Boolean(window.document.querySelector("#project-description")) &&
        Boolean(window.document.querySelector("#project-repo")),
      "project form renders its controlled fields",
    );

    setFieldValue(window, window.document.querySelector("#project-title"), uiProjectTitle);
    setFieldValue(
      window,
      window.document.querySelector("#project-description"),
      "Created through the admin dashboard UI by the independent QA smoke test.",
    );
    submitForm(window, window.document.querySelector("#project-title").closest("form"));

    await waitFor(() => bodyText(window).includes("Project created."), { label: "project-created feedback" });
    const createRequest = await waitForRequest(
      requests,
      (request) => request.method === "POST" && /\/api\/projects$/.test(request.url),
      "POST /api/projects",
    );
    check(hasBearer(authorizationHeader(createRequest)), "UI project create sends Authorization: Bearer <token>");

    const projectsNow = await (await fetch(`${API_TARGET}/api/projects`)).json();
    const createdProject = projectsNow.find((project) => project.title === uiProjectTitle);
    uiProjectId = createdProject?._id;
    check(Boolean(createdProject), "UI-created project is persisted by the API");

    await waitFor(() => Boolean(findRow(window, uiProjectTitle)), { label: "new project row" });
    const editButton = findButtonIn(findRow(window, uiProjectTitle), "Edit");
    check(Boolean(editButton), "the new project row offers an Edit action");
    editButton?.click();
    await waitFor(() => window.document.querySelector("#project-title")?.value === uiProjectTitle, { label: "edit form values" });
    check(window.document.querySelector("#project-title")?.value === uiProjectTitle, "edit form is pre-populated from the API record");

    const editedTitle = `${uiProjectTitle} edited`;
    setFieldValue(window, window.document.querySelector("#project-title"), editedTitle);
    submitForm(window, window.document.querySelector("#project-title").closest("form"));
    await waitFor(() => bodyText(window).includes("Project updated."), { label: "project-updated feedback" });
    const updateRequest = await waitForRequest(
      requests,
      (request) => request.method === "PUT" && request.url.includes(`/api/projects/${uiProjectId}`),
      "PUT /api/projects/:id",
    );
    check(hasBearer(authorizationHeader(updateRequest)), "UI project update sends Authorization: Bearer <token>");
    const afterEdit = await (await fetch(`${API_TARGET}/api/projects/${uiProjectId}`)).json();
    check(afterEdit?.title === editedTitle, "UI edit persists the new project title in the API");

    await waitFor(() => Boolean(findRow(window, editedTitle)), { label: "edited project row" });
    findButtonIn(findRow(window, editedTitle), "Delete")?.click();
    await waitFor(() => bodyText(window).includes("Delete this project?"), { label: "delete confirmation" });
    check(bodyText(window).includes("Delete this project?"), "delete asks for confirmation before calling the API");
    findButtonIn(findRow(window, editedTitle), "Delete")?.click();

    await waitFor(() => bodyText(window).includes("Project deleted."), { label: "project-deleted feedback" });
    const deleteRequest = await waitForRequest(
      requests,
      (request) => request.method === "DELETE" && request.url.includes(`/api/projects/${uiProjectId}`),
      "DELETE /api/projects/:id",
    );
    check(hasBearer(authorizationHeader(deleteRequest)), "UI project delete sends Authorization: Bearer <token>");
    const deletedCheck = await fetch(`${API_TARGET}/api/projects/${uiProjectId}`);
    check(deletedCheck.status === 404, "UI delete removes the project from the API", `status ${deletedCheck.status}`);
    uiProjectId = null;
    check(hardErrors(errors).length === 0, "no runtime errors during project CRUD from the UI", hardErrors(errors).join(" | "));
  } finally {
    if (uiProjectId) {
      await fetch(`${API_TARGET}/api/projects/${uiProjectId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      }).catch(() => {});
    }
  }

  /* ---------- 12. Admin UI — publish a blog post ---------- */
  console.log("\n## 12. Admin UI — create a blog post");
  const uiPostTitle = `UI QA Post ${Date.now()}`;
  let uiPostId = null;
  try {
    const { window, errors, requests } = await boot("/admin?tab=posts", adminStorage);
    await waitFor(() => bodyText(window).includes(firstPost.title), { label: "admin posts tab data" });
    const newPostButton = findButton(window, "New post");
    check(Boolean(newPostButton), "posts tab renders the New post button");
    newPostButton?.click();
    await waitFor(() => Boolean(window.document.querySelector("#post-title")), { label: "post form" });
    check(Boolean(window.document.querySelector("#post-content")), "post form renders the content textarea");
    setFieldValue(window, window.document.querySelector("#post-title"), uiPostTitle);
    setFieldValue(
      window,
      window.document.querySelector("#post-content"),
      "A post published through the admin dashboard by the independent QA smoke test.",
    );
    submitForm(window, window.document.querySelector("#post-title").closest("form"));
    await waitFor(() => bodyText(window).includes("Post published."), { label: "post-published feedback" });
    const createRequest = await waitForRequest(
      requests,
      (request) => request.method === "POST" && /\/api\/blog$/.test(request.url),
      "POST /api/blog",
    );
    check(hasBearer(authorizationHeader(createRequest)), "UI post create sends Authorization: Bearer <token>");
    const postsNow = await (await fetch(`${API_TARGET}/api/blog`)).json();
    const createdPost = postsNow.find((post) => post.title === uiPostTitle);
    uiPostId = createdPost?._id;
    check(Boolean(createdPost), "UI-created post is persisted by the API");
    check(createdPost?.author?.username === admin.username, "UI-created post author is the signed-in admin");
    check(hardErrors(errors).length === 0, "no runtime errors while publishing a post from the UI", hardErrors(errors).join(" | "));
  } finally {
    if (uiPostId) {
      await fetch(`${API_TARGET}/api/blog/${uiPostId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      }).catch(() => {});
    }
  }

  /* ---------- 13. Comment UI — post a comment as a normal user ---------- */
  console.log("\n## 13. Comment UI — normal user comments on a post");
  let commentPostId = null;
  try {
    const tempPostResponse = await fetch(`${API_TARGET}/api/blog`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${visitorToken}` },
      body: JSON.stringify({
        title: `UI QA Comment Target ${Date.now()}`,
        content: "Temporary post used to verify the comment form through the UI.",
      }),
    });
    const tempPost = await tempPostResponse.json();
    commentPostId = tempPost._id;
    check(tempPostResponse.status === 201 && Boolean(commentPostId), "fixture: temporary post created for the comment test");

    const { window, errors, requests } = await boot(`/blog/${commentPostId}`, visitorStorage);
    await waitFor(() => Boolean(window.document.querySelector("#comment-body")), { label: "comment form" });
    check(Boolean(window.document.querySelector("#comment-body")), "signed-in user sees the controlled comment textarea");
    const commentText = `UI QA comment ${Date.now()}`;
    setFieldValue(window, window.document.querySelector("#comment-body"), commentText);
    submitForm(window, window.document.querySelector("#comment-body").closest("form"));

    await waitFor(() => bodyText(window).includes("Your comment is live"), { label: "comment success alert" });
    const createRequest = await waitForRequest(
      requests,
      (request) => request.method === "POST" && request.url.includes(`/api/blog/${commentPostId}/comments`),
      "POST comments",
    );
    check(hasBearer(authorizationHeader(createRequest)), "UI comment create sends Authorization: Bearer <token>");
    check(bodyText(window).includes(commentText), "the new comment is appended to the thread in the UI");
    const commentsNow = await (await fetch(`${API_TARGET}/api/blog/${commentPostId}/comments`)).json();
    check(
      Array.isArray(commentsNow) && commentsNow.some((comment) => comment.body === commentText),
      "the UI comment is persisted by the API",
    );
    check(hardErrors(errors).length === 0, "no runtime errors while posting a comment from the UI", hardErrors(errors).join(" | "));
  } finally {
    if (commentPostId) {
      await fetch(`${API_TARGET}/api/blog/${commentPostId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${visitorToken}` },
      }).catch(() => {});
    }
  }

  /* ---------- 14. Contact form — validation + successful submission ---------- */
  console.log("\n## 14. Contact form — client-side validation and POST /api/contact");
  {
    const { window, errors, requests } = await boot("/contact");
    await waitFor(() => Boolean(window.document.querySelector("#contact-name")), { label: "contact form" });

    submitForm(window, window.document.querySelector("#contact-name").closest("form"));
    await waitFor(() => bodyText(window).includes("Please enter your name."), { label: "client-side validation errors" });
    const validationText = bodyText(window);
    check(validationText.includes("Please enter your name."), "empty submit shows the name validation error");
    check(validationText.includes("Please enter your email address."), "empty submit shows the email validation error");
    check(validationText.includes("Please write a short message."), "empty submit shows the message validation error");
    check(
      !requests.some((request) => request.method === "POST" && request.url.includes("/api/contact")),
      "invalid form does not call the API",
    );

    const contactEmail = `qa-contact-${Date.now()}@example.com`;
    if (process.env.QA_SKIP_CONTACT_SUBMIT === "1") {
      console.log("  SKIP  live contact submission (QA_SKIP_CONTACT_SUBMIT=1 keeps the shared database inbox pristine)");
    } else {
      setFieldValue(window, window.document.querySelector("#contact-name"), "QA Contact Tester");
      setFieldValue(window, window.document.querySelector("#contact-email"), contactEmail);
      setFieldValue(
        window,
        window.document.querySelector("#contact-message"),
        "Automated contact-form submission from the independent QA SPA smoke test.",
      );
      submitForm(window, window.document.querySelector("#contact-name").closest("form"));

      await waitFor(() => bodyText(window).includes("Message received"), { label: "contact success receipt" });
      const contactRequest = await waitForRequest(
        requests,
        (request) => request.method === "POST" && request.url.includes("/api/contact"),
        "POST /api/contact",
      );
      check(!authorizationHeader(contactRequest), "public contact submission is sent without an Authorization header");
      check(bodyText(window).includes("Reference"), "success receipt shows a reference number");
      check(bodyText(window).includes("Send another message"), "success receipt offers to send another message");
    }
    check(hardErrors(errors).length === 0, "no runtime errors while submitting the contact form", hardErrors(errors).join(" | "));
  }

  /* ---------- Summary ---------- */
  console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log("Failures:");
    for (const failure of failures) console.log(`  - ${failure}`);
    process.exitCode = 1;
  } else {
    console.log("All SPA smoke checks passed.");
  }
}

main().catch((error) => {
  console.error("\nSPA SMOKE TEST CRASHED:", error);
  process.exitCode = 1;
});
