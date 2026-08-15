import { marked } from "marked"
import DOMPurify from "isomorphic-dompurify"

/**
 * Render a blog post body written in Markdown to sanitized HTML.
 *
 * Headings are demoted one level (h1→h2 … h5→h6) because the page template
 * already renders the post title as the document's only h1 — authors write
 * `# Heading` naturally, and without demotion every post shipped two h1s.
 * Sanitization runs on the final HTML, after conversion and demotion.
 */
export function renderPostBody(markdown: string): string {
  let html = marked.parse(markdown || "", { async: false })
  for (let level = 5; level >= 1; level--) {
    html = html
      .replaceAll(`<h${level}`, `<h${level + 1}`)
      .replaceAll(`</h${level}>`, `</h${level + 1}>`)
  }
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u",
      "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li", "a", "img",
      "blockquote", "code", "pre",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "class"],
  })
}
