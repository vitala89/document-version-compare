import type { NoiseReason } from './types'

/**
 * Text content of an inline-markup string, used for comparing and for the
 * Changes view. DOMParser builds an inert document: no scripts run and no
 * images load. This is not a sanitizer; rendering goes through sanitize.ts.
 */
export function plainText(markup: string): string {
  return new DOMParser().parseFromString(markup, 'text/html').body.textContent ?? ''
}

const collapse = (s: string) => s.replace(/\s+/g, ' ').trim()

/** Removes differences the reader does not care about. */
export function normalize(text: string): string {
  return collapse(text).replace(/(\d),(?=\d{3}\b)/g, '$1')
}

/** Why two raw strings differ only in noise, or null if they are equal or really differ. */
export function noiseReason(before: string, after: string): NoiseReason | null {
  if (before === after) return null
  const plainBefore = plainText(before)
  const plainAfter = plainText(after)
  if (normalize(plainBefore) !== normalize(plainAfter)) return null
  if (plainBefore === plainAfter) return 'markup'
  if (collapse(plainBefore) === collapse(plainAfter)) return 'whitespace'
  return 'number-format'
}

/**
 * Noise check for titles, labels and field values. Only paragraph text may hold
 * markup (data/README.md), so these are compared as plain strings: a literal
 * "<" stays text and a change next to it stays a change.
 */
export function plainNoiseReason(before: string, after: string): NoiseReason | null {
  if (before === after) return null
  if (normalize(before) !== normalize(after)) return null
  if (collapse(before) === collapse(after)) return 'whitespace'
  return 'number-format'
}
