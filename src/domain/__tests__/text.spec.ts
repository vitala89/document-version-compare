import { describe, expect, it } from 'vitest'
import { noiseReason, normalize, plainNoiseReason, plainText } from '../text'

describe('plainText', () => {
  it('drops tags and keeps words', () => {
    expect(
      plainText('Submit within <b>30 days</b> via the <a href="https://x.test">portal</a>.'),
    ).toBe('Submit within 30 days via the portal.')
  })

  it('drops unsafe elements entirely', () => {
    expect(plainText('Text.<img src="x" onerror="alert(1)">')).toBe('Text.')
  })
})

describe('normalize', () => {
  it('collapses whitespace and thousand separators', () => {
    expect(normalize('  a  b \n c ')).toBe('a b c')
    expect(normalize('1,000 EUR')).toBe('1000 EUR')
  })
})

describe('noiseReason', () => {
  it('returns null for equal and for real changes', () => {
    expect(noiseReason('same', 'same')).toBeNull()
    expect(noiseReason('six hours', 'eight hours')).toBeNull()
  })

  it('classifies whitespace, markup and number format', () => {
    expect(noiseReason('a b.', 'a  b. ')).toBe('whitespace')
    expect(noiseReason('a b', 'a <b>b</b>')).toBe('markup')
    expect(noiseReason('1,000 EUR', '1000 EUR')).toBe('number-format')
  })
})

describe('plainText edge cases', () => {
  it('keeps a literal less-than sign and decodes numeric entities', () => {
    expect(plainText('Budget &lt; 500 and budget < 500')).toBe('Budget < 500 and budget < 500')
    expect(plainText('It&#8217;s fine')).toBe('It’s fine')
  })
})

describe('plainNoiseReason (titles, labels and values carry no markup)', () => {
  it('treats a literal < as text, so a real change stays a change', () => {
    expect(plainNoiseReason('if x<y then', 'if x<z then')).toBeNull()
    expect(plainNoiseReason('Restricted', '<b>Restricted</b>')).toBeNull()
  })

  it('still hides whitespace and number format', () => {
    expect(plainNoiseReason('Working  Time ', 'Working Time')).toBe('whitespace')
    expect(plainNoiseReason('1,000 EUR', '1000 EUR')).toBe('number-format')
  })
})
