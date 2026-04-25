<script setup lang="ts">
const emit = defineEmits<{ done: [] }>()

const exiting = ref(false)

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    sessionStorage.setItem('sippd-splash-seen', '1')
    emit('done')
    return
  }

  setTimeout(() => {
    exiting.value = true
    setTimeout(() => {
      sessionStorage.setItem('sippd-splash-seen', '1')
      emit('done')
    }, 700)
  }, 600)
})
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[200] pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <!-- Top panel -->
      <div
        class="absolute inset-x-0 top-0 h-1/2 bg-cinnamon-wood-900"
        :class="{ 'splash-top-exit': exiting }"
      />
      <!-- Bottom panel -->
      <div
        class="absolute inset-x-0 bottom-0 h-1/2 bg-cinnamon-wood-900"
        :class="{ 'splash-bottom-exit': exiting }"
      />
    </div>
  </Teleport>
</template>
