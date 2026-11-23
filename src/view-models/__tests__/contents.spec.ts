import { describe, expect, it } from 'vitest'
import { contentsTree } from '../contents'
import { diffDocuments } from '@/domain/diff'
import { getVersion } from '@/domain/versions'

const result = diffDocuments(getVersion(2), getVersion(3))

describe('contentsTree', () => {
  it('lists only sections with changes in Changes only mode', () => {
    const tree = contentsTree(result, 'changes')
    expect(tree.map((s) => s.id)).toEqual([
      'sec-hours',
      'sec-expenses',
      'sec-security',
      'sec-tools',
      'sec-comms',
      'sec-remote',
    ])
    expect(tree[1]).toMatchObject({
      count: 2,
      children: [{ id: 'sec-travel', title: 'Travel', count: 1 }],
    })
  })

  it('lists every section in Full document mode', () => {
    const tree = contentsTree(result, 'full')
    expect(tree).toHaveLength(8)
    expect(tree[0]).toMatchObject({ id: 'sec-intro', count: 0 })
  })
})

describe('contentsTree with a removed top-level section', () => {
  const doc = (version: number, ids: string[]) => ({
    id: 'doc',
    version,
    title: 'Doc',
    updatedAt: '2026-01-01',
    children: ids.map((id) => ({
      id,
      type: 'section' as const,
      title: id.toUpperCase(),
      children: [],
    })),
  })
  const removed = diffDocuments(doc(1, ['a', 'gone']), doc(2, ['a']))

  it('keeps a link to the removed section in Changes only mode', () => {
    expect(contentsTree(removed, 'changes')).toEqual([
      { id: 'gone', title: 'GONE', count: 1, children: [] },
    ])
  })

  it('does not list it in Full document mode, where it is a note', () => {
    expect(contentsTree(removed, 'full').map((s) => s.id)).toEqual(['a'])
  })
})
