<script setup lang="ts">
defineProps<{
  method: string
}>()
</script>

<template>
  <UBadge
    :label="method"
    variant="subtle"
  />
</template>
