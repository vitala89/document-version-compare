import { describe, expect, it } from 'vitest'
import { diffDocuments } from '@/domain/diff'
import { getVersion } from '@/domain/versions'
import { changeGroups } from '../changes'

const compare = (base: number, target: number) =>
  diffDocuments(getVersion(base), getVersion(target))

describe('changeGroups', () => {
  it('shows Travel as its own group inside Expenses', () => {
    const expenses = changeGroups(compare(2, 3)).find((g) => g.id === 'sec-expenses')!
    expect(expenses.title).toBe('Expenses')
    expect(expenses.subsections).toEqual([
      expect.objectContaining({ id: 'sec-travel', title: 'Travel' }),
    ])
    expect(expenses.subsections[0]!.entries).toHaveLength(1)
    expect(expenses.entries).toHaveLength(1)
  })

  it('keeps target section order', () => {
    expect(changeGroups(compare(2, 3)).map((g) => g.id)).toEqual([
      'sec-hours',
      'sec-expenses',
      'sec-security',
      'sec-tools',
      'sec-comms',
      'sec-remote',
    ])
  })
})
