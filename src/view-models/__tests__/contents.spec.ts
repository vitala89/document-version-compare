import { describe, expect, it } from 'vitest'
import { contentsTree, pickActive, readingLine } from '../contents'
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

const tops = [
  { id: 'sec-hours', top: -400 },
  { id: 'sec-expenses', top: -50 },
  { id: 'sec-travel', top: 120 },
  { id: 'sec-tools', top: 700 },
]

describe('pickActive', () => {
  it('picks the last heading above the reading line', () => {
    expect(pickActive(tops, 200)).toBe('sec-travel')
    expect(pickActive(tops, 100)).toBe('sec-expenses')
  })

  it('picks nothing before the first heading reaches the line', () => {
    expect(pickActive([{ id: 'a', top: 300 }], 200)).toBeNull()
  })

  it('returns to the parent once a nested section has scrolled past', () => {
    const nested = [
      { id: 'sec-expenses', top: -600 },
      { id: 'sec-travel', top: -500, end: 50, parentId: 'sec-expenses' },
    ]
    expect(pickActive(nested, 200)).toBe('sec-expenses')
    expect(pickActive([nested[0]!, { ...nested[1]!, end: 400 }], 200)).toBe('sec-travel')
  })
})

describe('readingLine', () => {
  const view = 900

  it('stays near the top while more than a screen is left below', () => {
    expect(readingLine({ scrollY: 0, maxScroll: 3000, viewport: view, top: 64 })).toBe(64)
    expect(readingLine({ scrollY: 2000, maxScroll: 3000, viewport: view, top: 64 })).toBe(64)
  })

  it('slides down over the last screen so short final sections get their turn', () => {
    expect(readingLine({ scrollY: 2550, maxScroll: 3000, viewport: view, top: 64 })).toBe(482)
    expect(readingLine({ scrollY: 3000, maxScroll: 3000, viewport: view, top: 64 })).toBe(900)
  })

  it('starts at the top on pages that scroll less than one screen, so the first section is not skipped', () => {
    expect(readingLine({ scrollY: 0, maxScroll: 300, viewport: view, top: 64 })).toBe(64)
    expect(readingLine({ scrollY: 150, maxScroll: 300, viewport: view, top: 64 })).toBe(482)
    expect(readingLine({ scrollY: 300, maxScroll: 300, viewport: view, top: 64 })).toBe(900)
  })
})

// Step-scrolling through a page: positions are document coordinates, as on the Changes only page.
type Layout = { id: string; top: number; end?: number; parentId?: string }[]
const visitOrder = (layout: Layout, pageHeight: number, viewport: number) => {
  const maxScroll = pageHeight - viewport
  const seen: string[] = []
  for (let scrollY = 10; scrollY <= maxScroll; scrollY += 10) {
    const line = readingLine({ scrollY, maxScroll, viewport, top: 64 })
    const headings = layout.map((h) => ({
      ...h,
      top: h.top - scrollY,
      end: h.end === undefined ? undefined : h.end - scrollY,
    }))
    const active = pickActive(headings, line)
    if (active && seen[seen.length - 1] !== active) seen.push(active)
  }
  return seen
}

describe('scroll tracking, step by step', () => {
  const page: Layout = [
    { id: 'sec-hours', top: 200 },
    { id: 'sec-expenses', top: 600 },
    { id: 'sec-travel', top: 800, end: 1100, parentId: 'sec-expenses' },
    { id: 'sec-security', top: 1400 },
    { id: 'sec-tools', top: 1800 },
    { id: 'sec-comms', top: 2600 },
    { id: 'sec-remote', top: 2750 },
  ]
  const inOrder = [
    'sec-hours',
    'sec-expenses',
    'sec-travel',
    'sec-expenses',
    'sec-security',
    'sec-tools',
    'sec-comms',
    'sec-remote',
  ]

  it.each([700, 900, 1100, 1400])(
    'lights every section once, in order, at a %ipx window, short final sections included',
    (viewport) => {
      expect(visitOrder(page, 2950, viewport)).toEqual(inOrder)
    },
  )

  it('starts with the first section on a page that scrolls less than one screen', () => {
    const short: Layout = [
      { id: 'sec-hours', top: 200 },
      { id: 'sec-expenses', top: 500 },
      { id: 'sec-travel', top: 650, end: 850, parentId: 'sec-expenses' },
      { id: 'sec-security', top: 1000 },
    ]
    const order = visitOrder(short, 1600, 1100)
    expect(order[0]).toBe('sec-hours')
    expect(order.indexOf('sec-hours')).toBeLessThan(order.indexOf('sec-travel'))
  })
})
