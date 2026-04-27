<script setup lang="ts">
const props = withDefaults(defineProps<{
  open: boolean
  title: string
  description?: string
  clearDisabled?: boolean
}>(), {
  description: '',
  clearDisabled: false
})

const emit = defineEmits<{
  (e: 'update:open', open: boolean): void
  (e: 'clear' | 'done'): void
}>()

function close() {
  emit('update:open', false)
}

function done() {
  emit('done')
  close()
}
</script>

<template>
  <USlideover
    :open="props.open"
    @update:open="emit('update:open', $event)"
  >
    <template #content>
      <div class="flex h-full flex-col bg-default">
        <div class="border-b border-default px-4 py-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-sm font-semibold text-highlighted">
                {{ props.title }}
              </p>
              <p
                v-if="props.description"
                class="mt-1 text-sm text-muted"
              >
                {{ props.description }}
              </p>
            </div>
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              square
              aria-label="Close filters"
              @click="close"
            />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto px-4 py-4">
          <slot />
        </div>

        <div class="border-t border-default px-4 py-4">
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <UButton
              label="Clear filters"
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              :disabled="props.clearDisabled"
              @click="emit('clear')"
            />
            <UButton
              label="Done"
              icon="i-lucide-check"
              color="primary"
              @click="done"
            />
          </div>
        </div>
      </div>
    </template>
  </USlideover>
</template>
