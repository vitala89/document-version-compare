<script setup lang="ts">
defineProps<{ before?: string; after?: string }>()
</script>

<template>
  <div class="values">
    <span class="old-value"><span class="sr-only">Before: </span>{{ before || '—' }}</span>
    <span class="arrow" aria-hidden="true">→</span>
    <span class="after"><span class="sr-only">After: </span>{{ after || '—' }}</span>
  </div>
</template>
