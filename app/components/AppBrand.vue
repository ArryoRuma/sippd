<script setup lang="ts">
defineProps<{
  collapsed?: boolean
}>()
</script>

<template>
  <NuxtLink
    to="/dashboard"
    class="group flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-accented/80 transition-all duration-300"
    :class="collapsed ? 'justify-center' : ''"
  >
    <UIcon
      name="i-lucide-coffee"
      class="size-5 text-primary shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-6"
    />
    <span
      v-if="!collapsed"
      class="font-bold text-sm text-highlighted truncate"
    >Sippd</span>
  </NuxtLink>
</template>
