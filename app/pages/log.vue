<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { useConfirmAction } from '~/composables/useConfirmAction'
import { useDashboardTable, useDashboardTableMetrics } from '~/composables/useDashboardTable'
import type { TableColumn } from '@nuxt/ui'
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'dashboard' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()
const toast = useToast()
const UCheckbox = resolveComponent('UCheckbox')
const UButton = resolveComponent('UButton')
const loadError = ref<string | null>(null)
const { createSelectOptions, createSortHeader, formatDashboardDate, searchableText } = useDashboardTable()
const confirmDeleteState = useConfirmAction()

const slideoverOpen = ref(false)
const mobileFiltersOpen = ref(false)
const selectedSipp = ref<Database['public']['Tables']['sipps']['Row']>()
const viewMode = ref(false)

type TableRow<T> = { original: T }
type TableApi<T> = {
  getFilteredSelectedRowModel: () => { rows: Array<TableRow<T>> }
  getFilteredRowModel: () => { rows: Array<TableRow<T>> }
  getState: () => {
    pagination?: {
      pageIndex?: number
      pageSize?: number
    }
  }
  setPageIndex: (pageIndex: number) => void
}
type TableRef<T> = { tableApi?: TableApi<T> }

const table = ref<TableRef<Database['public']['Tables']['sipps']['Row']> | null>(null)
const rowSelection = ref<Record<string, boolean>>({})
const search = ref(typeof route.query.search === 'string' ? route.query.search : '')
const methodFilter = ref(typeof route.query.method === 'string' ? route.query.method : 'All')
const roastFilter = ref(typeof route.query.roast === 'string' ? route.query.roast : 'All')
const originFilter = ref(typeof route.query.origin === 'string' ? route.query.origin : 'All')
const fromDate = ref(typeof route.query.from === 'string' ? route.query.from : '')
const toDate = ref(typeof route.query.to === 'string' ? route.query.to : '')
const minOverall = ref(typeof route.query.minOverall === 'string' ? route.query.minOverall : '')
const maxOverall = ref(typeof route.query.maxOverall === 'string' ? route.query.maxOverall : '')
const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

const columnVisibility = ref<Record<string, boolean>>({
  aroma: true,
  flavor: true,
  acidity: false,
  body: false,
  aftertaste: false
})

const isMobile = ref(false)

onMounted(() => {
  const mq = window.matchMedia('(max-width: 639px)')
  isMobile.value = mq.matches
  const handler = (e: MediaQueryListEvent) => {
    isMobile.value = e.matches
  }
  mq.addEventListener('change', handler)
  onBeforeUnmount(() => mq.removeEventListener('change', handler))
})

type Sipp = Database['public']['Tables']['sipps']['Row']
const { data: sipps, status, refresh } = await useAsyncData('sipps', async () => {
  loadError.value = null

  const { data, error } = await supabase
    .from('sipps')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    loadError.value = error.message
    toast.add({ title: 'Error loading sipps', description: error.message, color: 'error' })
    return []
  }

  return data ?? []
})

const methodOptions = computed(() => {
  return createSelectOptions(sipps.value, sipp => sipp.method)
})

const roastOptions = computed(() => {
  return createSelectOptions(sipps.value, sipp => sipp.roast_type)
})

const originOptions = computed(() => {
  return createSelectOptions(sipps.value, sipp => sipp.origin)
})

const hasActiveFilters = computed(() => {
  return search.value.trim().length > 0
    || methodFilter.value !== 'All'
    || roastFilter.value !== 'All'
    || originFilter.value !== 'All'
    || Boolean(fromDate.value)
    || Boolean(toDate.value)
    || Boolean(minOverall.value)
    || Boolean(maxOverall.value)
})

const activeFilterCount = computed(() => {
  return [
    search.value.trim().length > 0,
    methodFilter.value !== 'All',
    roastFilter.value !== 'All',
    originFilter.value !== 'All',
    Boolean(fromDate.value),
    Boolean(toDate.value),
    Boolean(minOverall.value),
    Boolean(maxOverall.value)
  ].filter(Boolean).length
})

