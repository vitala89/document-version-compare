<script setup lang="ts">
import SafeHtml from '@/components/SafeHtml.vue'
import type { ClauseNode } from '@/domain/types'
import { paragraphText } from '@/view-models/changes'

defineProps<{ clause: ClauseNode; rich?: boolean }>()
</script>

<template>
  <div class="notes">
    <template v-for="child in clause.children" :key="child.id">
      <dl v-if="child.type === 'field'" class="field-value">
        <dt>{{ child.label }}</dt>
        <dd>{{ child.value }}</dd>
      </dl>
      <SafeHtml v-else-if="rich" :html="child.text" />
      <p v-else>{{ paragraphText(child.text) }}</p>
    </template>
    <p v-if="clause.children.length === 0">No fields or text.</p>
  </div>
</template>
