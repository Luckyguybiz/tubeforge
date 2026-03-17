/**
 * Sanitize user-facing text to prevent XSS.
 * Use on any user-provided strings that get rendered as HTML.
 */

const ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

const ENTITY_RE = /[&<>"'/]/g;

/** Escape HTML special characters in a string. */
export function escapeHtml(str: string): string {
  return str.replace(ENTITY_RE, (char) => ENTITY_MAP[char] ?? char);
}

/**
 * Strip HTML tags from a string.
 * Uses a multi-pass approach to handle nested tags, malformed HTML,
 * and `<` without closing `>`.
 */
export function stripTags(str: string): string {
  let result = str;
  // Multi-pass: keep stripping until no more tags are found (handles nested tags)
  let prev = '';
  while (prev !== result) {
    prev = result;
    result = result.replace(/<[^>]*>/g, '');
  }
  // Remove any remaining lone `<` characters (malformed HTML without closing `>`)
  result = result.replace(/</g, '');
  return result;
}

/**
 * Validate and sanitize a URL.
 * Only allows http:// and https:// schemes to prevent javascript:, data:, and other dangerous URIs.
 * Returns the URL string if valid, or an empty string if the scheme is not allowed.
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return '';
}

/** Sanitize a string for safe rendering: strip tags then escape remaining entities. */
export function sanitize(str: string): string {
  return escapeHtml(stripTags(str));
}
