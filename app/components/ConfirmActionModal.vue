<script setup lang="ts">
const props = withDefaults(defineProps<{
  open: boolean
  title: string
  description: string
  pending?: boolean
  confirmLabel?: string
}>(), {
  pending: false,
  confirmLabel: 'Delete'
})

const emit = defineEmits<{
  'confirm': []
  'cancel': []
  'update:open': [value: boolean]
}>()

function onCancel() {
  emit('cancel')
}
</script>

<template>
  <UModal
    :open="props.open"
    @update:open="emit('update:open', $event)"
  >
    <template #content>
      <UCard>
        <template #header>
          <h3 class="text-base font-semibold text-highlighted">
            {{ props.title }}
          </h3>
        </template>

        <p class="text-sm text-muted">
          {{ props.description }}
        </p>

        <template #footer>
          <div class="flex items-center justify-end gap-2">
            <UButton
              label="Cancel"
              color="neutral"
              variant="ghost"
              :disabled="props.pending"
              @click="onCancel"
            />
            <UButton
              :label="props.confirmLabel"
              color="error"
              :loading="props.pending"
              @click="emit('confirm')"
            />
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
