import type { ChangeReason, DiffResult } from '@/domain/types'

/** Reason to show next to each node that still exists in the target version. */
export function documentMarks(result: DiffResult): Record<string, ChangeReason> {
  const marks: Record<string, ChangeReason> = {}
  for (const e of result.entries) {
    if (e.reason !== 'removed') marks[e.id] = e.reason
  }
  return marks
}

export interface RemovedNote {
  id: string
  title: string
}

/** Removed sections and clauses, keyed by the parent that still shows them (the document id for top-level sections). */
export function removedNotes(result: DiffResult): Record<string, RemovedNote[]> {
  const notes: Record<string, RemovedNote[]> = {}
  for (const e of result.entries) {
    if (e.reason !== 'removed') continue
    ;(notes[e.parentId ?? result.target.id] ??= []).push({ id: e.id, title: e.title })
  }
  return notes
}
