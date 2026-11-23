import { describe, expect, it } from 'vitest'
import {
  changeCount,
  changeNoun,
  kindLabel,
  lineLabel,
  reasonLabel,
  reasonTone,
  sectionCounts,
  sectionHeading,
} from '../format'
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
    expect(sectionCounts(compare(1, 2).entries)).toEqual({
      'sec-intro': 1,
      'sec-hours': 1,
      'sec-leave': 2,
      'sec-expenses': 1,
      'sec-travel': 1,
      'sec-security': 2,
      'sec-tools': 3,
      'sec-remote': 1,
    })
    expect(sectionCounts(compare(1, 3).entries)).toEqual({
      'sec-intro': 1,
      'sec-hours': 2,
      'sec-leave': 2,
      'sec-expenses': 3,
      'sec-travel': 2,
      'sec-security': 3,
      'sec-tools': 7,
      'sec-comms': 1,
      'sec-remote': 1,
    })
  })
})

describe('words used on screen', () => {
  it('names each added or removed line and each kind in one place', () => {
    expect(lineLabel['field-added']).toBe('Field added')
    expect(lineLabel['field-removed']).toBe(reasonLabel['field-removed'])
    expect(lineLabel['text-added']).toBe('Text added')
    expect(lineLabel['text-removed']).toBe('Text removed')
    expect(kindLabel.moved).toBe('moved')
    expect(sectionHeading).toEqual({ renamed: 'Section name', added: 'New section' })
  })

  it('gives the noun on its own for a big number next to it', () => {
    expect(changeNoun(1)).toBe('change')
    expect(changeNoun(10)).toBe('changes')
  })
})