const quickFilterChips = [
  { id: 'last-7-days', label: 'Last 7 Days' },
  { id: 'high-score', label: 'Score 40+' },
  { id: 'espresso-focus', label: 'Espresso Focus' }
] as const

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

function applyQuickFilter(chipId: (typeof quickFilterChips)[number]['id']) {
  if (chipId === 'last-7-days') {
    const now = new Date()
    const start = new Date(now)
    start.setDate(now.getDate() - 6)

    fromDate.value = toDateInputValue(start)
    toDate.value = toDateInputValue(now)
    return
  }

  if (chipId === 'high-score') {
    minOverall.value = '40'
    maxOverall.value = ''
    return
  }

  methodFilter.value = 'Espresso'
}

const filteredSipps = computed(() => {
  const q = search.value.trim().toLowerCase()
  const from = fromDate.value ? new Date(fromDate.value) : null
  const to = toDate.value ? new Date(toDate.value) : null
  const minScore = minOverall.value ? Number(minOverall.value) : null
  const maxScore = maxOverall.value ? Number(maxOverall.value) : null

  if (from) {
    from.setHours(0, 0, 0, 0)
  }

  if (to) {
    to.setHours(23, 59, 59, 999)
  }

  return (sipps.value ?? []).filter((sipp) => {
    const matchesSearch = q.length === 0
      || [
        sipp.roaster,
        sipp.roast_type,
        sipp.origin,
        sipp.method
      ].some(field => searchableText(field).includes(q))

    const matchesMethod = methodFilter.value === 'All' || (sipp.method ?? '') === methodFilter.value
    const matchesRoast = roastFilter.value === 'All' || (sipp.roast_type ?? '') === roastFilter.value
    const matchesOrigin = originFilter.value === 'All' || (sipp.origin ?? '') === originFilter.value
    const createdAt = new Date(sipp.created_at)
    const matchesFrom = !from || createdAt >= from
    const matchesTo = !to || createdAt <= to
    const matchesMinScore = minScore === null || sipp.overall >= minScore
    const matchesMaxScore = maxScore === null || sipp.overall <= maxScore

    return matchesSearch && matchesMethod && matchesRoast && matchesOrigin && matchesFrom && matchesTo && matchesMinScore && matchesMaxScore
  })
})

const totalSipps = computed(() => sipps.value?.length ?? 0)
const filteredCount = computed(() => filteredSipps.value.length)
const renderedRowCount = computed<number>(() => filteredCount.value)
const { currentPage, itemsPerPage, selectedRowCount, visibleTableRowCount } = useDashboardTableMetrics({
  table,
  pagination,
  fallbackRowCount: filteredCount
})

const columns: TableColumn<Sipp>[] = [
  {
    id: 'select',
    header: ({ table }) => h(UCheckbox, {
      'modelValue': table.getIsSomePageRowsSelected() ? 'indeterminate' : table.getIsAllPageRowsSelected(),
      'onUpdate:modelValue': (value: boolean | 'indeterminate') => table.toggleAllPageRowsSelected(!!value),
      'aria-label': 'Select all rows'
    }),
    cell: ({ row }) => h(UCheckbox, {
      'modelValue': row.getIsSelected(),
      'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
      'aria-label': 'Select row'
    }),
    enableSorting: false
  },
  {
    accessorKey: 'roaster',
    header: createSortHeader(UButton, 'Roaster')
  },
  {
    accessorKey: 'roast_type',
    header: createSortHeader(UButton, 'Roast')
  },
  {
    accessorKey: 'origin',
    header: createSortHeader(UButton, 'Origin')
  },
  {
    accessorKey: 'method',
    header: createSortHeader(UButton, 'Method')
  },
  {
    accessorKey: 'aroma',
    header: createSortHeader(UButton, 'Aroma')
  },
  {
    accessorKey: 'flavor',
    header: createSortHeader(UButton, 'Flavor')
  },
  {
    accessorKey: 'acidity',
    header: createSortHeader(UButton, 'Acidity')
  },
  {
    accessorKey: 'body',
    header: createSortHeader(UButton, 'Body')
  },
  {
    accessorKey: 'aftertaste',
    header: createSortHeader(UButton, 'Aftertaste')
  },
  {
    accessorKey: 'overall',
    header: createSortHeader(UButton, 'Overall')
  },
  {
    accessorKey: 'created_at',
    header: createSortHeader(UButton, 'Logged')
  },
  {
    id: 'actions',
    enableSorting: false
  }
]

