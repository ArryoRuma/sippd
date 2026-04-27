<script setup lang="ts">
const props = withDefaults(defineProps<{
  currentPage: number
  itemsPerPage: number
  total: number
  rowLabel?: string
  justify?: 'between' | 'end'
}>(), {
  rowLabel: 'row(s)',
  justify: 'between'
})

const emit = defineEmits<{
  'update:page': [page: number]
}>()
</script>

<template>
  <div
    class="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"
    :class="props.justify === 'end' ? 'sm:justify-end' : 'sm:justify-between'"
  >
    <p
      v-if="props.justify !== 'end'"
      class="text-sm text-muted"
    >
      {{ props.total }} {{ props.rowLabel }}
    </p>

    <UPagination
      :page="props.currentPage"
      :items-per-page="props.itemsPerPage"
      :total="props.total"
      @update:page="emit('update:page', $event)"
    />
  </div>
</template>
