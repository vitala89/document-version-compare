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
