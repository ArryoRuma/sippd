<script setup lang="ts">
defineProps<{
  collapsed?: boolean
}>()
</script>

<template>
  <NuxtLink
    to="/dashboard"
    class="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accented transition-colors"
    :class="collapsed ? 'justify-center' : ''"
  >
    <UIcon name="i-lucide-coffee" class="size-5 text-primary shrink-0" />
    <span v-if="!collapsed" class="font-bold text-sm text-highlighted truncate">Sippd</span>
  </NuxtLink>
</template>
