<script setup lang="ts">
import type { ChangeReason } from '@/domain/types'
import { reasonLabel, reasonTone } from '@/view-models/format'

defineProps<{ reason: ChangeReason }>()
</script>

<template>
  <span class="full-mark" :class="reasonTone[reason]">{{ reasonLabel[reason] }}</span>
</template>
