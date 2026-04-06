// lib/sanitize.ts
import DOMPurify from "dompurify";

// Check if we're in browser environment
const isBrowser = typeof window !== "undefined";

export function sanitizeHtml(html: string): string {
  if (!isBrowser) {
    // Server-side: return as-is or use a different sanitizer
    return html;
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "h1",
      "h2",
      "h3",
      "h4",
      "ul",
      "ol",
      "li",
      "img",
      "table",
      "tr",
      "td",
      "th",
      "tbody",
      "thead",
      "blockquote",
      "code",
      "pre",
      "a",
      "span",
      "div",
    ],
    ALLOWED_ATTR: ["src", "alt", "class", "style", "href", "target", "rel"],
    ADD_TAGS: ["iframe"], // Optional: if you need videos
    ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling"],
  });
}

// Optional: Helper to strip all HTML (get plain text)
export function stripHtml(html: string): string {
  if (!isBrowser) return html;
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || "";
}
