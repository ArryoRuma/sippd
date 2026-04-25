<script setup lang="ts">
defineProps<{
  collapsed?: boolean
}>()
</script>

<template>
  <NuxtLink
    to="/dashboard"
    class="group flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-all duration-300 hover:bg-warning/10"
    :class="collapsed ? 'justify-center' : ''"
  >
    <UIcon
      name="i-lucide-coffee"
      class="size-5 shrink-0 text-primary transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-6 group-hover:text-warning"
    />
    <span
      v-if="!collapsed"
      class="truncate text-sm font-bold text-highlighted"
    >Sippd</span>
  </NuxtLink>
</template>
