<script setup lang="ts">
import type { DocumentVersion } from '@/domain/types'

defineProps<{ versions: DocumentVersion[] }>()
const base = defineModel<number>('base', { required: true })
const target = defineModel<number>('target', { required: true })

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
// updatedAt is an ISO date (YYYY-MM-DD); formatted by hand to avoid locale differences like "Sept".
const label = (v: DocumentVersion) => {
  const [year, month, day] = v.updatedAt.split('-').map(Number)
  return `v${v.version} · ${day} ${MONTHS[month! - 1]} ${year}`
}
</script>

<template>
  <div class="pair">
    <label class="field"
      >Base version
      <span class="select-control">
        <select v-model.number="base">
          <option
            v-for="v in versions.slice(0, -1)"
            :key="v.version"
            :value="v.version"
            :disabled="v.version >= target"
          >
            {{ label(v) }}
          </option>
        </select>
      </span>
    </label>
    <span class="pair-arrow" aria-hidden="true">→</span>
    <label class="field"
      >Compare to
      <span class="select-control">
        <!-- Both lists only offer older → newer pairs, so neither list ever changes the other one. -->
        <select v-model.number="target">
          <option
            v-for="v in versions.slice(1)"
            :key="v.version"
            :value="v.version"
            :disabled="v.version <= base"
          >
            {{ label(v) }}
          </option>
        </select>
      </span>
    </label>
  </div>
</template>
