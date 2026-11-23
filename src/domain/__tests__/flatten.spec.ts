import { describe, expect, it } from 'vitest'
import { indexDocument } from '../flatten'
import { getVersion } from '../versions'

describe('indexDocument', () => {
  const index = indexDocument(getVersion(2))

  it('records parent, top section and nested section', () => {
    expect(index.get('cl-hours-holidays')).toMatchObject({
      parentId: 'sec-leave',
      topSectionId: 'sec-leave',
    })
    expect(index.get('cl-travel-flights')).toMatchObject({
      parentId: 'sec-travel',
      topSectionId: 'sec-expenses',
      subsectionId: 'sec-travel',
    })
    expect(index.get('sec-expenses')?.parentId).toBeNull()
  })
})
