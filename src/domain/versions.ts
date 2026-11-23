import type { DocumentVersion } from './types'

export interface VersionCatalog {
  /** Sorted by version number; gaps are allowed. */
  versions: DocumentVersion[]
  get(version: number): DocumentVersion
}

/** Any number of versions, in any order. Pure, so it is tested without files. */
export function createCatalog(list: DocumentVersion[]): VersionCatalog {
  const versions = [...list].sort((a, b) => a.version - b.version)
  return {
    versions,
    get(version) {
      const found = versions.find((v) => v.version === version)
      if (!found) throw new Error(`Unknown version ${version}`)
      return found
    },
  }
}

// The brief asks to load the JSON files directly. Vite bundles them at build time,
// so a new data/vN.json is picked up without code changes.
const files = import.meta.glob<DocumentVersion>('../../data/v*.json', {
  eager: true,
  import: 'default',
})

const catalog = createCatalog(Object.values(files))
export const versions = catalog.versions
export const getVersion = catalog.get
