import { computed, h, toValue } from 'vue'
import type { Component, MaybeRefOrGetter, Ref } from 'vue'

type ResolvedComponent = string | Component

type SortDirection = false | 'asc' | 'desc'

type SortableColumn = {
  getIsSorted: () => SortDirection
  toggleSorting: (descending?: boolean) => void
}

type SortHeaderContext = {
  column: SortableColumn
}

type PaginationState = {
  pageIndex: number
  pageSize: number
}

type FilteredRowModel = {
  rows: unknown[]
}

type DashboardTableApi = {
  getFilteredSelectedRowModel?: () => FilteredRowModel
  getFilteredRowModel?: () => FilteredRowModel
  getState?: () => {
    pagination?: Partial<PaginationState>
  }
}

type DashboardTableRef = {
  tableApi?: DashboardTableApi
}

export function useDashboardTable() {
  function searchableText(value: string | null | undefined) {
    return value?.toLowerCase() ?? ''
  }

  function createSelectOptions<T>(
    items: T[] | null | undefined,
    getValue: (item: T) => string | null | undefined,
    allLabel = 'All'
  ) {
    const values = new Set(
      (items ?? [])
        .map(getValue)
        .filter((value): value is string => Boolean(value))
    )

    return [allLabel, ...Array.from(values).sort((a, b) => a.localeCompare(b))]
  }

  function createSortHeader(buttonComponent: ResolvedComponent, label: string) {
    return ({ column }: SortHeaderContext) => h(buttonComponent, {
      color: 'neutral',
      variant: 'ghost',
      label,
      icon: column.getIsSorted() === 'asc'
        ? 'i-lucide-arrow-up'
        : column.getIsSorted() === 'desc'
          ? 'i-lucide-arrow-down'
          : 'i-lucide-arrow-up-down',
      class: '-ml-3',
      onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
    })
  }

  function formatDashboardDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return {
    createSelectOptions,
    createSortHeader,
    formatDashboardDate,
    searchableText
  }
}

export function useDashboardTableMetrics(options: {
  table: Ref<DashboardTableRef | null>
  pagination: Ref<PaginationState>
  fallbackRowCount: MaybeRefOrGetter<number>
}) {
  const selectedRowCount = computed(() => {
    return options.table.value?.tableApi?.getFilteredSelectedRowModel?.().rows.length ?? 0
  })

  const visibleTableRowCount = computed(() => {
    return options.table.value?.tableApi?.getFilteredRowModel?.().rows.length ?? toValue(options.fallbackRowCount)
  })

  const currentPage = computed(() => {
    const pageIndex = options.table.value?.tableApi?.getState?.().pagination?.pageIndex ?? options.pagination.value.pageIndex
    return pageIndex + 1
  })

  const itemsPerPage = computed(() => {
    return options.table.value?.tableApi?.getState?.().pagination?.pageSize ?? options.pagination.value.pageSize
  })

  return {
    currentPage,
    itemsPerPage,
    selectedRowCount,
    visibleTableRowCount
  }
}
