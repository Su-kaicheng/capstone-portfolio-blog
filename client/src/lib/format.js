/**
 * Formatting and text helpers shared across the UI.
 * All dates are rendered through Intl so they follow the browser locale rules
 * without shipping a date library.
 */
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const RELATIVE_UNITS = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "Mar 12, 2026" — or an em dash for missing/invalid dates. */
export function formatDate(value) {
  const date = toDate(value);
  return date ? dateFormatter.format(date) : "—";
}

/** "Mar 12, 2026, 09:41 AM" — used for inbox messages. */
export function formatDateTime(value) {
  const date = toDate(value);
  return date ? dateTimeFormatter.format(date) : "—";
}

/** "3 days ago" / "just now" — used for comments. */
export function formatRelativeDate(value) {
  const date = toDate(value);
  if (!date) return "—";

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absolute = Math.abs(diffSeconds);
  if (absolute < 60) return "just now";

  for (const [unit, seconds] of RELATIVE_UNITS) {
    if (absolute >= seconds) {
      return relativeFormatter.format(Math.round(diffSeconds / seconds), unit);
    }
  }
  return "just now";
}

/**
 * Convert API text (which may contain simple HTML) to readable plain text.
 * Rendering always stays text-based — the app never injects HTML.
 */
export function toPlainText(value) {
  if (typeof value !== "string") return "";
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Trim plain text to a word boundary and append an ellipsis. */
export function excerpt(value, maxLength = 180) {
  const text = toPlainText(value);
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${base.trimEnd()}…`;
}

/** Split post content on blank lines into paragraphs for safe rendering. */
export function splitParagraphs(value) {
  if (typeof value !== "string") return [];
  return value
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function countWords(value) {
  const text = toPlainText(value);
  return text ? text.split(/\s+/).length : 0;
}

/** Estimated reading time in minutes, rounded up, minimum 1. */
export function readingTime(value) {
  return Math.max(1, Math.round(countWords(value) / 200));
}

/** Initials for avatars: "su_kaicheng" → "SK", "admin" → "AD". */
export function initials(name) {
  if (typeof name !== "string" || !name.trim()) return "?";
  const parts = name.trim().split(/[\s_-]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

/** "1 project" / "4 projects" */
export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Format a numeric id-ish value for receipts, e.g. "#a1b2c3d4". */
export function shortId(value) {
  const text = String(value ?? "");
  return text.length > 8 ? `#${text.slice(-8)}` : `#${text}`;
}
