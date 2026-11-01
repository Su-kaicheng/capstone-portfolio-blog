/**
 * End-to-end integration tests for the React SPA, running against the REAL
 * Express/Mongoose API and MongoDB Atlas data.
 *
 * Prerequisites:
 *   1. The API is running:  cd server && npm start
 *   2. Demo data is seeded:  cd server && npm run seed
 *
 * If the API is not reachable the whole suite is skipped, so `npm test` still
 * passes on a machine without the back-end running.
 *
 * In this sandbox, run with:
 *   node node_modules/vitest/vitest.mjs run --config vitest.config.mjs --configLoader native --pool=threads
 */
import { describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "../App.jsx";
import { AuthProvider } from "../context/AuthContext.jsx";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");
const ADMIN = { email: "admin@portfolio.dev", password: "Admin123!" };
const VISITOR = { email: "visitor@portfolio.dev", password: "Visitor123!" };
const SUFFIX = Date.now().toString(36);

async function apiGet(path) {
  const response = await fetch(`${API_URL}${path}`, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`GET ${path} failed with ${response.status}`);
  return response.json();
}

const apiIsUp = await (async () => {
  try {
    const response = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(5000) });
    return response.ok;
  } catch {
    return false;
  }
})();

if (!apiIsUp) {
  console.warn(
    `[integration] API not reachable at ${API_URL} — integration tests skipped. ` +
      "Start the server and run npm run seed to enable them.",
  );
}

const integration = apiIsUp ? describe : describe.skip;

function renderAt(route) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

/** Logs in through the real /login page and waits for the auth-aware header. */
async function loginAs(interaction, credentials) {
  renderAt("/login");
  await interaction.type(await screen.findByLabelText(/email address/i), credentials.email);
  await interaction.type(screen.getByLabelText(/password/i), credentials.password);
  await interaction.click(screen.getByRole("button", { name: /^log in$/i }));
  // Logged-in users get the "Admin" navigation link and their username in the header.
  await screen.findByRole("link", { name: /^admin$/i });
}

