<script setup lang="ts">
defineProps<{
  roaster: string
}>()

const emit = defineEmits<{
  open: []
}>()
</script>

<template>
  <button
    type="button"
    class="text-left font-semibold text-highlighted hover:text-primary transition-colors"
    @click="emit('open')"
  >
    {{ roaster }}
  </button>
</template>
