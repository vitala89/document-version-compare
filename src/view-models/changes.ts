import { diffWordsWithSpace } from 'diff'
import { plainText } from '@/domain/text'
import type { DiffEntry, DiffResult, DocumentVersion, SectionNode } from '@/domain/types'

export interface ChangeSubsection {
  id: string
  title: string
  entries: DiffEntry[]
}

/** One row of a group, in document order: an entry, or a nested section with its entries. */
export type ChangeGroupItem =
  { type: 'entry'; entry: DiffEntry } | { type: 'subsection'; subsection: ChangeSubsection }

export interface ChangeGroup {
  id: string
  title: string
  entries: DiffEntry[]
  subsections: ChangeSubsection[]
  items: ChangeGroupItem[]
}

/** A top-level or one-level nested section by id. */
function findSection(doc: DocumentVersion, id: string): SectionNode | undefined {
  for (const top of doc.children) {
    if (top.id === id) return top
    for (const child of top.children) {
      if (child.type === 'section' && child.id === id) return child
    }
  }
  return undefined
}

/**
 * Entries of the Changes only view, grouped by top-level section, with a
 * nested section as its own group inside its parent. Rows keep document order.
 * A section that is gone from the target keeps its title from the base.
 */
export function changeGroups(result: DiffResult): ChangeGroup[] {
  const titleOf = (id: string, fallback: string) =>
    (findSection(result.target, id) ?? findSection(result.base, id))?.title ?? fallback
  const groups = new Map<string, ChangeGroup>()
  for (const entry of result.entries) {
    let group = groups.get(entry.sectionId)
    if (!group) {
      group = {
        id: entry.sectionId,
        title: titleOf(entry.sectionId, entry.title),
        entries: [],
        subsections: [],
        items: [],
      }
      groups.set(entry.sectionId, group)
    }
    if (!entry.subsectionId) {
      group.entries.push(entry)
      group.items.push({ type: 'entry', entry })
      continue
    }
    let sub = group.subsections.find((s) => s.id === entry.subsectionId)
    if (!sub) {
      sub = { id: entry.subsectionId, title: titleOf(entry.subsectionId, entry.title), entries: [] }
      group.subsections.push(sub)
      group.items.push({ type: 'subsection', subsection: sub })
    }
    sub.entries.push(entry)
  }
  return [...groups.values()]
}

export interface Segment {
  text: string
  changed: boolean
  /** The text split so that surrounding spaces can stay outside a highlight. */
  lead: string
  word: string
  trail: string
}

const segment = (text: string, changed: boolean): Segment => {
  const [, lead = '', word = '', trail = ''] = /^(\s*)([\s\S]*?)(\s*)$/.exec(text) ?? []
  return { text, changed, lead, word, trail }
}

/** Splits two plain texts into segments for the Before and After lines, marking changed words. */
export function wordSegments(
  before: string,
  after: string,
): { before: Segment[]; after: Segment[] } {
  const result = { before: [] as Segment[], after: [] as Segment[] }
  // WithSpace keeps whitespace as tokens, so each side rebuilds its original text exactly.
  for (const part of diffWordsWithSpace(before, after)) {
    if (!part.added) result.before.push(segment(part.value, part.removed))
    if (!part.removed) result.after.push(segment(part.value, part.added))
  }
  return result
}

/**
 * How Changes only shows a paragraph: its plain text, markup dropped by an
 * inert parser. Rendering markup happens only in Full document, via SafeHtml.
 */
export function paragraphText(html: string): string {
  return plainText(html)
}
