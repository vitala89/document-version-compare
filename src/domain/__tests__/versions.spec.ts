import { describe, expect, it } from 'vitest'
import type { DocumentVersion } from '../types'
import { createCatalog, getVersion, versions } from '../versions'

describe('versions', () => {
  it('loads the three snapshots sorted by version', () => {
    expect(versions.map((v) => v.version)).toEqual([1, 2, 3])
    expect(versions[0]?.updatedAt).toBe('2026-01-15')
  })

  it('finds a version by number', () => {
    expect(getVersion(3).title).toBe('Team Handbook')
    expect(() => getVersion(9)).toThrow('Unknown version 9')
  })

  it('sorts any number of versions by their number and allows gaps', () => {
    const v = (version: number): DocumentVersion => ({
      id: 'doc',
      version,
      title: `Doc v${version}`,
      updatedAt: '2026-01-01',
      children: [],
    })
    const catalog = createCatalog([v(10), v(1), v(4), v(25), v(7)])
    expect(catalog.versions.map((d) => d.version)).toEqual([1, 4, 7, 10, 25])
    expect(catalog.get(25).title).toBe('Doc v25')
    expect(() => catalog.get(2)).toThrow('Unknown version 2')
  })
})
