<script setup lang="ts">
import { computed } from 'vue'
import { sanitizeHtml } from '@/security/sanitize'

const props = defineProps<{ html: string }>()
const safe = computed(() => sanitizeHtml(props.html))
</script>

<template>
  <!-- The only v-html in the app: input is sanitized with an allowlist (AGENTS.md, Security). -->
  <!-- eslint-disable-next-line vue/no-v-html -->
  <p v-html="safe" />
</template>
