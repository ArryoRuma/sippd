<!-- wanna-sipp.vue
     Wishlist / to-try list. Users can add roasters they want to try,
     mark entries as completed, and delete them individually or in bulk.
     Completed entries are visually distinguished and sorted to the bottom
     via the default Supabase query ordering. -->
<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { useDashboardTable, useDashboardTableMetrics } from '~/composables/useDashboardTable'
import type { TableColumn } from '@nuxt/ui'
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'dashboard' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()
const UCheckbox = resolveComponent('UCheckbox')
const UButton = resolveComponent('UButton')
const { createSortHeader, formatDashboardDate } = useDashboardTable()
const confirmDeleteState = useConfirmAction()

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

const mobileColumnVisibility = computed((): Record<string, boolean> => {
  if (!isMobile.value) {
    return {}
  }

  return {
    select: false,
    origin: false,
    method: false,
    notes: false,
    created_at: false
  }
})

const newRoaster = ref('')
const newNotes = ref('')
const adding = ref(false)
const search = ref('')
const statusFilter = ref('All')
const rowSelection = ref<Record<string, boolean>>({})

type TableRow<T> = { original: T }
type TableApi<T> = {
  getFilteredSelectedRowModel: () => { rows: Array<TableRow<T>> }
  getFilteredRowModel: () => { rows: Array<TableRow<T>> }
  getState: () => {
    pagination: {
      pageIndex: number
      pageSize: number
    }
  }
  setPageIndex: (pageIndex: number) => void
}
type TableRef<T> = { tableApi?: TableApi<T> }

const table = ref<TableRef<Database['public']['Tables']['wanna_sipps']['Row']> | null>(null)
const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})
const sorting = ref([
  { id: 'completed', desc: false },
  { id: 'created_at', desc: true }
])

const { data: items, status, refresh } = await useAsyncData('wanna-sipps', async () => {
  const { data, error } = await supabase
    .from('wanna_sipps')
    .select('*')
    .order('completed', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    toast.add({ title: 'Error loading list', description: error.message, color: 'error' })
    return []
  }
  return data
})

// getUser() re-validates the session at mutation time rather than relying
// solely on the reactive user ref, which may reflect a stale cached state.
async function addItem() {
  if (!newRoaster.value.trim()) return
  if (!user.value) {
    toast.add({ title: 'Not authenticated', description: 'Please log in again.', color: 'error' })
    navigateTo('/login')
    return
  }

  const { data: authData, error: authError } = await supabase.auth.getUser()
  const currentUser = authData.user

  if (authError || !currentUser) {
    toast.add({ title: 'Session expired', description: 'Please log in again.', color: 'error' })
    navigateTo('/login')
    return
  }

  const { error } = await supabase.from('wanna_sipps').insert({
    user_id: currentUser.id,
    roaster: newRoaster.value.trim(),
    notes: newNotes.value.trim() || null
  })

  if (error) {
    toast.add({ title: 'Error adding item', description: error.message, color: 'error' })
  } else {
    newRoaster.value = ''
    newNotes.value = ''
    adding.value = false
    refresh()
  }
}

async function toggleCompleted(id: string, current: boolean) {
  const { error } = await supabase
    .from('wanna_sipps')
    .update({ completed: !current })
    .eq('id', id)

  if (error) {
    toast.add({ title: 'Error updating item', description: error.message, color: 'error' })
  } else {
    refresh()
  }
}

// deleteItem gates the destructive action behind useConfirmAction, which
// renders a confirmation modal before calling the actual Supabase delete.
// deleteItem gates the destructive action behind useConfirmAction, which
// renders a confirmation modal before calling the actual Supabase delete.
async function deleteItem(id: string) {
  confirmDeleteState.requestConfirmation({
    title: 'Delete this wishlist item?',
    description: 'This item will be permanently removed.',
    action: async () => {
      await deleteItemNow(id)
    }
  })
}

async function deleteItemNow(id: string) {
  const { error } = await supabase.from('wanna_sipps').delete().eq('id', id)
  if (error) {
    toast.add({ title: 'Error deleting item', description: error.message, color: 'error' })
  } else {
    await refresh()
  }
}

