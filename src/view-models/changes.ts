import { plainText } from '@/domain/text'
import type { DiffEntry, DiffResult, SectionNode } from '@/domain/types'

export interface ChangeGroup {
  id: string
  title: string
  entries: DiffEntry[]
  subsections: { id: string; title: string; entries: DiffEntry[] }[]
}

/**
 * Entries of the Changes only view, grouped by top-level section, with a
 * nested section as its own group inside its parent. Sections keep the order
 * of the entries; a removed top-level section keeps its old title.
 */
export function changeGroups(result: DiffResult): ChangeGroup[] {
  const groups = new Map<string, ChangeGroup>()
  for (const entry of result.entries) {
    const section = result.target.children.find((s) => s.id === entry.sectionId)
    let group = groups.get(entry.sectionId)
    if (!group) {
      group = {
        id: entry.sectionId,
        title: section?.title ?? entry.title,
        entries: [],
        subsections: [],
      }
      groups.set(entry.sectionId, group)
    }
    if (!entry.subsectionId) {
      group.entries.push(entry)
      continue
    }
    let sub = group.subsections.find((s) => s.id === entry.subsectionId)
    if (!sub) {
      const nested = section?.children.find((c): c is SectionNode => c.id === entry.subsectionId)
      sub = { id: entry.subsectionId, title: nested?.title ?? entry.title, entries: [] }
      group.subsections.push(sub)
    }
    sub.entries.push(entry)
  }
  return [...groups.values()]
}

/**
 * How Changes only shows a paragraph: its plain text, markup dropped by an
 * inert parser. Rendering markup happens only in Full document, via SafeHtml.
 */
export function paragraphText(html: string): string {
  return plainText(html)
}
