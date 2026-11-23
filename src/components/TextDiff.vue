<script setup lang="ts">
import { computed } from 'vue'
import { wordSegments } from '@/view-models/changes'

const props = defineProps<{ before: string; after: string }>()
// Segments carry lead, word and trail, so surrounding spaces stay outside the highlight.
const segments = computed(() => wordSegments(props.before, props.after))
</script>

<template>
  <dl class="text-diff">
    <div class="prior-copy">
      <dt><span class="quiet-label">Before</span></dt>
      <dd>
        <template v-for="(s, i) in segments.before" :key="i"
          ><template v-if="s.changed"
            >{{ s.lead }}<del>{{ s.word }}</del
            >{{ s.trail }}</template
          ><template v-else>{{ s.text }}</template></template
        >
      </dd>
    </div>
    <div class="current-copy">
      <dt><span class="quiet-label">After</span></dt>
      <dd>
        <template v-for="(s, i) in segments.after" :key="i"
          ><template v-if="s.changed"
            >{{ s.lead }}<ins>{{ s.word }}</ins
            >{{ s.trail }}</template
          ><template v-else>{{ s.text }}</template></template
        >
      </dd>
    </div>
  </dl>
</template>
