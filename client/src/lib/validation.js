/**
 * Client-side validation rules mirroring the API contract, so users get
 * immediate feedback while the server remains the source of truth.
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,30}$/;
export const HTTPS_URL_PATTERN = /^https:\/\/\S+$/i;

export const LIMITS = {
  username: { min: 3, max: 30 },
  password: { min: 6, max: 72 },
  projectTitle: { min: 3, max: 120 },
  projectDescription: { max: 2000 },
  postTitle: { min: 3, max: 120 },
  postContent: { max: 10000 },
  comment: { max: 1000 },
  contactName: { max: 80 },
  contactMessage: { max: 2000 },
};

export function isValidEmail(value) {
  return EMAIL_PATTERN.test(String(value ?? "").trim());
}

export function isValidUsername(value) {
  return USERNAME_PATTERN.test(String(value ?? "").trim());
}

/** Non-empty URLs must be absolute https:// URLs. Empty is allowed. */
export function isValidOptionalHttpsUrl(value) {
  const text = String(value ?? "").trim();
  return text === "" || HTTPS_URL_PATTERN.test(text);
}
