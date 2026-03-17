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

/** Strip HTML tags from a string. */
export function stripTags(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

/** Sanitize a string for safe rendering: strip tags then escape remaining entities. */
export function sanitize(str: string): string {
  return escapeHtml(stripTags(str));
}
