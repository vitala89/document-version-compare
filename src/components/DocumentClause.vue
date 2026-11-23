<script setup lang="ts">
import ChangeMark from '@/components/ChangeMark.vue'
import ClauseBody from '@/components/ClauseBody.vue'
import type { ChangeReason, ClauseNode } from '@/domain/types'

defineProps<{ clause: ClauseNode; mark?: ChangeReason; level: 3 | 4 }>()
</script>

<template>
  <div class="clause">
    <div class="entry-status">
      <component :is="`h${level}`">{{ clause.title }}</component>
      <ChangeMark v-if="mark" :reason="mark" />
      <span v-if="clause.status === 'draft'" class="tag draft">Draft</span>
    </div>
    <ClauseBody :clause="clause" rich />
  </div>
</template>
