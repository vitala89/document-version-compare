<script setup lang="ts">
import { computed } from 'vue'
import { wordSegments } from '@/view-models/changes'

const props = defineProps<{ before: string; after: string }>()
const segments = computed(() => wordSegments(props.before, props.after))
// Keep surrounding spaces outside the highlight, so only words are marked.
const split = (text: string) => {
  const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(text)!
  return { lead: m[1], word: m[2], trail: m[3] }
}
</script>

<template>
  <dl class="text-diff">
    <div class="prior-copy">
      <dt><span class="quiet-label">Before</span></dt>
      <dd>
        <template v-for="(s, i) in segments.before" :key="i"
          ><template v-if="s.changed"
            >{{ split(s.text).lead }}<del>{{ split(s.text).word }}</del
            >{{ split(s.text).trail }}</template
          ><template v-else>{{ s.text }}</template></template
        >
      </dd>
    </div>
    <div class="current-copy">
      <dt><span class="quiet-label">After</span></dt>
      <dd>
        <template v-for="(s, i) in segments.after" :key="i"
          ><template v-if="s.changed"
            >{{ split(s.text).lead }}<ins>{{ split(s.text).word }}</ins
            >{{ split(s.text).trail }}</template
          ><template v-else>{{ s.text }}</template></template
        >
      </dd>
    </div>
  </dl>
</template>
