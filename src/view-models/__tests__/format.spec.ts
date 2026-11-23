import { describe, expect, it } from 'vitest'
import { changeCount, reasonLabel, reasonTone, sectionCounts } from '../format'
import { diffDocuments } from '@/domain/diff'
import { getVersion } from '@/domain/versions'

const compare = (base: number, target: number) =>
  diffDocuments(getVersion(base), getVersion(target))

describe('changeCount', () => {
  it('uses singular only for one', () => {
    expect(changeCount(1)).toBe('1 change')
    expect(changeCount(0)).toBe('0 changes')
    expect(changeCount(2, 'formatting-only change')).toBe('2 formatting-only changes')
  })
})

describe('labels', () => {
  it('has text and a colour for every reason', () => {
    for (const reason of Object.keys(reasonLabel) as (keyof typeof reasonLabel)[]) {
      expect(reasonLabel[reason]).toBeTruthy()
      expect(reasonTone[reason]).toBeTruthy()
    }
  })
})

describe('sectionCounts', () => {
  it('counts per section, parents include nested sections', () => {
    expect(sectionCounts(compare(2, 3).entries)).toEqual({
      'sec-hours': 1,
      'sec-expenses': 2,
      'sec-travel': 1,
      'sec-security': 1,
      'sec-tools': 4,
      'sec-comms': 1,
      'sec-remote': 1,
    })
    expect(sectionCounts(compare(1, 3).entries)).toMatchObject({
      'sec-expenses': 3,
      'sec-travel': 2,
      'sec-tools': 7,
    })
  })
})
