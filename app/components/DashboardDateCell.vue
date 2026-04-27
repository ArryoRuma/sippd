<script setup lang="ts">
defineProps<{
  date: string
}>()

function formatDashboardDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
</script>

<template>
  <span class="text-sm text-muted">{{ formatDashboardDate(date) }}</span>
</template>
