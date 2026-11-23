import type { DiffResult, SectionNode } from '@/domain/types'
import { sectionCounts } from './format'

export interface ContentsItem {
  id: string
  title: string
  count: number
  children: ContentsItem[]
}

/** Section tree for the Contents panel. Changes mode keeps only sections with changes. */
export function contentsTree(result: DiffResult, mode: 'changes' | 'full'): ContentsItem[] {
  const counts = sectionCounts(result.entries)
  const build = (sections: SectionNode[]): ContentsItem[] =>
    sections
      .map((section) => ({
        id: section.id,
        title: section.title,
        count: counts[section.id] ?? 0,
        children: build(section.children.filter((c): c is SectionNode => c.type === 'section')),
      }))
      .filter((item) => mode === 'full' || item.count > 0)

  const tree = build(result.target.children)
  if (mode === 'full') return tree

  // A removed top-level section has no place in the new document, but its
  // group in the Changes view still needs a link.
  const removed = result.entries
    .filter((e) => e.scope === 'section' && e.kind === 'removed' && e.sectionId === e.id)
    .map((e) => ({ id: e.id, title: e.title, count: counts[e.id] ?? 1, children: [] }))
  return [...tree, ...removed]
}

export interface HeadingPosition {
  id: string
  top: number
  /** Bottom of a nested section; once it passes the line, the parent is active again. */
  end?: number
  parentId?: string
}

/**
 * Which section the reader is in: the last heading whose top has passed the
 * reading line. Short final sections are reached because readingLine() slides
 * the line down over the last screen.
 */
export function pickActive(headings: HeadingPosition[], readingLine: number): string | null {
  let active: HeadingPosition | null = null
  for (const h of headings) {
    if (h.top <= readingLine) active = h
  }
  if (active?.parentId && active.end !== undefined && active.end <= readingLine)
    return active.parentId
  return active?.id ?? null
}

/**
 * Where the reading line sits. Near the top while more than one screen is left
 * below; over the last screen (or the whole scroll on short pages) it slides to
 * the bottom of the window, so short sections at the end of the page cross it
 * one by one instead of being skipped.
 * No extra space is added to the page.
 */
export function readingLine(at: {
  scrollY: number
  maxScroll: number
  viewport: number
  top: number
}): number {
  const left = Math.max(0, at.maxScroll - at.scrollY)
  // The line slides over the last screen of scrolling, or over all of it when
  // the page scrolls less than one screen; otherwise short pages start mid-way.
  const zone = Math.min(at.viewport, at.maxScroll)
  if (zone <= 0 || left >= zone) return at.top
  const progress = 1 - left / zone
  return Math.round(at.top + (at.viewport - at.top) * progress)
}
