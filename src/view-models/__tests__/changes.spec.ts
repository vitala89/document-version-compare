import { describe, expect, it } from 'vitest'
import { diffDocuments } from '@/domain/diff'
import { getVersion } from '@/domain/versions'
import { changeGroups, wordSegments } from '../changes'

const compare = (base: number, target: number) =>
  diffDocuments(getVersion(base), getVersion(target))

describe('changeGroups', () => {
  it('shows Travel as its own group inside Expenses', () => {
    const expenses = changeGroups(compare(2, 3)).find((g) => g.id === 'sec-expenses')!
    expect(expenses.title).toBe('Expenses')
    expect(expenses.subsections).toEqual([
      expect.objectContaining({ id: 'sec-travel', title: 'Travel' }),
    ])
    expect(expenses.subsections[0]!.entries).toHaveLength(1)
    expect(expenses.entries).toHaveLength(1)
  })

  it('keeps target section order', () => {
    expect(changeGroups(compare(2, 3)).map((g) => g.id)).toEqual([
      'sec-hours',
      'sec-expenses',
      'sec-security',
      'sec-tools',
      'sec-comms',
      'sec-remote',
    ])
  })
})

describe('wordSegments', () => {
  it('marks only the changed words on each side', () => {
    const { before, after } = wordSegments('flights under six hours.', 'flights under eight hours.')
    expect(before).toEqual([
      { text: 'flights under ', changed: false },
      { text: 'six', changed: true },
      { text: ' hours.', changed: false },
    ])
    expect(after.filter((s) => s.changed).map((s) => s.text)).toEqual(['eight'])
  })

  it('handles an insertion with nothing removed', () => {
    const { before, after } = wordSegments(
      'of the expense. Late',
      'of the expense through the expenses portal. Late',
    )
    expect(before.some((s) => s.changed)).toBe(false)
    expect(after.filter((s) => s.changed).map((s) => s.text.trim())).toEqual([
      'through the expenses portal',
    ])
  })

  it('rebuilds both original texts exactly', () => {
    const before =
      'Submit receipts within 30 days of the expense. Late submissions may be rejected.'
    const after =
      'Submit receipts within 30 days of the expense through the expenses portal. Late submissions may be rejected.'
    const segments = wordSegments(before, after)
    expect(segments.before.map((s) => s.text).join('')).toBe(before)
    expect(segments.after.map((s) => s.text).join('')).toBe(after)
  })
})
