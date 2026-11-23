import { describe, expect, it } from 'vitest'
import { diffDocuments } from '@/domain/diff'
import { getVersion } from '@/domain/versions'
import { documentMarks, removedNotes } from '../fullDocument'

const compare = (base: number, target: number) =>
  diffDocuments(getVersion(base), getVersion(target))

describe('Full document data', () => {
  const result = compare(1, 2)

  it('marks nodes that still exist, with their reason', () => {
    const marks = documentMarks(result)
    expect(marks['cl-hours-holidays']).toBe('moved')
    expect(marks['sec-remote']).toBe('added')
    expect(marks['cl-sec-passwords']).toBeUndefined()
  })

  it('lists removed clauses under the parent that still shows them', () => {
    const notes = removedNotes(result)
    expect(notes['sec-tools']).toEqual([{ id: 'cl-tool-trello', title: 'Trello' }])
    expect(notes['sec-security']).toEqual([{ id: 'cl-sec-passwords', title: 'Passwords' }])
  })

  it('keeps a clause that lost its fields as a mark, not a removed note', () => {
    const later = compare(2, 3)
    expect(documentMarks(later)['cl-sec-access']).toBe('field-removed')
    expect(
      Object.values(removedNotes(later))
        .flat()
        .map((n) => n.id),
    ).not.toContain('cl-sec-access')
  })
})