const columnToggleItems = computed(() => {
  const toggleableColumns = [
    { key: 'roaster', label: 'roaster' },
    { key: 'roast_type', label: 'roast type' },
    { key: 'origin', label: 'origin' },
    { key: 'method', label: 'method' },
    { key: 'aroma', label: 'aroma' },
    { key: 'flavor', label: 'flavor' },
    { key: 'acidity', label: 'acidity' },
    { key: 'body', label: 'body' },
    { key: 'aftertaste', label: 'aftertaste' },
    { key: 'overall', label: 'overall' },
    { key: 'created_at', label: 'logged' }
  ]

  return toggleableColumns.map(column => ({
    ...column,
    visible: columnVisibility.value[column.key] !== false
  }))
})

const effectiveColumnVisibility = computed(() => {
  if (!isMobile.value) return columnVisibility.value
  return {
    ...columnVisibility.value,
    select: false,
    roast_type: false,
    origin: false,
    aroma: false,
    flavor: false,
    acidity: false,
    body: false,
    aftertaste: false,
    created_at: false
  }
})

function openNew() {
  selectedSipp.value = undefined
  viewMode.value = false
  slideoverOpen.value = true
}

function openView(sipp: Sipp) {
  selectedSipp.value = sipp
  viewMode.value = true
  slideoverOpen.value = true
}

function openEdit(sipp: Sipp) {
  selectedSipp.value = sipp
  viewMode.value = false
  slideoverOpen.value = true
}

async function deleteSipp(id: string) {
  confirmDeleteState.requestConfirmation({
    title: 'Delete this sipp?',
    description: 'This entry will be permanently removed from your log.',
    action: async () => {
      await deleteSippNow(id)
    }
  })
}

async function deleteSippNow(id: string) {
  const { error } = await supabase.from('sipps').delete().eq('id', id)
  if (error) {
    toast.add({ title: 'Error deleting sipp', description: error.message, color: 'error' })
  } else {
    toast.add({ title: 'Sipp deleted', color: 'success' })
    await refresh()
  }
}

async function deleteSelected() {
  const selectedRows = table.value?.tableApi?.getFilteredSelectedRowModel().rows ?? []
  const selectedIds = selectedRows.map((row: { original: Sipp }) => row.original.id)

  if (!selectedIds.length) return

  confirmDeleteState.requestConfirmation({
    title: `Delete ${selectedIds.length} selected sipp(s)?`,
    description: 'This will permanently remove all selected entries.',
    action: async () => {
      await deleteSelectedNow(selectedIds)
    }
  })
}

async function deleteSelectedNow(selectedIds: string[]) {
  if (!selectedIds.length) return

  const { error } = await supabase.from('sipps').delete().in('id', selectedIds)

  if (error) {
    toast.add({ title: 'Error deleting selected sipps', description: error.message, color: 'error' })
  } else {
    toast.add({ title: `${selectedIds.length} sipps deleted`, color: 'success' })
    rowSelection.value = {}
    await refresh()
  }
}

function toggleColumn(columnKey: string, visible: boolean | 'indeterminate') {
  columnVisibility.value = {
    ...columnVisibility.value,
    [columnKey]: !!visible
  }
}

