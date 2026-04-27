<!-- score.vue
     Ranked leaderboard of all logged sipps, sorted by overall score.
     Provides lightweight search and filter controls. Rank icons and colors
     call out the top three entries. Entries open in the SippSlideover for
     full detail. -->
<script setup lang="ts">
import { resolveComponent } from 'vue'
import { useDashboardTable, useDashboardTableMetrics } from '~/composables/useDashboardTable'
import type { TableColumn } from '@nuxt/ui'
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'dashboard' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()
const UButton = resolveComponent('UButton')
const loadError = ref<string | null>(null)
const { createSelectOptions, createSortHeader, searchableText } = useDashboardTable()

const search = ref('')
const methodFilter = ref('All')
const roastFilter = ref('All')
const mobileFiltersOpen = ref(false)
const slideoverOpen = ref(false)
const selectedSipp = ref<Database['public']['Tables']['sipps']['Row']>()
type TableApi = {
  getFilteredRowModel?: () => { rows: unknown[] }
  getState?: () => {
    pagination?: {
      pageIndex?: number
      pageSize?: number
    }
  }
  setPageIndex: (pageIndex: number) => void
}
type TableRef = { tableApi?: TableApi }

const table = ref<TableRef | null>(null)
const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})
const sorting = ref([
  { id: 'overall', desc: true },
  { id: 'created_at', desc: true }
])

type Sipp = Database['public']['Tables']['sipps']['Row']
// Data is fetched once and filtered client-side, which is fast enough at
// typical user log sizes and avoids a round-trip per filter change.
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
    const matchesRoast = roastFilter.value === 'All' || (sipp.roast_type ?? '') === roastFilter.value

    return matchesSearch && matchesMethod && matchesRoast
  })
})

const totalSipps = computed(() => sipps.value?.length ?? 0)
const filteredCount = computed(() => filteredSipps.value.length)
const renderedRowCount = computed<number>(() => filteredCount.value)
const { currentPage, itemsPerPage, visibleTableRowCount } = useDashboardTableMetrics({
  table,
  pagination,
  fallbackRowCount: filteredCount
})

const methodOptions = computed(() => {
  return createSelectOptions(sipps.value, sipp => sipp.method)
})

const roastOptions = computed(() => {
  return createSelectOptions(sipps.value, sipp => sipp.roast_type)
})

const hasActiveFilters = computed(() => {
  return search.value.trim().length > 0 || methodFilter.value !== 'All' || roastFilter.value !== 'All'
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

const mobileColumnVisibility = computed((): Record<string, boolean> => {
  if (!isMobile.value) {
    return {}
  }

  return {
    origin: false,
    roast_type: false,
    created_at: false
  }
})

const activeFilterCount = computed(() => {
  return [
    search.value.trim().length > 0,
    methodFilter.value !== 'All',
    roastFilter.value !== 'All'
  ].filter(Boolean).length
})

const columns: TableColumn<Sipp>[] = [
  {
    id: 'rank',
    header: '#',
    enableSorting: false
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
    accessorKey: 'roast_type',
    header: createSortHeader(UButton, 'Roast')
  },
  {
    accessorKey: 'method',
    header: createSortHeader(UButton, 'Method')
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

// Rank icons and colors follow a medal metaphor: trophy for 1st, medal for
// 2nd, award for 3rd, muted text for all others.
function getRankIcon(rank: number) {
  if (rank === 1) return 'i-lucide-trophy'
  if (rank === 2) return 'i-lucide-medal'
  if (rank === 3) return 'i-lucide-award'
  return null
}

function getRankColor(rank: number) {
  if (rank === 1) return 'text-warning'
  if (rank === 2) return 'text-info'
  if (rank === 3) return 'text-primary'
  return 'text-muted'
}

function openView(sipp: Sipp) {
  selectedSipp.value = sipp
  slideoverOpen.value = true
}

function clearFilters() {
  search.value = ''
  methodFilter.value = 'All'
  roastFilter.value = 'All'
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
            <div class="flex w-full flex-col gap-2">
              <div class="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                <UInput
                  v-model="search"
                  icon="i-lucide-search"
                  placeholder="Search rankings"
                  class="w-full sm:w-80"
                />

                <div class="flex items-center gap-2 sm:hidden">
                  <UButton
                    :label="activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'"
                    icon="i-lucide-sliders-horizontal"
                    color="neutral"
                    variant="outline"
                    class="flex-1"
                    @click="mobileFiltersOpen = true"
                  />
                  <UButton
                    icon="i-lucide-refresh-cw"
                    color="neutral"
                    variant="outline"
                    square
                    aria-label="Refresh rankings"
                    @click="() => refresh()"
                  />
                </div>

                <div class="hidden sm:flex sm:items-center sm:gap-2">
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
              </div>
            </div>
          </template>

          <template #right>
            <div class="hidden items-center gap-2 sm:flex">
              <UButton
                label="Refresh"
                icon="i-lucide-refresh-cw"
                color="neutral"
                variant="outline"
                @click="() => refresh()"
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
          <DashboardTableStats
            :total="totalSipps"
            :filtered="filteredCount"
            :rendered="renderedRowCount"
          />

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
            v-model:pagination="pagination"
            v-model:sorting="sorting"
            :column-visibility="mobileColumnVisibility"
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
              <SippRoasterCell
                :roaster="row.original.roaster"
                @open="openView(row.original)"
              />
            </template>

            <template #method-cell="{ row }">
              <SippMethodBadge :method="row.original.method" />
            </template>

            <template #roast_type-cell="{ row }">
              <span class="text-sm text-muted">{{ row.original.roast_type }}</span>
            </template>

            <template #overall-cell="{ row }">
              <SippOverallScore :score="row.original.overall" />
            </template>

            <template #created_at-cell="{ row }">
              <DashboardDateCell :date="row.original.created_at" />
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
              <DashboardTableEmptyState
                icon="i-lucide-star"
                :message="totalSipps === 0 ? 'No scored sipps were returned for this account yet.' : 'No scores match your current filters.'"
              />
            </template>
          </UTable>

          <DashboardTablePager
            :current-page="currentPage"
            :items-per-page="itemsPerPage"
            :total="visibleTableRowCount"
            @update:page="(page) => table?.tableApi?.setPageIndex(page - 1)"
          />
        </div>
      </template>
    </UDashboardPanel>

    <DashboardMobileFilters
      v-model:open="mobileFiltersOpen"
      title="Ranking filters"
      description="Narrow the leaderboard without crowding the header."
      :clear-disabled="!hasActiveFilters"
      @clear="clearFilters"
    >
      <div class="space-y-3">
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
      </div>
    </DashboardMobileFilters>

    <SippEntryModal
      v-model:open="slideoverOpen"
      :sipp="selectedSipp"
      readonly
    />
  </div>
</template>
