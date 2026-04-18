<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'dashboard' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()
const UCheckbox = resolveComponent('UCheckbox')
const UButton = resolveComponent('UButton')
const loadError = ref<string | null>(null)

const slideoverOpen = ref(false)
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
const search = ref('')
const methodFilter = ref('All')
const roastFilter = ref('All')
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

function searchableText(value: string | null | undefined) {
  return value?.toLowerCase() ?? ''
}

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
  const values = new Set(
    (sipps.value ?? [])
      .map(sipp => sipp.method)
      .filter((value): value is string => Boolean(value))
  )

  return ['All', ...Array.from(values).sort((a, b) => a.localeCompare(b))]
})

const roastOptions = computed(() => {
  const values = new Set(
    (sipps.value ?? [])
      .map(sipp => sipp.roast_type)
      .filter((value): value is string => Boolean(value))
  )

  return ['All', ...Array.from(values).sort((a, b) => a.localeCompare(b))]
})

const filteredSipps = computed(() => {
  const q = search.value.trim().toLowerCase()

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

    return matchesSearch && matchesMethod && matchesRoast
  })
})

const totalSipps = computed(() => sipps.value?.length ?? 0)
const filteredCount = computed(() => filteredSipps.value.length)
const renderedRowCount = computed<number>(() => filteredCount.value)
const selectedRowCount = computed(() => table.value?.tableApi?.getFilteredSelectedRowModel()?.rows.length ?? 0)
const visibleTableRowCount = computed(() => table.value?.tableApi?.getFilteredRowModel()?.rows.length ?? filteredCount.value)
const currentPage = computed(() => (table.value?.tableApi?.getState()?.pagination?.pageIndex ?? pagination.value.pageIndex) + 1)
const itemsPerPage = computed(() => table.value?.tableApi?.getState()?.pagination?.pageSize ?? pagination.value.pageSize)

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
    header: ({ column }) => h(UButton, {
      color: 'neutral',
      variant: 'ghost',
      label: 'Roaster',
      icon: column.getIsSorted() === 'asc' ? 'i-lucide-arrow-up' : column.getIsSorted() === 'desc' ? 'i-lucide-arrow-down' : 'i-lucide-arrow-up-down',
      class: '-ml-3',
      onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
    })
  },
  {
    accessorKey: 'roast_type',
    header: ({ column }) => h(UButton, {
      color: 'neutral',
      variant: 'ghost',
      label: 'Roast',
      icon: column.getIsSorted() === 'asc' ? 'i-lucide-arrow-up' : column.getIsSorted() === 'desc' ? 'i-lucide-arrow-down' : 'i-lucide-arrow-up-down',
      class: '-ml-3',
      onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
    })
  },
  {
    accessorKey: 'origin',
    header: ({ column }) => h(UButton, {
      color: 'neutral',
      variant: 'ghost',
      label: 'Origin',
      icon: column.getIsSorted() === 'asc' ? 'i-lucide-arrow-up' : column.getIsSorted() === 'desc' ? 'i-lucide-arrow-down' : 'i-lucide-arrow-up-down',
      class: '-ml-3',
      onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
    })
  },
  {
    accessorKey: 'method',
    header: ({ column }) => h(UButton, {
      color: 'neutral',
      variant: 'ghost',
      label: 'Method',
      icon: column.getIsSorted() === 'asc' ? 'i-lucide-arrow-up' : column.getIsSorted() === 'desc' ? 'i-lucide-arrow-down' : 'i-lucide-arrow-up-down',
      class: '-ml-3',
      onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
    })
  },
  {
    accessorKey: 'aroma',
    header: ({ column }) => h(UButton, {
      color: 'neutral',
      variant: 'ghost',
      label: 'Aroma',
      icon: column.getIsSorted() === 'asc' ? 'i-lucide-arrow-up' : column.getIsSorted() === 'desc' ? 'i-lucide-arrow-down' : 'i-lucide-arrow-up-down',
      class: '-ml-3',
      onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
    })
  },
  {
    accessorKey: 'flavor',
    header: ({ column }) => h(UButton, {
      color: 'neutral',
      variant: 'ghost',
      label: 'Flavor',
      icon: column.getIsSorted() === 'asc' ? 'i-lucide-arrow-up' : column.getIsSorted() === 'desc' ? 'i-lucide-arrow-down' : 'i-lucide-arrow-up-down',
      class: '-ml-3',
      onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
    })
  },
  {
    accessorKey: 'acidity',
    header: ({ column }) => h(UButton, {
      color: 'neutral',
      variant: 'ghost',
      label: 'Acidity',
      icon: column.getIsSorted() === 'asc' ? 'i-lucide-arrow-up' : column.getIsSorted() === 'desc' ? 'i-lucide-arrow-down' : 'i-lucide-arrow-up-down',
      class: '-ml-3',
      onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
    })
  },
  {
    accessorKey: 'body',
    header: ({ column }) => h(UButton, {
      color: 'neutral',
      variant: 'ghost',
      label: 'Body',
      icon: column.getIsSorted() === 'asc' ? 'i-lucide-arrow-up' : column.getIsSorted() === 'desc' ? 'i-lucide-arrow-down' : 'i-lucide-arrow-up-down',
      class: '-ml-3',
      onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
    })
  },
  {
    accessorKey: 'aftertaste',
    header: ({ column }) => h(UButton, {
      color: 'neutral',
      variant: 'ghost',
      label: 'Aftertaste',
      icon: column.getIsSorted() === 'asc' ? 'i-lucide-arrow-up' : column.getIsSorted() === 'desc' ? 'i-lucide-arrow-down' : 'i-lucide-arrow-up-down',
      class: '-ml-3',
      onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
    })
  },
  {
    accessorKey: 'overall',
    header: ({ column }) => h(UButton, {
      color: 'neutral',
      variant: 'ghost',
      label: 'Overall',
      icon: column.getIsSorted() === 'asc' ? 'i-lucide-arrow-up' : column.getIsSorted() === 'desc' ? 'i-lucide-arrow-down' : 'i-lucide-arrow-up-down',
      class: '-ml-3',
      onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
    })
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => h(UButton, {
      color: 'neutral',
      variant: 'ghost',
      label: 'Logged',
      icon: column.getIsSorted() === 'asc' ? 'i-lucide-arrow-up' : column.getIsSorted() === 'desc' ? 'i-lucide-arrow-down' : 'i-lucide-arrow-up-down',
      class: '-ml-3',
      onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
    })
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
  const { error } = await supabase.from('sipps').delete().eq('id', id)
  if (error) {
    toast.add({ title: 'Error deleting sipp', description: error.message, color: 'error' })
  } else {
    toast.add({ title: 'Sipp deleted', color: 'success' })
    refresh()
  }
}

