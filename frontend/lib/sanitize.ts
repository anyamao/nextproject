import DOMPurify from "dompurify";

const isBrowser = typeof window !== "undefined";

export function sanitizeHtml(html: string): string {
  if (!isBrowser) {
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
    ADD_TAGS: ["iframe"],
    ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling"],
  });
}

export function stripHtml(html: string): string {
  if (!isBrowser) return html;
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || "";
}
