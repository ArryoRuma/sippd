<template>
  <UFooter
    :ui="{
      container: 'relative overflow-hidden border-t border-default/70 lg:py-8'
    }"
  >
    <template #left>
      <p class="text-sm text-dimmed">
        © {{ new Date().getFullYear() }} TruMedia Creative
      </p>
    </template>
  </UFooter>
</template>
