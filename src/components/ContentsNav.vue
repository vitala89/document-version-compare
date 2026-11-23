<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import ContentsList from '@/components/ContentsList.vue'
import { useScrollSpy } from '@/composables/useScrollSpy'
import type { ContentsItem } from '@/view-models/contents'

const props = defineProps<{ items: ContentsItem[] }>()
const current = ref<string | null>(null)

const flat = (
  items: ContentsItem[],
  parent?: ContentsItem,
): { id: string; label: string; parentId?: string }[] =>
  items.flatMap((item) => [
    {
      id: item.id,
      parentId: parent?.id,
      label: `${parent ? parent.title + ' / ' : ''}${item.title}`,
    },
    ...flat(item.children, item),
  ])
const options = computed(() => flat(props.items))

const { lockAfterJump } = useScrollSpy(() => options.value, current)

async function goTo(id: string) {
  current.value = id
  lockAfterJump()
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