function exportCsv() {
  const rows = table.value?.tableApi?.getFilteredRowModel().rows.map((row: { original: Sipp }) => row.original) ?? []

  if (!rows.length) {
    toast.add({ title: 'Nothing to export', description: 'Adjust filters to include rows.', color: 'warning' })
    return
  }

  const headers = [
    'roaster',
    'roast_type',
    'origin',
    'method',
    'aroma',
    'flavor',
    'acidity',
    'body',
    'aftertaste',
    'overall',
    'created_at'
  ]

  const csv = [
    headers.join(','),
    ...rows.map((row: Sipp) => headers.map((header) => {
      const value = String(row[header as keyof Sipp] ?? '')
      return `"${value.replace(/"/g, '""')}"`
    }).join(','))
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `sipps-${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  toast.add({ title: `Exported ${rows.length} rows`, color: 'success' })
}

function onSaved() {
  refresh()
}

function clearFilters() {
  search.value = ''
  methodFilter.value = 'All'
  roastFilter.value = 'All'
  originFilter.value = 'All'
  fromDate.value = ''
  toDate.value = ''
  minOverall.value = ''
  maxOverall.value = ''
}

function updateDeleteConfirmOpen(value: boolean) {
  confirmDeleteState.isOpen.value = value
}
</script>

<template>
  <div>
    <UDashboardPanel id="sipp-log">
      <template #header>
        <UDashboardNavbar title="SippLog">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>

          <template #right>
            <UButton
              label="New Sipp"
              icon="i-lucide-plus"
              color="primary"
              @click="openNew"
            />
          </template>
        </UDashboardNavbar>

        <UDashboardToolbar>
          <template #left>
            <div class="flex w-full flex-col gap-2">
              <div class="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                <UInput
                  v-model="search"
                  icon="i-lucide-search"
                  placeholder="Search sipps"
                  class="w-full sm:w-80"
                />

                <div class="flex items-center gap-2 lg:hidden">
                  <UButton
                    :label="activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'"
                    icon="i-lucide-sliders-horizontal"
                    color="neutral"
                    variant="outline"
                    class="flex-1"
                    @click="mobileFiltersOpen = true"
                  />
                  <UButton
                    icon="i-lucide-download"
                    color="neutral"
                    variant="outline"
                    square
                    aria-label="Export CSV"
                    @click="exportCsv"
                  />
                </div>

                <div class="hidden lg:flex lg:flex-wrap lg:items-center lg:gap-2">
                  <USelect
                    v-model="methodFilter"
                    :items="methodOptions"
                    class="w-full lg:w-48"
                  />
                  <USelect
                    v-model="roastFilter"
                    :items="roastOptions"
                    class="w-full lg:w-48"
                  />
                  <USelect
                    v-model="originFilter"
                    :items="originOptions"
                    class="w-full lg:w-48"
                  />
                  <UInput
                    v-model="fromDate"
                    type="date"
                    class="w-full lg:w-44"
                  />
                  <UInput
                    v-model="toDate"
                    type="date"
                    class="w-full lg:w-44"
                  />
                  <UInput
                    v-model="minOverall"
                    type="number"
                    :min="1"
                    :max="50"
                    placeholder="Min score"
                    class="w-full lg:w-32"
                  />
                  <UInput
                    v-model="maxOverall"
                    type="number"
                    :min="1"
                    :max="50"
                    placeholder="Max score"
                    class="w-full lg:w-32"
                  />
                </div>
              </div>
            </div>
          </template>

          <template #right>
            <div class="hidden items-center gap-2 lg:flex">
              <UPopover>
                <UButton
                  label="Columns"
                  icon="i-lucide-columns-3"
                  color="neutral"
                  variant="outline"
                />

                <template #content>
                  <div class="p-3 space-y-2 w-56">
                    <p class="text-xs uppercase tracking-wide text-muted">
                      Show columns
                    </p>
                    <div
                      v-for="column in columnToggleItems"
                      :key="column.key"
                      class="flex items-center justify-between gap-2"
                    >
                      <span class="text-sm capitalize text-default">{{ column.label }}</span>
                      <UCheckbox
                        :model-value="column.visible"
                        @update:model-value="toggleColumn(column.key, $event)"
                      />
                    </div>
                  </div>
                </template>
              </UPopover>

              <UButton
                label="Export CSV"
                icon="i-lucide-download"
                color="neutral"
                variant="outline"
                @click="exportCsv"
              />
              <UButton
                label="Clear filters"
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                :disabled="!hasActiveFilters"
                @click="clearFilters"
              />
            </div>
          </template>
        </UDashboardToolbar>
      </template>

      <template #body>
        <div class="p-4 lg:p-6">
          <div class="mb-4 flex flex-wrap items-center gap-2">
            <UButton
              v-for="chip in quickFilterChips"
              :key="chip.id"
              :label="chip.label"
              size="xs"
              color="neutral"
              variant="soft"
              @click="applyQuickFilter(chip.id)"
            />
          </div>

          <div class="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted">
            <UBadge
              :label="`${totalSipps} loaded`"
              color="neutral"
              variant="subtle"
            />
            <UBadge
              :label="`${filteredCount} visible`"
              color="neutral"
              variant="subtle"
            />
            <UBadge
              :label="`${renderedRowCount} table rows`"
              color="neutral"
              variant="subtle"
            />
          </div>

          <UAlert
            v-if="!user"
            color="warning"
            variant="soft"
            icon="i-lucide-lock"
            title="Sign in required"
            description="Log in to view your SippLog entries."
            class="mb-4"
          >
            <template #actions>
              <UButton
                label="Go to login"
                color="neutral"
                variant="outline"
                to="/login"
              />
            </template>
          </UAlert>

          <UAlert
            v-if="loadError"
            color="error"
            variant="soft"
            icon="i-lucide-triangle-alert"
            title="Could not load SippLog"
            :description="loadError"
            class="mb-4"
          >
            <template #actions>
              <UButton
                label="Retry"
                color="neutral"
                variant="outline"
                @click="() => refresh()"
              />
            </template>
          </UAlert>

          <UAlert
            v-if="selectedRowCount > 0"
            color="info"
            variant="soft"
            icon="i-lucide-check-square"
            :title="`${selectedRowCount} row(s) selected`"
            class="mb-4"
          >
            <template #actions>
              <UButton
                label="Delete selected"
                icon="i-lucide-trash-2"
                color="error"
                variant="soft"
                size="sm"
                @click="deleteSelected"
              />
            </template>
          </UAlert>

          <div class="overflow-x-auto">
            <UTable
              ref="table"
              v-model:row-selection="rowSelection"
              v-model:pagination="pagination"
              :column-visibility="effectiveColumnVisibility"
              :data="filteredSipps"
              :columns="columns"
              :loading="status === 'pending' || status === 'idle'"
              class="w-full"
            >
              <template #roaster-cell="{ row }">
                <button
                  type="button"
                  class="text-left font-semibold text-highlighted hover:text-primary transition-colors"
                  @click="openView(row.original)"
                >
                  {{ row.original.roaster }}
                </button>
              </template>

              <template #method-cell="{ row }">
                <UBadge
                  :label="row.original.method"
                  variant="subtle"
                />
              </template>

              <template #overall-cell="{ row }">
                <span class="font-semibold text-primary">{{ row.original.overall }}</span>
                <span class="text-xs text-muted">/50</span>
              </template>

              <template #created_at-cell="{ row }">
                <span class="text-sm text-muted">{{ formatDashboardDate(row.original.created_at) }}</span>
              </template>

              <template #actions-cell="{ row }">
                <UDropdownMenu
                  :items="[
                    [{
                      label: 'View details',
                      icon: 'i-lucide-eye',
                      onSelect: () => openView(row.original)
                    }, {
                      label: 'Edit',
                      icon: 'i-lucide-pencil',
                      onSelect: () => openEdit(row.original)
                    }],
                    [{
                      label: 'Delete',
                      icon: 'i-lucide-trash-2',
                      color: 'error',
                      onSelect: () => deleteSipp(row.original.id)
                    }]
                  ]"
                >
                  <UButton
                    icon="i-lucide-ellipsis"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                  />
                </UDropdownMenu>
              </template>

              <template #empty>
                <div class="py-12 text-center">
                  <UIcon
                    name="i-lucide-coffee"
                    class="size-10 text-muted mb-3"
                  />
                  <p class="text-sm text-muted mb-4">
                    {{ totalSipps === 0 ? 'No sipps were returned for this account yet.' : 'No sipps match your current filters.' }}
                  </p>
                  <UButton
                    :label="totalSipps === 0 ? 'Log a new sipp' : 'Clear filters'"
                    color="neutral"
                    variant="outline"
                    @click="totalSipps === 0 ? openNew() : clearFilters()"
                  />
                </div>
              </template>
            </UTable>
          </div>

          <div class="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-sm text-muted">
              {{ visibleTableRowCount }} row(s)
            </p>

            <UPagination
              :page="currentPage"
              :items-per-page="itemsPerPage"
              :total="visibleTableRowCount"
              @update:page="(page) => table?.tableApi?.setPageIndex(page - 1)"
            />
          </div>
        </div>
      </template>
    </UDashboardPanel>

    <USlideover v-model:open="mobileFiltersOpen">
      <template #content>
        <div class="flex h-full flex-col bg-default">
          <div class="border-b border-default px-4 py-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm font-semibold text-highlighted">
                  Filters and columns
                </p>
                <p class="mt-1 text-sm text-muted">
                  Refine your log without crowding the main table view.
                </p>
              </div>
              <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                square
                aria-label="Close filters"
                @click="mobileFiltersOpen = false"
              />
            </div>
          </div>

          <div class="flex-1 space-y-5 overflow-y-auto px-4 py-4">
            <div class="space-y-3">
              <p class="text-xs uppercase tracking-wide text-muted">
                Filters
              </p>
              <USelect
                v-model="methodFilter"
                :items="methodOptions"
                class="w-full"
              />
              <USelect
                v-model="roastFilter"
                :items="roastOptions"
                class="w-full"
              />
              <USelect
                v-model="originFilter"
                :items="originOptions"
                class="w-full"
              />
              <UInput
                v-model="fromDate"
                type="date"
                class="w-full"
              />
              <UInput
                v-model="toDate"
                type="date"
                class="w-full"
              />
              <div class="grid grid-cols-2 gap-3">
                <UInput
                  v-model="minOverall"
                  type="number"
                  :min="1"
                  :max="50"
                  placeholder="Min score"
                  class="w-full"
                />
                <UInput
                  v-model="maxOverall"
                  type="number"
                  :min="1"
                  :max="50"
                  placeholder="Max score"
                  class="w-full"
                />
              </div>
            </div>

            <div class="space-y-3">
              <p class="text-xs uppercase tracking-wide text-muted">
                Visible columns
              </p>
              <div
                v-for="column in columnToggleItems"
                :key="column.key"
                class="flex items-center justify-between gap-3 rounded-xl border border-default/70 bg-elevated/40 px-3 py-2.5"
              >
                <span class="text-sm capitalize text-default">{{ column.label }}</span>
                <UCheckbox
                  :model-value="column.visible"
                  @update:model-value="toggleColumn(column.key, $event)"
                />
              </div>
            </div>
          </div>

          <div class="border-t border-default px-4 py-4">
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <UButton
                label="Clear filters"
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                :disabled="!hasActiveFilters"
                @click="clearFilters"
              />
              <UButton
                label="Done"
                icon="i-lucide-check"
                color="primary"
                @click="mobileFiltersOpen = false"
              />
            </div>
          </div>
        </div>
      </template>
    </USlideover>

    <USlideover v-model:open="slideoverOpen">
      <template #content>
        <SippSlideover
          :sipp="selectedSipp"
          :readonly="viewMode"
          @close="slideoverOpen = false"
          @saved="onSaved"
        />
      </template>
    </USlideover>

    <ConfirmActionModal
      :open="confirmDeleteState.isOpen.value"
      :title="confirmDeleteState.title.value"
      :description="confirmDeleteState.description.value"
      :pending="confirmDeleteState.isPending.value"
      @update:open="updateDeleteConfirmOpen"
      @cancel="confirmDeleteState.cancelAction"
      @confirm="confirmDeleteState.confirmAction"
    />
  </div>
</template>
