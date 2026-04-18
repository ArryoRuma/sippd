<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'dashboard' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()
const UButton = resolveComponent('UButton')
const loadError = ref<string | null>(null)

const search = ref('')
const methodFilter = ref('All')
const slideoverOpen = ref(false)
const selectedSipp = ref<Database['public']['Tables']['sipps']['Row']>()
const table = ref<unknown>(null)
const sorting = ref([
  { id: 'overall', desc: true },
  { id: 'created_at', desc: true }
])

function searchableText(value: string | null | undefined) {
  return value?.toLowerCase() ?? ''
}

type Sipp = Database['public']['Tables']['sipps']['Row']
const { data: sipps, status, refresh } = await useAsyncData('sipps-ranked', async () => {
  loadError.value = null

  const { data, error } = await supabase
    .from('sipps')
    .select('*')
    .order('overall', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    loadError.value = error.message
    toast.add({ title: 'Error loading scores', description: error.message, color: 'error' })
    return []
  }

  return data ?? []
})

const filteredSipps = computed(() => {
  const q = search.value.trim().toLowerCase()

  return (sipps.value ?? []).filter((sipp) => {
    const matchesSearch = q.length === 0
      || [sipp.roaster, sipp.origin, sipp.method, sipp.roast_type]
        .some(field => searchableText(field).includes(q))

    const matchesMethod = methodFilter.value === 'All' || (sipp.method ?? '') === methodFilter.value

    return matchesSearch && matchesMethod
  })
})

const totalSipps = computed(() => sipps.value?.length ?? 0)
const filteredCount = computed(() => filteredSipps.value.length)
const renderedRowCount = computed<number>(() => filteredCount.value)

const methodOptions = computed(() => {
  const values = new Set(
    (sipps.value ?? [])
      .map(sipp => sipp.method)
      .filter((value): value is string => Boolean(value))
  )

  return ['All', ...Array.from(values).sort((a, b) => a.localeCompare(b))]
})

const columns: TableColumn<Sipp>[] = [
  {
    id: 'rank',
    header: '#',
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

function getRankIcon(rank: number) {
  if (rank === 1) return 'i-lucide-trophy'
  if (rank === 2) return 'i-lucide-medal'
  if (rank === 3) return 'i-lucide-award'
  return null
}

function getRankColor(rank: number) {
  if (rank === 1) return 'text-yellow-500'
  if (rank === 2) return 'text-slate-400'
  if (rank === 3) return 'text-amber-600'
  return 'text-muted'
}

function openView(sipp: Sipp) {
  selectedSipp.value = sipp
  slideoverOpen.value = true
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
    <UDashboardPanel id="sipp-score">
      <template #header>
        <UDashboardNavbar title="SippScore">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
        </UDashboardNavbar>

        <UDashboardToolbar>
          <template #left>
            <div class="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
              <UInput
                v-model="search"
                icon="i-lucide-search"
                placeholder="Search rankings"
                class="w-full sm:w-80"
              />
              <USelect
                v-model="methodFilter"
                :items="methodOptions"
                class="w-full sm:w-48"
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
            description="Log in to view your SippScore rankings."
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
            title="Could not load SippScore"
            :description="loadError"
            class="mb-4"
          >
            <template #actions>
              <UButton
                label="Retry"
                color="neutral"
                variant="outline"
                @click="refresh()"
              />
            </template>
          </UAlert>

          <UTable
            ref="table"
            v-model:sorting="sorting"
            :data="filteredSipps"
            :columns="columns"
            :loading="status === 'pending' || status === 'idle'"
          >
            <template #rank-cell="{ row }">
              <div class="flex items-center justify-center w-9">
                <UIcon
                  v-if="getRankIcon(Number(row.index) + 1)"
                  :name="getRankIcon(Number(row.index) + 1)!"
                  :class="['size-4.5', getRankColor(Number(row.index) + 1)]"
                />
                <span
                  v-else
                  class="text-xs font-mono text-muted"
                >{{ Number(row.index) + 1 }}</span>
              </div>
            </template>

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

            <template #roast_type-cell="{ row }">
              <span class="text-sm text-muted">{{ row.original.roast_type }}</span>
            </template>

            <template #overall-cell="{ row }">
              <span class="font-semibold text-primary">{{ row.original.overall }}</span>
              <span class="text-xs text-muted">/50</span>
            </template>

            <template #created_at-cell="{ row }">
              <span class="text-sm text-muted">{{ formatDate(row.original.created_at) }}</span>
            </template>

            <template #actions-cell="{ row }">
              <UButton
                icon="i-lucide-eye"
                color="neutral"
                variant="ghost"
                size="xs"
                @click="openView(row.original)"
              />
            </template>

            <template #empty>
              <div class="py-12 text-center">
                <UIcon
                  name="i-lucide-star"
                  class="size-10 text-muted mb-3"
                />
                <p class="text-sm text-muted">
                  {{ totalSipps === 0 ? 'No scored sipps were returned for this account yet.' : 'No scores match your current filters.' }}
                </p>
              </div>
            </template>
          </UTable>
        </div>
      </template>
    </UDashboardPanel>

    <USlideover v-model:open="slideoverOpen">
      <template #content>
        <SippSlideover
          :sipp="selectedSipp"
          readonly
          @close="slideoverOpen = false"
        />
      </template>
    </USlideover>
  </div>
</template>
