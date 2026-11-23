<script setup lang="ts">
import type { ContentsItem } from '@/view-models/contents'
import { changeCount } from '@/view-models/format'

defineProps<{ items: ContentsItem[]; current: string | null }>()
const emit = defineEmits<{ go: [id: string] }>()

// Built as one string: Vue condenses leading spaces inside elements, which glued "1change".
const srCount = (n: number) => `, ${changeCount(n)}`
</script>

<template>
  <ul>
    <li v-for="item in items" :key="item.id">
      <a
        :href="`#${item.id}`"
        :aria-current="current === item.id ? 'location' : undefined"
        @click.prevent="emit('go', item.id)"
      >
        {{ item.title
        }}<span v-if="item.count" class="count"
          ><span aria-hidden="true">{{ item.count }}</span
          ><span class="sr-only">{{ srCount(item.count) }}</span></span
        >
      </a>
      <ContentsList
        v-if="item.children.length"
        :items="item.children"
        :current="current"
        @go="emit('go', $event)"
      />
    </li>
  </ul>
</template>
