<script setup lang="ts">
import { computed } from 'vue'
import ChangeMark from '@/components/ChangeMark.vue'
import DocumentClause from '@/components/DocumentClause.vue'
import type { DiffResult } from '@/domain/types'
import { changeCount, sectionCounts } from '@/view-models/format'
import { documentMarks, removedNotes } from '@/view-models/fullDocument'

const props = defineProps<{ result: DiffResult }>()

const counts = computed(() => sectionCounts(props.result.entries))
const marks = computed(() => documentMarks(props.result))
const notes = computed(() => removedNotes(props.result))

const countText = (id: string) => {
  const n = counts.value[id] ?? 0
  return n ? changeCount(n) : ''
}
const removed = (parentId: string) => notes.value[parentId] ?? []
</script>

<template>
  <section
    v-for="section in result.target.children"
    :key="section.id"
    class="panel"
    :aria-labelledby="section.id"
  >
    <div class="section-head">
      <div class="entry-status">
        <h2 :id="section.id" tabindex="-1">{{ section.title }}</h2>
        <ChangeMark v-if="marks[section.id]" :reason="marks[section.id]!" />
      </div>
      <span v-if="countText(section.id)" class="count full-change-count">{{
        countText(section.id)
      }}</span>
    </div>

    <template v-for="child in section.children" :key="child.id">
      <section v-if="child.type === 'section'" class="subsection" :aria-labelledby="child.id">
        <div class="subsection-heading entry-status">
          <h3 :id="child.id" tabindex="-1">
            <span class="section-parent">{{ section.title }} /</span> {{ child.title }}
          </h3>
          <ChangeMark v-if="marks[child.id]" :reason="marks[child.id]!" />
        </div>
        <div class="subsection-items">
          <template v-for="item in child.children" :key="item.id">
            <DocumentClause
              v-if="item.type === 'clause'"
              :clause="item"
              :mark="marks[item.id]"
              :level="4"
            />
          </template>
          <p v-for="gone in removed(child.id)" :key="gone.id" class="removed-note">
            <ChangeMark reason="removed" /><span>{{ gone.title }}</span>
          </p>
        </div>
      </section>
      <DocumentClause v-else :clause="child" :mark="marks[child.id]" :level="3" />
    </template>

    <p v-for="gone in removed(section.id)" :key="gone.id" class="removed-note">
      <ChangeMark reason="removed" /><span>{{ gone.title }}</span>
    </p>
  </section>
  <section v-if="removed('root').length" class="panel" aria-labelledby="removed-sections">
    <div class="section-head">
      <h2 id="removed-sections" tabindex="-1">Removed sections</h2>
    </div>
    <p v-for="gone in removed('root')" :key="gone.id" class="removed-note">
      <ChangeMark reason="removed" /><span>Section: {{ gone.title }}</span>
    </p>
  </section>
</template>
