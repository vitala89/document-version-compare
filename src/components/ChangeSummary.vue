<script setup lang="ts">
import { computed } from 'vue'
import { changeCount } from '@/view-models/format'
import type { ChangeKind, DiffResult } from '@/domain/types'

const props = defineProps<{ result: DiffResult }>()

const kinds: ChangeKind[] = ['changed', 'added', 'removed', 'moved']
const parts = computed(() => kinds.map((k) => ({ kind: k, count: props.result.counts[k] })))
const total = computed(() => props.result.counts.total)
const pair = computed(() => `v${props.result.base.version} → v${props.result.target.version}`)
</script>

<template>
  <!-- One compact card: the total answers "how much changed", the bar and chips say what kind. -->
  <section class="summary" aria-label="Summary of changes">
    <p class="sr-only" aria-live="polite">{{ changeCount(total) }} between {{ pair }}.</p>
    <div class="summary-total">
      <strong class="stat-value">{{ total }}</strong>
      <span class="summary-caption">{{ total === 1 ? 'change' : 'changes' }}</span>
      <span class="pair-chip">{{ pair }}</span>
    </div>
    <ul class="summary-kinds" aria-label="Change breakdown">
      <li v-for="p in parts" :key="p.kind" :class="[p.kind, { 'is-zero': p.count === 0 }]">
        <span class="dot" aria-hidden="true" /><strong>{{ p.count }}</strong> {{ p.kind }}
      </li>
    </ul>
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
