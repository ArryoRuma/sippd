<script setup lang="ts">
const props = defineProps<{
  icon: string
  message: string
  actionLabel?: string
}>()

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="py-12 text-center">
    <UIcon
      :name="props.icon"
      class="size-10 text-muted mb-3"
    />
    <p
      class="text-sm text-muted"
      :class="props.actionLabel ? 'mb-4' : ''"
    >
      {{ props.message }}
    </p>
    <UButton
      v-if="props.actionLabel"
      :label="props.actionLabel"
      color="neutral"
      variant="outline"
      @click="emit('action')"
    />
  </div>
</template>