type WannaSipp = Database['public']['Tables']['wanna_sipps']['Row']

const filteredItems = computed(() => {
  const q = search.value.trim().toLowerCase()

  return (items.value ?? []).filter((item) => {
    const matchesSearch = q.length === 0
      || item.roaster.toLowerCase().includes(q)
      || (item.notes ?? '').toLowerCase().includes(q)
      || (item.origin ?? '').toLowerCase().includes(q)
      || (item.method ?? '').toLowerCase().includes(q)
      || (item.roast_type ?? '').toLowerCase().includes(q)

    const matchesStatus = statusFilter.value === 'All'
      || (statusFilter.value === 'Pending' && !item.completed)
      || (statusFilter.value === 'Completed' && item.completed)

    return matchesSearch && matchesStatus
  })
})

const filteredCount = computed(() => filteredItems.value.length)
const hasActiveFilters = computed(() => {
  return search.value.trim().length > 0 || statusFilter.value !== 'All'
})
const { currentPage, itemsPerPage, selectedRowCount, visibleTableRowCount } = useDashboardTableMetrics({
  table,
  pagination,
  fallbackRowCount: filteredCount
})

const columns: TableColumn<WannaSipp>[] = [
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
    accessorKey: 'completed',
    header: createSortHeader(UButton, 'Status')
  },
  {
    accessorKey: 'roaster',
    header: createSortHeader(UButton, 'Roaster')
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
    accessorKey: 'notes',
    header: 'Notes',
    enableSorting: false
  },
  {
    accessorKey: 'created_at',
    header: createSortHeader(UButton, 'Added')
  },
  {
    id: 'actions',
    enableSorting: false
  }
]

async function deleteSelected() {
  const selectedRows = table.value?.tableApi?.getFilteredSelectedRowModel().rows ?? []
  const selectedIds = selectedRows.map((row: { original: WannaSipp }) => row.original.id)

  if (!selectedIds.length) return

  confirmDeleteState.requestConfirmation({
    title: `Delete ${selectedIds.length} selected item(s)?`,
    description: 'This will permanently remove all selected wishlist entries.',
    action: async () => {
      await deleteSelectedNow(selectedIds)
    }
  })
}

async function deleteSelectedNow(selectedIds: string[]) {
  if (!selectedIds.length) return

  const { error } = await supabase.from('wanna_sipps').delete().in('id', selectedIds)

  if (error) {
    toast.add({ title: 'Error deleting selected items', description: error.message, color: 'error' })
  } else {
    toast.add({ title: `${selectedIds.length} items deleted`, color: 'success' })
    rowSelection.value = {}
    await refresh()
  }
}

async function markSelectedCompleted(completed: boolean) {
  const selectedRows = table.value?.tableApi?.getFilteredSelectedRowModel().rows ?? []
  const selectedIds = selectedRows.map((row: { original: WannaSipp }) => row.original.id)

  if (!selectedIds.length) return

  const { error } = await supabase
    .from('wanna_sipps')
    .update({ completed })
    .in('id', selectedIds)

  if (error) {
    toast.add({ title: 'Error updating selected items', description: error.message, color: 'error' })
  } else {
    toast.add({
      title: completed ? 'Selected items marked complete' : 'Selected items moved to pending',
      color: 'success'
    })
    rowSelection.value = {}
    await refresh()
  }
}

function clearFilters() {
  search.value = ''
  statusFilter.value = 'All'
}

function updateDeleteConfirmOpen(value: boolean) {
  confirmDeleteState.isOpen.value = value
}
</script>

