import { describe, expect, it } from 'vitest'
import { diffDocuments } from '../diff'
import type { ClauseNode, DocumentVersion, SectionNode } from '../types'

const clause = (id: string, title: string, text = 'Text.'): ClauseNode => ({
  id,
  type: 'clause',
  title,
  children: [{ id: `p-${id}`, type: 'paragraph', text }],
})
const section = (
  id: string,
  title: string,
  children: (SectionNode | ClauseNode)[],
): SectionNode => ({
  id,
  type: 'section',
  title,
  children,
})
const doc = (version: number, children: SectionNode[]): DocumentVersion => ({
  id: 'doc',
  version,
  title: 'Doc',
  updatedAt: '2026-01-01',
  children,
})

describe('diffDocuments: synthetic edge cases', () => {
  it('keeps details on a clause that moved and changed', () => {
    const result = diffDocuments(
      doc(1, [section('a', 'A', [clause('c', 'C', 'Old.')]), section('b', 'B', [])]),
      doc(2, [section('a', 'A', []), section('b', 'B', [clause('c', 'C', 'New.')])]),
    )
    expect(result.entries).toEqual([
      expect.objectContaining({
        id: 'c',
        kind: 'moved',
        movedFrom: 'A',
        details: [{ type: 'text', before: 'Old.', after: 'New.' }],
      }),
    ])
  })

  it('reports a nested section that moved to another top section', () => {
    const result = diffDocuments(
      doc(1, [section('a', 'A', [section('n', 'N', [clause('c', 'C')])]), section('b', 'B', [])]),
      doc(2, [section('a', 'A', []), section('b', 'B', [section('n', 'N', [clause('c', 'C')])])]),
    )
    expect(result.entries).toEqual([
      expect.objectContaining({ id: 'n', kind: 'moved', scope: 'section', movedFrom: 'A' }),
    ])
    expect(result.entries[0]).toMatchObject({ sectionId: 'b', subsectionId: 'n', parentId: 'b' })
  })

  it('keeps the rename on a nested section that also moved', () => {
    const result = diffDocuments(
      doc(1, [section('a', 'A', [section('n', 'Old', [])]), section('b', 'B', [])]),
      doc(2, [section('a', 'A', []), section('b', 'B', [section('n', 'New', [])])]),
    )
    expect(result.entries).toEqual([
      expect.objectContaining({
        id: 'n',
        kind: 'moved',
        movedFrom: 'A',
        details: [{ type: 'title', before: 'Old', after: 'New' }],
      }),
    ])
  })

  it('reports a renamed nested section under its parent', () => {
    const result = diffDocuments(
      doc(1, [section('a', 'A', [section('n', 'Old', [])])]),
      doc(2, [section('a', 'A', [section('n', 'New', [])])]),
    )
    expect(result.entries[0]).toMatchObject({
      id: 'n',
      reason: 'renamed',
      sectionId: 'a',
      subsectionId: 'n',
    })
  })

  it('lists a removed top-level section once, under the document root', () => {
    const result = diffDocuments(
      doc(1, [section('a', 'A', []), section('gone', 'Gone', [clause('c', 'C')])]),
      doc(2, [section('a', 'A', [])]),
    )
    expect(result.entries).toEqual([
      expect.objectContaining({ id: 'gone', kind: 'removed', scope: 'section' }),
    ])
    expect(result.entries[0]).toMatchObject({ parentId: null })
  })

  it('detects reordered top-level sections', () => {
    const result = diffDocuments(
      doc(1, [section('a', 'A', []), section('b', 'B', [])]),
      doc(2, [section('b', 'B', []), section('a', 'A', [])]),
    )
    expect(result.reorderedParents).toEqual(['root'])
    expect(result.counts.total).toBe(0)
  })

  it('treats markup-only and whitespace-only changes as noise, titles included', () => {
    const result = diffDocuments(
      doc(1, [section('a', 'A', [clause('c', 'Title', 'Read the policy.')])]),
      doc(2, [section('a', 'A ', [clause('c', 'Title  ', 'Read the <b>policy</b>.')])]),
    )
    expect(result.counts.total).toBe(0)
    expect(result.noise).toEqual([
      { id: 'a', reason: 'whitespace' },
      { id: 'c', reason: 'whitespace' },
      { id: 'p-c', reason: 'markup' },
    ])
  })

  it('reports a field and a paragraph added to an existing clause, and a new clause title, as one change', () => {
    const before = clause('c', 'Old title')
    const after: ClauseNode = {
      ...clause('c', 'New title'),
      children: [
        ...before.children,
        { id: 'f-new', type: 'field', label: 'Limit', value: '50 EUR' },
        { id: 'p-new', type: 'paragraph', text: 'Extra <b>rule</b>.' },
      ],
    }
    const result = diffDocuments(
      doc(1, [section('s', 'S', [before])]),
      doc(2, [section('s', 'S', [after])]),
    )
    expect(result.counts.total).toBe(1)
    expect(result.entries[0]).toMatchObject({ id: 'c', kind: 'changed', reason: 'changed' })
    expect(result.entries[0]!.details).toEqual([
      { type: 'title', before: 'Old title', after: 'New title' },
      { type: 'field-added', label: 'Limit', value: '50 EUR' },
      { type: 'text-added', text: 'Extra rule.' },
    ])
  })

  it('counts a clause that only lost a paragraph as changed, not field-removed', () => {
    const before: ClauseNode = {
      id: 'c',
      type: 'clause',
      title: 'C',
      children: [
        { id: 'f-c', type: 'field', label: 'Limit', value: '50 EUR' },
        { id: 'p-c', type: 'paragraph', text: 'Old rule.' },
      ],
    }
    const after: ClauseNode = { ...before, children: [before.children[0]!] }
    const result = diffDocuments(
      doc(1, [section('s', 'S', [before])]),
      doc(2, [section('s', 'S', [after])]),
    )
    expect(result.entries[0]).toMatchObject({ id: 'c', kind: 'changed', reason: 'changed' })
    expect(result.entries[0]!.details).toEqual([{ type: 'text-removed', text: 'Old rule.' }])
  })

  it('finds no changes between identical versions', () => {
    const tree = [section('s', 'S', [clause('c', 'C')])]
    const result = diffDocuments(doc(1, tree), doc(2, tree))
    expect(result.entries).toEqual([])
    expect(result.counts.total).toBe(0)
  })
})
