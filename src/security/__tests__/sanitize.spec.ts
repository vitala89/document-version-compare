import { describe, expect, it } from 'vitest'
import { sanitizeHtml } from '../sanitize'
import { getVersion } from '@/domain/versions'

const reimbursementV3 = () => {
  const expenses = getVersion(3).children.find((s) => s.id === 'sec-expenses')
  const clause = expenses?.children.find((c) => c.id === 'cl-exp-reimbursement')
  const paragraph = clause?.type === 'clause' ? clause.children[0] : undefined
  return paragraph?.type === 'paragraph' ? paragraph.text : ''
}

describe('sanitizeHtml', () => {
  it('removes the unsafe image from the v3 data and keeps the link', () => {
    const html = sanitizeHtml(reimbursementV3())
    expect(html).not.toContain('onerror')
    expect(html).not.toContain('<img')
    expect(html).toContain('<b>30 days</b>')
    expect(html).toContain(
      '<a href="https://intranet.example.com/expenses" rel="noopener noreferrer" target="_blank">expenses portal</a>',
    )
  })

  it('opens links in a new tab and replaces a rel or target the input brings', () => {
    expect(sanitizeHtml('<a href="https://x.test" rel="opener" target="_self">x</a>')).toBe(
      '<a href="https://x.test" rel="noopener noreferrer" target="_blank">x</a>',
    )
  })

  it('drops links with other protocols but keeps their text', () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">click</a>')).toBe('<a>click</a>')
    expect(sanitizeHtml('<a href="data:text/html,x">x</a>')).toBe('<a>x</a>')
  })

  it('keeps only the allowlisted tags and attributes', () => {
    expect(
      sanitizeHtml('<em onclick="x()">a</em><script>alert(1)</script><span style="x">b</span>'),
    ).toBe('<em>a</em>b')
  })
})
