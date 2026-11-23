<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import ContentsList from '@/components/ContentsList.vue'
import { useScrollSpy } from '@/composables/useScrollSpy'
import type { ContentsItem } from '@/view-models/contents'

const props = defineProps<{ items: ContentsItem[] }>()
const current = ref<string | null>(null)
const sheet = ref<HTMLDetailsElement | null>(null)

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
// Narrow screens: the pinned bar names the section the reader is in.
const currentLabel = computed(
  () => options.value.find((o) => o.id === current.value)?.label ?? 'Jump to section',
)

// The bar is hidden (no offsetParent) on wide screens, so it covers nothing there.
const barBottom = () => (sheet.value?.offsetParent ? sheet.value.getBoundingClientRect().bottom : 0)
const { lockAfterJump } = useScrollSpy(() => options.value, current, barBottom)

async function goTo(id: string) {
  if (sheet.value) sheet.value.open = false
  current.value = id
  lockAfterJump()
  await nextTick()
  const heading = document.getElementById(id)
  if (!heading) return
  heading.focus({ preventScroll: true })
  heading.scrollIntoView({ block: 'start' })
}

function closeSheet() {
  if (!sheet.value?.open) return
  sheet.value.open = false
  sheet.value.querySelector('summary')?.focus()
}

// Listened on the window: after a jump focus sits on the heading, outside the bar,
// and a tap on the bar does not move it back on touch screens.
const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') closeSheet()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <nav class="contents" aria-label="Contents">
    <div class="wide-nav">
      <h2>Contents</h2>
      <ContentsList :items="items" :current="current" @go="goTo" />
    </div>
    <!-- Narrow screens: a bar pinned to the top. It shows where the reader is; one tap opens the list, one tap jumps. -->
    <details ref="sheet" class="compact-nav">
      <summary>
        <span class="compact-hint">Section</span>
        <span class="compact-label">{{ currentLabel }}</span>
      </summary>
      <ContentsList :items="items" :current="current" @go="goTo" />
    </details>
  </nav>
</template>
