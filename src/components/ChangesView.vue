<script setup lang="ts">
import { computed } from 'vue'
import ChangeItem from '@/components/ChangeItem.vue'
import type { DiffResult } from '@/domain/types'
import { changeGroups } from '@/view-models/changes'
import { changeCount, sectionCounts } from '@/view-models/format'

const props = defineProps<{ result: DiffResult }>()

const groups = computed(() => changeGroups(props.result))
const counts = computed(() => sectionCounts(props.result.entries))
const countText = (id: string) => changeCount(counts.value[id] ?? 0)
</script>

<template>
  <p v-if="groups.length === 0" class="empty">
    No changes between v{{ result.base.version }} and v{{ result.target.version }}.
  </p>
  <section v-for="group in groups" :key="group.id" class="panel" :aria-labelledby="group.id">
    <div class="section-head">
      <h2 :id="group.id" tabindex="-1">{{ group.title }}</h2>
      <span class="count">{{ countText(group.id) }}</span>
    </div>
    <!-- Rows in document order: a clause and a nested section appear where they are in the document. -->
    <template
      v-for="item in group.items"
      :key="item.type === 'entry' ? item.entry.id : item.subsection.id"
    >
      <ChangeItem v-if="item.type === 'entry'" :entry="item.entry" :level="3" />
      <section v-else class="subsection" :aria-labelledby="item.subsection.id">
        <div class="subsection-heading entry-status">
          <h3 :id="item.subsection.id" tabindex="-1">
            <span class="section-parent">{{ group.title }} /</span> {{ item.subsection.title }}
          </h3>
        </div>
        <div class="subsection-items">
          <ChangeItem
            v-for="entry in item.subsection.entries"
            :key="entry.id"
            :entry="entry"
            :level="4"
          />
        </div>
      </section>
    </template>
  </section>
</template>
