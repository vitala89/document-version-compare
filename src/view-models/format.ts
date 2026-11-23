import type { ChangeKind, ChangeReason, DiffEntry } from '@/domain/types'

/** "1 change", "3 changes". One place for the wording used across the UI. */
export function changeCount(n: number, noun = 'change'): string {
  return `${n} ${noun}${n === 1 ? '' : 's'}`
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

/** Changes per section id. A parent section also counts the changes of its nested section. */
export function sectionCounts(entries: DiffEntry[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const e of entries) {
    counts[e.sectionId] = (counts[e.sectionId] ?? 0) + 1
    if (e.subsectionId) counts[e.subsectionId] = (counts[e.subsectionId] ?? 0) + 1
  }
  return counts
}
