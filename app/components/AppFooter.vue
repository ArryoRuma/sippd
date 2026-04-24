<template>
  <UFooter
    :ui="{
      container: 'relative overflow-hidden border-t border-default/70 lg:py-8'
    }"
  >
    <div class="vibe-orb bottom-[-5rem] left-0 size-52 opacity-55" style="background: radial-gradient(circle, color-mix(in oklch, var(--ui-primary) 18%, transparent) 0%, transparent 70%);" />
    <template #left>
      <p class="text-sm text-dimmed">
        © {{ new Date().getFullYear() }} TruMedia Creative
      </p>
    </template>
  </UFooter>
</template>