<template>
  <div>
    <UDashboardPanel id="wanna-sipp">
      <template #header>
        <UDashboardNavbar title="Wanna Sipp">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>

          <template #right>
            <UButton
              label="Add"
              icon="i-lucide-plus"
              color="primary"
              @click="adding = !adding"
            />
          </template>
        </UDashboardNavbar>

        <UDashboardToolbar>
          <template #left>
            <div class="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
              <UInput
                v-model="search"
                icon="i-lucide-search"
                placeholder="Search wishlist"
                class="w-full sm:w-80"
              />
              <USelect
                v-model="statusFilter"
                :items="['All', 'Pending', 'Completed']"
                class="w-full sm:w-44"
              />
            </div>
          </template>

          <template #right>
            <div class="flex items-center gap-2">
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
        <div class="p-4 lg:p-6 space-y-4">
          <div
            v-if="adding"
            class="p-4 rounded-lg border border-default bg-elevated/50 space-y-3"
          >
            <UInput
              v-model="newRoaster"
              placeholder="Roaster or coffee name"
              class="w-full"
            />
            <UInput
              v-model="newNotes"
              placeholder="Notes (optional)"
              class="w-full"
            />
            <div class="flex flex-col gap-2 sm:flex-row">
              <UButton
                label="Save"
                color="primary"
                size="sm"
                class="w-full sm:w-auto"
                @click="addItem"
              />
              <UButton
                label="Cancel"
                color="neutral"
                variant="ghost"
                size="sm"
                class="w-full sm:w-auto"
                @click="adding = false"
              />
            </div>
          </div>

          <UAlert
            v-if="selectedRowCount > 0"
            color="info"
            variant="soft"
            icon="i-lucide-check-square"
            :title="`${selectedRowCount} row(s) selected`"
          >
            <template #actions>
              <div class="flex flex-wrap items-center gap-2">
                <UButton
                  label="Mark done"
                  icon="i-lucide-check"
                  color="success"
                  variant="soft"
                  size="sm"
                  @click="markSelectedCompleted(true)"
                />
                <UButton
                  label="Mark pending"
                  icon="i-lucide-rotate-ccw"
                  color="neutral"
                  variant="soft"
                  size="sm"
                  @click="markSelectedCompleted(false)"
                />
                <UButton
                  label="Delete"
                  icon="i-lucide-trash-2"
                  color="error"
                  variant="soft"
                  size="sm"
                  @click="deleteSelected"
                />
              </div>
            </template>
          </UAlert>

          <UTable
            ref="table"
            v-model:row-selection="rowSelection"
            v-model:pagination="pagination"
            v-model:sorting="sorting"
            :column-visibility="mobileColumnVisibility"
            :data="filteredItems"
            :columns="columns"
            :loading="status === 'pending' || status === 'idle'"
          >
            <template #completed-cell="{ row }">
              <UCheckbox
                :model-value="row.original.completed"
                @update:model-value="toggleCompleted(row.original.id, row.original.completed)"
              />
            </template>

            <template #roaster-cell="{ row }">
              <div class="flex flex-col gap-1">
                <span
                  class="font-medium"
                  :class="row.original.completed ? 'line-through text-muted' : 'text-highlighted'"
                >
                  {{ row.original.roaster }}
                </span>
                <span
                  v-if="row.original.roast_type"
                  class="text-xs text-muted"
                >
                  {{ row.original.roast_type }}
                </span>
              </div>
            </template>

            <template #method-cell="{ row }">
              <span class="text-sm text-muted">{{ row.original.method || '—' }}</span>
            </template>

            <template #origin-cell="{ row }">
              <span class="text-sm text-muted">{{ row.original.origin || '—' }}</span>
            </template>

            <template #notes-cell="{ row }">
              <span class="text-sm text-muted block max-w-64 truncate">
                {{ row.original.notes || '—' }}
              </span>
            </template>

            <template #created_at-cell="{ row }">
              <span class="text-sm text-muted">{{ formatDashboardDate(row.original.created_at) }}</span>
            </template>

            <template #actions-cell="{ row }">
              <UDropdownMenu
                :items="[
                  [{
                    label: row.original.completed ? 'Mark pending' : 'Mark complete',
                    icon: row.original.completed ? 'i-lucide-rotate-ccw' : 'i-lucide-check',
                    onSelect: () => toggleCompleted(row.original.id, row.original.completed)
                  }],
                  [{
                    label: 'Delete',
                    icon: 'i-lucide-trash-2',
                    color: 'error',
                    onSelect: () => deleteItem(row.original.id)
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
                  name="i-lucide-list-todo"
                  class="size-10 text-muted mb-3"
                />
                <p class="text-sm text-muted">
                  No wishlist items match your filters.
                </p>
              </div>
            </template>
          </UTable>

          <div class="flex justify-end">
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
