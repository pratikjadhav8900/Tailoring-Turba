/**
 * Simple HTML sanitization to prevent XSS and HTML injection.
 * Strips out <script> and other dangerous tags.
 */
export function sanitize(text: string): string {
  if (!text) return "";
  return text
    .replace(/<[^>]*>?/gm, "") // Strip all HTML tags
    .replace(/[&<>"']/g, function (m) {
      // Escape special characters
      const map: { [key: string]: string } = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      };
      return map[m];
    });
}
