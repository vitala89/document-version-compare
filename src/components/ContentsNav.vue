<script setup lang="ts">
import { nextTick, ref } from 'vue'
import ContentsList from '@/components/ContentsList.vue'
import type { ContentsItem } from '@/view-models/contents'

defineProps<{ items: ContentsItem[] }>()
const current = ref<string | null>(null)

async function goTo(id: string) {
  current.value = id
  await nextTick()
  const heading = document.getElementById(id)
  if (!heading) return
  heading.focus({ preventScroll: true })
  heading.scrollIntoView({ block: 'start' })
}
</script>

<template>
  <nav class="contents" aria-label="Contents">
    <div class="wide-nav">
      <h2>Contents</h2>
      <ContentsList :items="items" :current="current" @go="goTo" />
    </div>
  </nav>
</template>
