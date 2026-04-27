<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'hero' | 'section'
}>(), {
  variant: 'hero'
})
</script>

<template>
  <div
    aria-hidden="true"
    class="pointer-events-none absolute inset-0 overflow-hidden"
  >
    <template v-if="variant === 'hero'">
      <div
        class="vibe-orb opacity-50"
        style="width:55vw;height:55vw;max-width:720px;max-height:720px;left:-12%;top:-8%;background:radial-gradient(circle,var(--color-almond-cream-200) 0%,transparent 68%);animation-delay:0s;"
      />
      <div
        class="vibe-orb opacity-35"
        style="width:45vw;height:45vw;max-width:560px;max-height:560px;right:-8%;top:18%;background:radial-gradient(circle,var(--color-chestnut-200) 0%,transparent 68%);animation-delay:-5s;animation-direction:reverse;"
      />
      <div
        class="vibe-orb opacity-25"
        style="width:38vw;height:38vw;max-width:460px;max-height:460px;left:28%;bottom:-4%;background:radial-gradient(circle,color-mix(in oklch,var(--color-cinnamon-wood-200) 55%,white) 0%,transparent 68%);animation-delay:-8s;"
      />
    </template>
    <template v-else>
      <div
        class="vibe-orb opacity-45"
        style="width:38vw;height:38vw;max-width:380px;max-height:380px;left:-6%;top:8%;background:radial-gradient(circle,var(--color-almond-cream-300) 0%,transparent 68%);animation-delay:-3s;"
      />
      <div
        class="vibe-orb opacity-30"
        style="width:32vw;height:32vw;max-width:320px;max-height:320px;right:-4%;bottom:8%;background:radial-gradient(circle,var(--color-chestnut-200) 0%,transparent 68%);animation-delay:-9s;animation-direction:reverse;"
      />
    </template>
  </div>
</template>
