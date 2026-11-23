<script setup lang="ts">
import { computed } from 'vue'
import ClauseBody from '@/components/ClauseBody.vue'
import TextDiff from '@/components/TextDiff.vue'
import ValuePair from '@/components/ValuePair.vue'
import type { ClauseNode, DiffEntry, SectionNode } from '@/domain/types'
import { lineLabel, reasonLabel, sectionHeading } from '@/view-models/format'

const props = defineProps<{ entry: DiffEntry; level: 3 | 4 }>()

const heading = computed(() => `h${props.level}`)
const subHeading = computed(() => `h${props.level + 1}`)
const isSection = computed(() => props.entry.scope === 'section')
const title = computed(() => {
  if (isSection.value && props.entry.reason === 'renamed') return sectionHeading.renamed
  if (isSection.value && props.entry.kind === 'added') return sectionHeading.added
  return props.entry.title
})
const clause = computed(() => (props.entry.node?.type === 'clause' ? props.entry.node : undefined))
// Whole sections that were added or removed show their clauses inline.
const sectionClauses = computed(() =>
  isSection.value && (props.entry.kind === 'added' || props.entry.kind === 'removed')
    ? (props.entry.node as SectionNode).children.filter((c): c is ClauseNode => c.type === 'clause')
    : [],
)
const showsWholeClause = computed(
  () => !isSection.value && (props.entry.reason === 'added' || props.entry.reason === 'removed'),
)
const isDraft = computed(() => clause.value?.status === 'draft' && props.entry.kind !== 'removed')
const nowEmpty = computed(
  () => props.entry.reason === 'field-removed' && clause.value?.children.length === 0,
)
// Each added or removed line says what it is in words, moved clauses included.
// Only field-removed skips it: its tag already says "Field removed".
const inChangedClause = computed(() => props.entry.reason !== 'field-removed')
</script>

<template>
  <div class="change" :class="entry.kind">
    <div class="change-title">
      <component :is="heading">{{ title }}</component>
      <span class="tag">{{ reasonLabel[entry.reason] }}</span>
      <span v-if="isDraft" class="tag draft">Draft</span>
    </div>

    <p v-if="entry.movedFrom" class="detail">
      Moved from <strong>{{ entry.movedFrom }}</strong
      >.
    </p>

    <ClauseBody v-if="showsWholeClause && clause" :clause="clause" />

    <div v-for="clauseNode in sectionClauses" :key="clauseNode.id" class="inline-clause">
      <div class="entry-status">
        <component :is="subHeading">{{ clauseNode.title }}</component>
        <span v-if="clauseNode.status === 'draft'" class="tag draft">Draft</span>
      </div>
      <ClauseBody :clause="clauseNode" />
    </div>

    <template v-for="(detail, i) in entry.details" :key="i">
      <ValuePair
        v-if="detail.type === 'title' && isSection"
        :before="detail.before"
        :after="detail.after"
      />
      <template v-else-if="detail.type === 'title'">
        <p class="detail">Clause title</p>
        <ValuePair :before="detail.before" :after="detail.after" />
      </template>
      <template v-else-if="detail.type === 'field-label'">
        <p class="detail">Field name</p>
        <ValuePair :before="detail.before" :after="detail.after" />
      </template>
      <dl v-else-if="detail.type === 'field-value' || detail.type === 'status'" class="field-diff">
        <dt>
          <span class="quiet-label">{{ detail.type === 'status' ? 'Status' : detail.label }}</span>
        </dt>
        <dd><ValuePair :before="detail.before" :after="detail.after" /></dd>
      </dl>
      <TextDiff v-else-if="detail.type === 'text'" :before="detail.before" :after="detail.after" />
      <div
        v-else-if="detail.type === 'field-added' || detail.type === 'field-removed'"
        class="value-line"
      >
        <span v-if="inChangedClause" class="quiet-label">{{ lineLabel[detail.type] }}</span>
        <span class="context">{{ detail.label }}</span>
        <span :class="detail.type === 'field-removed' ? 'old-value' : 'after'">{{
          detail.value
        }}</span>
      </div>
      <div
        v-else-if="detail.type === 'text-added' || detail.type === 'text-removed'"
        class="value-line"
      >
        <span v-if="inChangedClause" class="quiet-label">{{ lineLabel[detail.type] }}</span>
        <span :class="detail.type === 'text-removed' ? 'old-value' : 'after'">{{
          detail.text
        }}</span>
      </div>
    </template>

    <p v-if="nowEmpty" class="detail">This clause is now empty.</p>
  </div>
</template>
