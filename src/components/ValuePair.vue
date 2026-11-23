<script setup lang="ts">
defineProps<{ before?: string; after?: string }>()
</script>

<template>
  <!-- A missing value shows a plain hyphen and is read as "none". -->
  <div class="values">
    <span class="old-value"
      ><template v-if="before"><span class="sr-only">Before: </span>{{ before }}</template
      ><template v-else
        ><span class="sr-only">Before: none</span><span aria-hidden="true">-</span></template
      ></span
    >
    <span class="arrow" aria-hidden="true">→</span>
    <span class="after"
      ><template v-if="after"><span class="sr-only">After: </span>{{ after }}</template
      ><template v-else
        ><span class="sr-only">After: none</span><span aria-hidden="true">-</span></template
      ></span
    >
  </div>
</template>
