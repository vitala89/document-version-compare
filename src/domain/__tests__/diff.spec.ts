import { describe, expect, it } from 'vitest'
import { diffDocuments } from '../diff'
import { getVersion } from '../versions'

const compare = (base: number, target: number) =>
  diffDocuments(getVersion(base), getVersion(target))
const entry = (result: ReturnType<typeof compare>, id: string) =>
  result.entries.find((e) => e.id === id)

describe('diffDocuments: totals per pair (docs/plan.md section 3)', () => {
  it.each([
    [1, 2, { total: 11, added: 3, removed: 2, changed: 5, moved: 1 }],
    [2, 3, { total: 10, added: 1, removed: 1, changed: 8, moved: 0 }],
    [1, 3, { total: 20, added: 3, removed: 3, changed: 13, moved: 1 }],
  ])('v%i → v%i', (base, target, expected) => {
    expect(compare(base, target).counts).toEqual(expected)
  })

  it.each([
    [1, 2, 2, ['sec-comms']],
    [2, 3, 0, []],
    [1, 3, 2, ['sec-comms']],
  ])('v%i → v%i hides %i noise items and reports reordered parents', (base, target, n, parents) => {
    const result = compare(base, target)
    expect(result.noise).toHaveLength(n)
    expect(result.reorderedParents).toEqual(parents)
  })

  it('rejects a newer base', () => {
    expect(() => compare(3, 2)).toThrow('Base version must be older than target version')
  })
})

describe('diffDocuments: rules from the data audit', () => {
  it('shows a moved clause once, in its new section', () => {
    const result = compare(1, 2)
    expect(entry(result, 'cl-hours-holidays')).toMatchObject({
      kind: 'moved',
      sectionId: 'sec-leave',
      movedFrom: 'Working Hours',
    })
  })

  it('does not count reordered children', () => {
    const result = compare(1, 2)
    expect(result.reorderedParents).toEqual(['sec-comms'])
    expect(result.entries.some((e) => e.sectionId === 'sec-comms')).toBe(false)
  })

  it('treats whitespace and number format as noise', () => {
    expect(compare(1, 2).noise).toEqual([
      { id: 'f-exp-equipment-limit', reason: 'number-format' },
      { id: 'p-leave-sick-1', reason: 'whitespace' },
    ])
  })

  it('marks a clause that lost its only field', () => {
    const result = compare(2, 3)
    expect(entry(result, 'cl-sec-access')).toMatchObject({
      kind: 'removed',
      reason: 'field-removed',
    })
    expect(entry(result, 'cl-sec-access')?.details).toEqual([
      { type: 'field-removed', label: 'Cadence', value: 'Quarterly' },
    ])
    expect(entry(result, 'cl-sec-access')?.node).toMatchObject({ children: [] })
  })

  it('reports an added draft clause', () => {
    const added = entry(compare(2, 3), 'cl-remote-coworking')
    expect(added).toMatchObject({ kind: 'added', reason: 'added' })
    expect(added?.node).toMatchObject({ status: 'draft' })
  })

  it('reports a section rename as one entry', () => {
    expect(entry(compare(2, 3), 'sec-hours')).toMatchObject({
      kind: 'changed',
      reason: 'renamed',
      scope: 'section',
      details: [{ type: 'title', before: 'Working Hours', after: 'Working Time' }],
    })
  })

  it('reports a whole new section as one entry', () => {
    const result = compare(1, 2)
    expect(entry(result, 'sec-remote')).toMatchObject({ kind: 'added', scope: 'section' })
    expect(entry(result, 'cl-remote-eligibility')).toBeUndefined()
  })

  it('compares paragraphs as plain text', () => {
    const reimbursement = entry(compare(2, 3), 'cl-exp-reimbursement')
    expect(reimbursement?.details).toEqual([
      {
        type: 'text',
        before: 'Submit receipts within 30 days of the expense. Late submissions may be rejected.',
        after:
          'Submit receipts within 30 days of the expense through the expenses portal. Late submissions may be rejected.',
      },
    ])
  })

  it('keeps ids as identities when text is almost the same', () => {
    const result = compare(1, 2)
    expect(entry(result, 'cl-sec-passwords')?.kind).toBe('removed')
    expect(entry(result, 'cl-sec-credentials')?.kind).toBe('added')
  })

  it('keeps the same rules across the full v1 to v3 pair', () => {
    const result = compare(1, 3)
    expect(entry(result, 'sec-remote')).toMatchObject({ kind: 'added', scope: 'section' })
    expect(entry(result, 'cl-remote-coworking')).toBeUndefined()
    expect(entry(result, 'cl-sec-access')).toMatchObject({
      kind: 'removed',
      reason: 'field-removed',
    })
    expect(entry(result, 'sec-hours')).toMatchObject({ kind: 'changed', reason: 'renamed' })
  })
})
