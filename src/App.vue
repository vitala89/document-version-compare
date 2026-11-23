<script setup lang="ts">
import { computed, ref } from 'vue'
import ChangeSummary from '@/components/ChangeSummary.vue'
import ChangesView from '@/components/ChangesView.vue'
import ContentsNav from '@/components/ContentsNav.vue'
import FullDocumentView from '@/components/FullDocumentView.vue'
import VersionPicker from '@/components/VersionPicker.vue'
import { useComparison, versions } from '@/composables/useComparison'
import { contentsTree } from '@/view-models/contents'

type Mode = 'changes' | 'full'

// Default pair: the two newest versions, the most common case.
const [previous, latest] = versions.slice(-2)
if (!previous || !latest) throw new Error('At least two versions are needed to compare')
const target = ref(latest.version)
const base = ref(previous.version)
const mode = ref<Mode>('changes')
const result = useComparison(base, target)
const contents = computed(() => contentsTree(result.value, mode.value))
const documentLabel = computed(() =>
  mode.value === 'changes' ? 'Document changes' : `Full document, v${result.value.target.version}`,
)
</script>

<template>
  <a href="#document" class="skip">Skip to document</a>
  <header class="masthead">
    <div class="wrap">
      <span class="app-name"><span class="app-mark" aria-hidden="true" />Document Compare</span>
      <fieldset class="mode">
        <legend class="sr-only">Document view</legend>
        <label
          ><input v-model="mode" type="radio" name="mode" value="changes" /><span
            >Changes only</span
          ></label
        >
        <label
          ><input v-model="mode" type="radio" name="mode" value="full" /><span
            >Full document</span
          ></label
        >
      </fieldset>
    </div>
  </header>
  <main class="wrap">
    <div class="page-top">
      <h1>{{ result.target.title }}</h1>
      <VersionPicker v-model:base="base" v-model:target="target" :versions="versions" />
    </div>
    <ChangeSummary :result="result" />
    <div class="layout">
      <!-- New key per comparison resets the chosen link. -->
      <ContentsNav :key="`${base}-${target}-${mode}`" :items="contents" />
      <article id="document" class="document" tabindex="-1" :aria-label="documentLabel">
        <ChangesView v-if="mode === 'changes'" :result="result" />
        <FullDocumentView v-else :result="result" />
      </article>
    </div>
  </main>
</template>
