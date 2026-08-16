/**
 * The one place text is escaped before it goes into a rendered HTML string.
 *
 * Colocated as its own leaf module (rather than living inside render.ts) so
 * both `render.ts` and the view builders under `views/` can import it without
 * a circular dependency.
 */
export function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
