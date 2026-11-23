<script setup lang="ts">
import { computed } from 'vue'
import { changeCount, changeNoun, kindLabel } from '@/view-models/format'
import type { ChangeKind, DiffResult } from '@/domain/types'

const props = defineProps<{ result: DiffResult }>()

const kinds: ChangeKind[] = ['changed', 'added', 'removed', 'moved']
const parts = computed(() => kinds.map((k) => ({ kind: k, count: props.result.counts[k] })))
const total = computed(() => props.result.counts.total)
const pair = computed(() => `v${props.result.base.version} → v${props.result.target.version}`)
const hidden = computed(() => {
  const n = props.result.noise.length
  return n ? `${changeCount(n, 'formatting-only change')} hidden` : ''
})
</script>

<template>
  <!-- One compact card: the total answers "how much changed", the bar and chips say what kind. -->
  <section class="summary" aria-label="Summary of changes">
    <p class="sr-only" aria-live="polite">{{ changeCount(total) }} between {{ pair }}.</p>
    <div class="summary-total">
      <strong class="stat-value">{{ total }}</strong>
      <span class="summary-caption">{{ changeNoun(total) }}</span>
      <span class="pair-chip">{{ pair }}</span>
    </div>
    <ul class="summary-kinds" aria-label="Change breakdown">
      <li v-for="p in parts" :key="p.kind" :class="[p.kind, { 'is-zero': p.count === 0 }]">
        <span class="dot" aria-hidden="true" /><strong>{{ p.count }}</strong>
        {{ kindLabel[p.kind] }}
      </li>
    </ul>
    <span v-if="hidden" class="noise-note">{{ hidden }}</span>
    <div class="mix-bar" aria-hidden="true">
      <span
        v-for="p in parts.filter((x) => x.count > 0)"
        :key="p.kind"
        :class="p.kind"
        :style="{ flexGrow: p.count }"
      />
    </div>
  </section>
</template>
