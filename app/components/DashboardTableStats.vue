<script setup lang="ts">
const props = defineProps<{
  total: number
  filtered: number
  rendered?: number
}>()
</script>

<template>
  <div class="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted">
    <UBadge
      :label="`${props.total} loaded`"
      color="neutral"
      variant="subtle"
    />
    <UBadge
      :label="`${props.filtered} visible`"
      color="neutral"
      variant="subtle"
    />
    <UBadge
      v-if="props.rendered !== undefined"
      :label="`${props.rendered} table rows`"
      color="neutral"
      variant="subtle"
    />
  </div>
</template>
