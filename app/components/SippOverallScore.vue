<script setup lang="ts">
defineProps<{
  score: number
}>()
</script>

<template>
  <span class="font-semibold text-primary">{{ score }}</span>
  <span class="text-xs text-muted">/50</span>
</template>