async function deleteSelected() {
  const selectedRows = table.value?.tableApi?.getFilteredSelectedRowModel().rows ?? []
  const selectedIds = selectedRows.map((row: { original: Sipp }) => row.original.id)

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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
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
            <div class="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
              <UInput
                v-model="search"
                icon="i-lucide-search"
                placeholder="Search roaster, origin, roast, method"
                class="w-full sm:w-80"
              />
              <USelect
                v-model="methodFilter"
                :items="methodOptions"
                class="w-full sm:w-48"
              />
              <USelect
                v-model="roastFilter"
                :items="roastOptions"
                class="w-full sm:w-48"
              />
            </div>
          </template>

          <template #right>
            <div class="flex items-center gap-2">
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
            </div>
          </template>
        </UDashboardToolbar>
      </template>

      <template #body>
        <div class="px-4 lg:px-6 py-4">
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
                @click="refresh"
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

          <UTable
            ref="table"
            v-model:row-selection="rowSelection"
            v-model:pagination="pagination"
            v-model:column-visibility="columnVisibility"
            :data="filteredSipps"
            :columns="columns"
            :loading="status === 'pending' || status === 'idle'"
            class="flex-1"
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
              <span class="text-sm text-muted">{{ formatDate(row.original.created_at) }}</span>
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
                  @click="totalSipps === 0 ? openNew() : (search = '', methodFilter = 'All', roastFilter = 'All')"
                />
              </div>
            </template>
          </UTable>

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
  </div>
</template>
