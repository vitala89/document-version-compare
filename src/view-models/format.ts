import type { ChangeKind, ChangeReason, DiffEntry } from '@/domain/types'

/** "change" or "changes", for a number shown on its own next to the word. */
export function changeNoun(n: number, noun = 'change'): string {
  return `${noun}${n === 1 ? '' : 's'}`
}

/** "1 change", "3 changes". One place for the wording used across the UI. */
export function changeCount(n: number, noun = 'change'): string {
  return `${n} ${changeNoun(n, noun)}`
}

/** Display text for each reason. The only place where these words live. */
export const reasonLabel: Record<ChangeReason, string> = {
  added: 'Added',
  removed: 'Removed',
  changed: 'Changed',
  renamed: 'Renamed',
  moved: 'Moved',
  'field-removed': 'Field removed',
}

/** Colour family of a reason: a rename reads as a change, a lost field as a removal. */
export const reasonTone: Record<ChangeReason, ChangeKind> = {
  added: 'added',
  removed: 'removed',
  changed: 'changed',
  renamed: 'changed',
  moved: 'moved',
  'field-removed': 'removed',
}

/** Words for an added or removed line inside a clause, so colour is never the only signal. */
export const lineLabel = {
  'field-added': 'Field added',
  'field-removed': reasonLabel['field-removed'],
  'text-added': 'Text added',
  'text-removed': 'Text removed',
} as const

/** Kind names in the summary chips. */
export const kindLabel: Record<ChangeKind, string> = {
  changed: 'changed',
  added: 'added',
  removed: 'removed',
  moved: 'moved',
}

/** Heading of a section entry in Changes only, where the section's own title is the detail. */
export const sectionHeading = { renamed: 'Section name', added: 'New section' } as const

/** Changes per section id. A parent section also counts the changes of its nested section. */
export function sectionCounts(entries: DiffEntry[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const e of entries) {
    counts[e.sectionId] = (counts[e.sectionId] ?? 0) + 1
    if (e.subsectionId) counts[e.subsectionId] = (counts[e.subsectionId] ?? 0) + 1
  }
  return counts
}