integration("SPA integration against the live API", () => {
  it("home page renders the hero, seeded projects and latest posts", async () => {
    renderAt("/");

    expect(await screen.findByRole("heading", { level: 1, name: /su kaicheng/i })).toBeInTheDocument();
    // Featured projects come from GET /api/projects
    expect((await screen.findAllByText("Full-Stack Portfolio & Blog Platform")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("React Portfolio SPA")).length).toBeGreaterThan(0);
    // Latest writing comes from GET /api/blog
    expect(
      await screen.findByText("How I Built This Portfolio: React, Context and Protected Routes"),
    ).toBeInTheDocument();
  });

  it("projects gallery loads every seeded project", async () => {
    renderAt("/projects");

    expect((await screen.findAllByText("Full-Stack Portfolio & Blog Platform")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Portfolio & Blog REST API")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("React Portfolio SPA")).length).toBeGreaterThan(0);
  });

  it("blog list and blog detail render posts and comments from the API", async () => {
    const posts = await apiGet("/api/blog");
    const firstPost = posts[0];
    expect(posts.length).toBeGreaterThanOrEqual(3);

    renderAt("/blog");
    expect((await screen.findAllByText("Building a Secure REST API with Express and Mongoose")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("JWT Authentication: From Login to Protected Routes")).length).toBeGreaterThan(0);

    cleanup();

    renderAt(`/blog/${firstPost._id}`);
    expect(await screen.findByText(firstPost.title)).toBeInTheDocument();
    // A guest sees the login prompt instead of the comment form.
    expect(await screen.findByText(/log in to join the discussion/i)).toBeInTheDocument();
    expect(firstPost.author?.username).toBeTruthy();
  });

  it("guests are redirected away from the protected /admin route", async () => {
    renderAt("/admin");
    expect(await screen.findByRole("heading", { level: 1, name: /welcome back/i })).toBeInTheDocument();
  });

  it("contact form submits a message to the API and shows a receipt", async () => {
    const interaction = userEvent.setup();
    renderAt("/contact");

    await interaction.type(await screen.findByLabelText(/^name/i), "Integration Tester");
    await interaction.type(screen.getByLabelText(/^email/i), `integration_${SUFFIX}@example.com`);
    await interaction.type(
      screen.getByLabelText(/^message/i),
      "Hello from the automated integration test. The contact form should store this message.",
    );
    await interaction.click(screen.getByRole("button", { name: /send message/i }));

    expect(await screen.findByRole("heading", { level: 2, name: /message received/i })).toBeInTheDocument();
  });

  it("admin can log in and manage projects, posts and the inbox", async () => {
    const interaction = userEvent.setup();
    await loginAs(interaction, ADMIN);

    // Auth-aware header now shows the account.
    expect(await screen.findByText("kaicheng")).toBeInTheDocument();

    await interaction.click(screen.getByRole("link", { name: /^admin$/i }));
    expect(await screen.findByRole("heading", { level: 1, name: /dashboard/i })).toBeInTheDocument();
    await screen.findByText("Full-Stack Portfolio & Blog Platform");

    /* ---------------------------- projects ---------------------------- */
    const projectTitle = `QA Project ${SUFFIX}`;
    const editedTitle = `${projectTitle} (edited)`;

    await interaction.click(screen.getByRole("button", { name: /new project/i }));
    await screen.findByRole("heading", { level: 2, name: /new project/i });
    await interaction.type(screen.getByLabelText(/^title/i), projectTitle);
    await interaction.type(
      screen.getByLabelText(/^description/i),
      "Created by the automated integration test to verify project creation.",
    );
    await interaction.click(screen.getByRole("button", { name: /create project/i }));

    expect(await screen.findByText(/project created/i)).toBeInTheDocument();
    expect(await screen.findByText(projectTitle)).toBeInTheDocument();

    // Edit the new project.
    let projectRow = screen.getByText(projectTitle).closest("li");
    await interaction.click(within(projectRow).getByRole("button", { name: /edit/i }));
    await screen.findByRole("heading", { level: 2, name: /edit project/i });
    const titleInput = screen.getByLabelText(/^title/i);
    await interaction.clear(titleInput);
    await interaction.type(titleInput, editedTitle);
    await interaction.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText(/project updated/i)).toBeInTheDocument();
    expect(await screen.findByText(editedTitle)).toBeInTheDocument();

    // Delete it again (confirmation is a second click).
    projectRow = screen.getByText(editedTitle).closest("li");
    await interaction.click(within(projectRow).getByRole("button", { name: /^delete$/i }));
    await interaction.click(within(projectRow).getByRole("button", { name: /^delete$/i }));
    expect(await screen.findByText(/project deleted/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText(editedTitle)).not.toBeInTheDocument());

    /* --------------------------- blog posts --------------------------- */
    await interaction.click(screen.getByRole("link", { name: /blog posts/i }));
    await screen.findByText(/you can only edit your own/i);

    const postTitle = `QA Post ${SUFFIX}`;
    await interaction.click(screen.getByRole("button", { name: /new post/i }));
    await screen.findByRole("heading", { level: 2, name: /new post/i });
    await interaction.type(screen.getByLabelText(/^title/i), postTitle);
    await interaction.type(
      screen.getByLabelText(/^content/i),
      "Automated integration test post. It verifies creation and deletion from the admin dashboard.",
    );
    await interaction.click(screen.getByRole("button", { name: /publish post/i }));

    expect(await screen.findByText(/post published/i)).toBeInTheDocument();
    expect(await screen.findByText(postTitle)).toBeInTheDocument();

    const postRow = screen.getByText(postTitle).closest("li");
    await interaction.click(within(postRow).getByRole("button", { name: /^delete$/i }));
    await interaction.click(within(postRow).getByRole("button", { name: /^delete$/i }));
    expect(await screen.findByText(/post deleted/i)).toBeInTheDocument();

    /* ---------------------------- inbox ------------------------------- */
    await interaction.click(screen.getByRole("link", { name: /^messages$/i }));
    expect(await screen.findByText("Ming Zhao")).toBeInTheDocument();

    // Logging out restores the guest header.
    await interaction.click(screen.getByRole("button", { name: /log out/i }));
    expect(await screen.findByRole("link", { name: /^log in$/i })).toBeInTheDocument();
  });

  it("a logged-in visitor can post a comment on a blog post", async () => {
    const posts = await apiGet("/api/blog");
    const post = posts[0];
    const comment = `Automated integration comment ${SUFFIX}`;

    const interaction = userEvent.setup();
    await loginAs(interaction, VISITOR);
    cleanup();

    renderAt(`/blog/${post._id}`);
    const commentBox = await screen.findByRole("textbox", { name: /^comment/i });
    await interaction.type(commentBox, comment);
    await interaction.click(screen.getByRole("button", { name: /post comment/i }));

    expect(await screen.findByText(/your comment is live/i)).toBeInTheDocument();
    expect(screen.getByText(comment)).toBeInTheDocument();
  });

  it("a new visitor can register and is logged in automatically", async () => {
    const interaction = userEvent.setup();
    const username = `qa_${SUFFIX}`;

    renderAt("/register");
    await interaction.type(await screen.findByLabelText(/^username/i), username);
    await interaction.type(screen.getByLabelText(/email address/i), `${username}@example.com`);
    await interaction.type(screen.getByLabelText(/^password/i), "QaPass123!");
    await interaction.type(screen.getByLabelText(/confirm password/i), "QaPass123!");
    await interaction.click(screen.getByRole("button", { name: /create account/i }));

    // Auto-login: the header switches to the authenticated state.
    expect(await screen.findByText(username)).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: /^admin$/i })).toBeInTheDocument();
  });
});
