<script setup lang="ts">
const { curtainPhase } = useCurtain()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="curtainPhase !== 'idle'"
      :class="[
        'fixed inset-0 z-[100] pointer-events-none bg-cinnamon-wood-900',
        curtainPhase === 'covering' ? 'curtain-covering' : 'curtain-exiting'
      ]"
      aria-hidden="true"
    />
  </Teleport>
</template>
