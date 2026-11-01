/**
 * Single API layer for the Portfolio & Blog back-end.
 *
 * Every request in the application goes through `api()` so that JSON headers,
 * bearer tokens, error parsing and empty (204) responses stay consistent.
 * The base URL comes from `VITE_API_URL` and defaults to the local API.
 */
export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

const FALLBACK_MESSAGES = {
  400: "That request was not valid. Please check the details and try again.",
  401: "Your session has expired. Please log in again.",
  403: "You do not have permission to perform this action.",
  404: "We could not find what you were looking for.",
  409: "That entry already exists.",
  413: "That request was too large to process.",
  429: "Too many requests. Please wait a few minutes and try again.",
  500: "The server ran into an unexpected problem. Please try again.",
};

/** Error thrown by the API layer, carrying the HTTP status for callers. */
export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function parseJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Perform a JSON request against the API.
 *
 * @param {string} path - API path, e.g. "/api/projects".
 * @param {{ method?: string, body?: unknown, token?: string }} [options]
 * @returns {Promise<any>} Parsed response body (null for 204 responses).
 */
export async function api(path, { method = "GET", body, token } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      "Could not reach the server. Check your connection and try again.",
      0,
    );
  }

  if (response.status === 204) return null;

  const data = await parseJson(response);

  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      FALLBACK_MESSAGES[response.status] ||
      `Request failed (${response.status}).`;
    throw new ApiError(message, response.status, data);
  }

  return data;
}

/* ------------------------------------------------------------------ */
/*  Users                                                              */
/* ------------------------------------------------------------------ */

export function register({ username, email, password }) {
  return api("/api/users/register", { method: "POST", body: { username, email, password } });
}

export function login({ email, password }) {
  return api("/api/users/login", { method: "POST", body: { email, password } });
}

export function me(token) {
  return api("/api/users/me", { token });
}

/* ------------------------------------------------------------------ */
/*  Projects                                                           */
/* ------------------------------------------------------------------ */

export function getProjects() {
  return api("/api/projects");
}

export function getProject(id) {
  return api(`/api/projects/${id}`);
}

export function createProject(payload, token) {
  return api("/api/projects", { method: "POST", body: payload, token });
}

export function updateProject(id, payload, token) {
  return api(`/api/projects/${id}`, { method: "PUT", body: payload, token });
}

export function deleteProject(id, token) {
  return api(`/api/projects/${id}`, { method: "DELETE", token });
}

/* ------------------------------------------------------------------ */
/*  Blog posts                                                         */
/* ------------------------------------------------------------------ */

export function getPosts() {
  return api("/api/blog");
}

export function getPost(id) {
  return api(`/api/blog/${id}`);
}

export function createPost(payload, token) {
  return api("/api/blog", { method: "POST", body: payload, token });
}

export function updatePost(id, payload, token) {
  return api(`/api/blog/${id}`, { method: "PUT", body: payload, token });
}

export function deletePost(id, token) {
  return api(`/api/blog/${id}`, { method: "DELETE", token });
}

/* ------------------------------------------------------------------ */
/*  Comments                                                           */
/* ------------------------------------------------------------------ */

export function getComments(postId) {
  return api(`/api/blog/${postId}/comments`);
}

export function createComment(postId, payload, token) {
  return api(`/api/blog/${postId}/comments`, { method: "POST", body: payload, token });
}

/* ------------------------------------------------------------------ */
/*  Contact                                                            */
/* ------------------------------------------------------------------ */

export function sendContactMessage(payload) {
  return api("/api/contact", { method: "POST", body: payload });
}

export function getMessages(token) {
  return api("/api/contact", { token });
}
