import { describe, expect, it } from 'vitest'
import { diffDocuments } from '@/domain/diff'
import { getVersion } from '@/domain/versions'
import type { ClauseNode, DocumentVersion, SectionNode } from '@/domain/types'
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
    expect(before.map(({ text, changed }) => ({ text, changed }))).toEqual([
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

  it('keeps surrounding spaces outside the marked words', () => {
    const { after } = wordSegments(
      'of the expense. Late',
      'of the expense through the expenses portal. Late',
    )
    const inserted = after.find((s) => s.changed)!
    expect(inserted.lead + inserted.word + inserted.trail).toBe(inserted.text)
    expect(inserted.word).toBe('through the expenses portal')
    expect(inserted.lead).toBe(' ')
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

describe('changeGroups on synthetic documents', () => {
  const clause = (id: string, text = 'Text.'): ClauseNode => ({
    id,
    type: 'clause',
    title: id.toUpperCase(),
    children: [{ id: `p-${id}`, type: 'paragraph', text }],
  })
  const section = (id: string, children: (SectionNode | ClauseNode)[]): SectionNode => ({
    id,
    type: 'section',
    title: id.toUpperCase(),
    children,
  })
  const doc = (version: number, children: SectionNode[]): DocumentVersion => ({
    id: 'doc',
    version,
    title: 'Doc',
    updatedAt: '2026-01-01',
    children,
  })

  it('keeps document order when a clause comes before a nested section', () => {
    const result = diffDocuments(
      doc(1, [section('a', [clause('c', 'Old.'), section('n', [clause('d', 'Old.')])])]),
      doc(2, [section('a', [clause('c', 'New.'), section('n', [clause('d', 'New.')])])]),
    )
    const items = changeGroups(result)[0]!.items
    expect(items.map((i) => (i.type === 'entry' ? i.entry.id : i.subsection.id))).toEqual([
      'c',
      'n',
    ])
  })

  it('names a nested section from the base when it is gone from that place in the target', () => {
    // n moved from A to B; its clause c was removed, so c is reported under A / n.
    const result = diffDocuments(
      doc(1, [section('a', [section('n', [clause('c'), clause('d')])]), section('b', [])]),
      doc(2, [section('a', []), section('b', [section('n', [clause('d')])])]),
    )
    const a = changeGroups(result).find((g) => g.id === 'a')!
    expect(a.subsections.map((s) => s.title)).toEqual(['N'])
  })
})
