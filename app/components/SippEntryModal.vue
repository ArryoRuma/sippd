<script setup lang="ts">
import type { Database } from '~/types/database.types'

type Sipp = Database['public']['Tables']['sipps']['Row']

const props = withDefaults(defineProps<{
  open: boolean
  sipp?: Sipp
  readonly?: boolean
}>(), {
  sipp: undefined,
  readonly: false
})

const emit = defineEmits<{
  (e: 'update:open', open: boolean): void
  (e: 'saved'): void
}>()

function close() {
  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="props.open"
    :ui="{ content: 'sm:max-w-2xl' }"
    @update:open="emit('update:open', $event)"
  >
    <template #content>
      <div class="max-h-[85vh] overflow-y-auto">
        <SippSlideover
          :sipp="props.sipp"
          :readonly="props.readonly"
          @close="close"
          @saved="emit('saved')"
        />
      </div>
    </template>
  </UModal>
</template>
