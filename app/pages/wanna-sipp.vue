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

async function deleteItem(id: string) {
  const { error } = await supabase.from('wanna_sipps').delete().eq('id', id)
  if (error) {
    toast.add({ title: 'Error deleting item', description: error.message, color: 'error' })
  } else {
    refresh()
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
    header: ({ column }) => h(UButton, {
      color: 'neutral',
      variant: 'ghost',
      label: 'Status',
      icon: column.getIsSorted() === 'asc' ? 'i-lucide-arrow-up' : column.getIsSorted() === 'desc' ? 'i-lucide-arrow-down' : 'i-lucide-arrow-up-down',
      class: '-ml-3',
      onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
    })
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
    accessorKey: 'notes',
    header: 'Notes',
    enableSorting: false
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => h(UButton, {
      color: 'neutral',
      variant: 'ghost',
      label: 'Added',
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

async function deleteSelected() {
  const selectedRows = table.value?.tableApi?.getFilteredSelectedRowModel().rows ?? []
  const selectedIds = selectedRows.map((row: { original: WannaSipp }) => row.original.id)

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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
</script>

<template>
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
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="px-4 lg:px-6 py-4 space-y-4">
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
          <div class="flex gap-2">
            <UButton
              label="Save"
              color="primary"
              size="sm"
              @click="addItem"
            />
            <UButton
              label="Cancel"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="adding = false"
            />
          </div>
        </div>

        <UAlert
          v-if="(table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0) > 0"
          color="info"
          variant="soft"
          icon="i-lucide-check-square"
          :title="`${table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0} row(s) selected`"
        >
          <template #actions>
            <div class="flex items-center gap-2">
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
            <span class="text-sm text-muted">{{ formatDate(row.original.created_at) }}</span>
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
            :page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
            :items-per-page="table?.tableApi?.getState().pagination.pageSize"
            :total="table?.tableApi?.getFilteredRowModel().rows.length"
            @update:page="(page) => table?.tableApi?.setPageIndex(page - 1)"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
