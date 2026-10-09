// Server-side HTML sanitizer for internal-user-edited rich text (currently:
// the cover letter template's narrative paragraphs). This is defense-in-depth
// rather than the primary safeguard — the editor UI (Tiptap, restricted to
// paragraph/bold/italic/link) can't produce most of what this strips, by
// construction of its schema. This sanitizer protects the path where someone
// bypasses that UI and posts directly to the API.
//
// Deliberately dependency-free: no new package, just an allowlist walk over
// the markup. It is not a general-purpose HTML sanitizer — it only needs to
// be correct for the narrow vocabulary this app's rich-text fields use.

const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'a',
  'ul',
  'ol',
  'li',
  'blockquote',
  'span',
]);

// Tags stripped along with everything inside them (not just unwrapped).
const STRIP_WITH_CONTENTS = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'link',
  'meta',
  'base',
  'form',
  'input',
  'button',
  'textarea',
  'select',
  'svg',
  'math',
  'noscript',
]);

function isSafeHref(href: string): boolean {
  const trimmed = href.trim();
  return /^(https?:|mailto:)/i.test(trimmed) || trimmed.startsWith('/');
}

/**
 * Sanitize an HTML fragment down to a small allowlisted vocabulary:
 * paragraphs, line breaks, bold/italic/underline, links (http/https/mailto
 * only), and lists. Everything else is either unwrapped (its own tags
 * removed, children kept) or stripped entirely along with its contents for
 * elements that are never safe to keep around (script, iframe, forms, etc).
 */
export function sanitizeRichTextHtml(input: string): string {
  if (!input) return '';

  // Drop HTML comments outright — no legitimate use here, and they're a
  // common vector for sanitizer-bypass tricks.
  let html = input.replace(/<!--[\s\S]*?-->/g, '');

  // Remove dangerous elements together with their contents first, so nothing
  // inside a <script> or <style> block leaks through as "text".
  for (const tag of STRIP_WITH_CONTENTS) {
    const re = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}\\s*>`, 'gi');
    html = html.replace(re, '');
    // Also remove a stray self-closing/unclosed opening tag of the same name.
    const openRe = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
    html = html.replace(openRe, '');
  }

  // Walk every remaining tag (opening, closing, or self-closing) and decide
  // whether to keep it (rewritten with only safe attributes), unwrap it
  // (drop the tag, keep inner text — handled implicitly by just removing
  // this match), or leave text content alone.
  html = html.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^>]*)?)\/?>/g, (match, rawTag, rawAttrs) => {
    const tag = String(rawTag).toLowerCase();
    const isClosing = match.startsWith('</');

    if (!ALLOWED_TAGS.has(tag)) {
      // Unwrap: drop the tag itself, keep whatever text was around it.
      return '';
    }

    if (isClosing) {
      return `</${tag}>`;
    }

    if (tag === 'a') {
      const hrefMatch = /href\s*=\s*"([^"]*)"|href\s*=\s*'([^']*)'/i.exec(
        rawAttrs || '',
      );
      const href = hrefMatch ? hrefMatch[1] ?? hrefMatch[2] ?? '' : '';
      if (href && isSafeHref(href)) {
        const safeHref = href.replace(/"/g, '&quot;');
        return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">`;
      }
      // No safe href — keep it as a plain span-like wrapper with no link
      // behavior rather than dropping the visible text.
      return '<a>';
    }

    // Every other allowed tag: keep the tag, strip all attributes
    // (including any on* handlers, style, class, etc).
    return `<${tag}>`;
  });

  return html.trim();
}

/**
 * For fields that are meant to be plain text (company name, tagline, email) —
 * strips any markup entirely rather than allowlisting it, since these are
 * rendered as plain strings, not parsed as HTML.
 */
export function sanitizePlainText(input: string): string {
  if (!input) return '';
  return input
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}
