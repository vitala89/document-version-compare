import { computed, type Ref } from 'vue'
import { diffDocuments } from '@/domain/diff'
import { getVersion, versions } from '@/domain/versions'

// The UI reaches the domain only through this module (docs/architecture.md).
export { versions }

/** Diff of the selected pair. Recomputed only when a version changes. */
export function useComparison(base: Ref<number>, target: Ref<number>) {
  return computed(() => diffDocuments(getVersion(base.value), getVersion(target.value)))
}
