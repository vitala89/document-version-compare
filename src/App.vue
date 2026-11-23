<script setup lang="ts">
import { ref } from 'vue'
import VersionPicker from '@/components/VersionPicker.vue'
import { useComparison, versions } from '@/composables/useComparison'

type Mode = 'changes' | 'full'

// Default pair: the two newest versions, the most common case.
const [previous, latest] = versions.slice(-2)
if (!previous || !latest) throw new Error('At least two versions are needed to compare')
const target = ref(latest.version)
const base = ref(previous.version)
const mode = ref<Mode>('changes')
const result = useComparison(base, target)
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
  </main>
</template>
