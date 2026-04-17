<script setup lang="ts">
definePageMeta({ layout: false })

const user = useSupabaseUser()

watch(user, () => {
  if (user.value) {
    return navigateTo('/dashboard')
  }
}, { immediate: true })
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <p class="text-muted">
      Signing in...
    </p>
  </div>
</template>
