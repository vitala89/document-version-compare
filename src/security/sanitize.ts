import DOMPurify from 'dompurify'

// Paragraph text is user-provided and untrusted. Rules: AGENTS.md, "Security".
const config = {
  ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'code', 'a'],
  ALLOWED_ATTR: ['href'],
  ALLOWED_URI_REGEXP: /^https?:/i,
}

// Private instance, so the link hook does not leak into other DOMPurify users.
const purifier = DOMPurify(window)

purifier.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.hasAttribute('href')) {
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

export function sanitizeHtml(markup: string): string {
  return purifier.sanitize(markup, config)
}
