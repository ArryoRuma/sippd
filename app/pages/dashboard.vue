<script setup lang="ts">
import { useDashboardTable } from '~/composables/useDashboardTable'
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'dashboard' })

type Sipp = Database['public']['Tables']['sipps']['Row']
type DashboardSummaryRow = Database['public']['Functions']['dashboard_summary']['Returns'][number]
type DashboardActivityRow = Database['public']['Functions']['dashboard_activity']['Returns'][number]
type DashboardMethodMixRow = Database['public']['Functions']['dashboard_method_mix']['Returns'][number]
type DashboardTasteProfileRow = Database['public']['Functions']['dashboard_taste_profile']['Returns'][number]
type DashboardTopOriginsRow = Database['public']['Functions']['dashboard_top_origins']['Returns'][number]
type DashboardRange = '7d' | '30d' | '90d' | 'all'

type ActivityPoint = {
  label: string
  fullLabel: string
  count: number
  average: number
  from: string
  to: string
}

type DistributionItem = {
  label: string
  count: number
  average: number
  share: number
  color: string
}

type TasteMetric = {
  label: string
  value: number
}

type OriginLeader = {
  origin: string
  count: number
  average: number
}

type DashboardStats = {
  total: number
  average: number
  topSipp: {
    roaster: string
    overall: number
    method: string
  } | null
  recentSipp: {
    roaster: string
    createdAt: string
  } | null
  recent: Sipp[]
  completedThisWeek: number
  methods: Array<{ method: string, count: number }>
  activity: ActivityPoint[]
  methodMix: DistributionItem[]
  tasteProfile: TasteMetric[]
  topOrigins: OriginLeader[]
  recentAverage: number
  previousAverage: number
}

const emptyDashboardStats: DashboardStats = {
  total: 0,
  average: 0,
  topSipp: null,
  recentSipp: null,
  recent: [],
  completedThisWeek: 0,
  methods: [],
  activity: [],
  methodMix: [],
  tasteProfile: [],
  topOrigins: [],
  recentAverage: 0,
  previousAverage: 0
}

const methodPalette = ['#00c3ff', '#fb7b04', '#a9d316', '#004e66']

const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()
const toast = useToast()
const loadError = ref<string | null>(null)
const selectedRange = ref<DashboardRange>('30d')
const { formatDashboardDate } = useDashboardTable()

const rangeOptions = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'All time', value: 'all' }
]

function startOfDayIso(daysAgo: number) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString()
}

const selectedRangeLabel = computed(() => {
  return rangeOptions.find(option => option.value === selectedRange.value)?.label ?? 'Last 30 days'
})

const selectedRangeStart = computed(() => {
  if (selectedRange.value === '7d') return startOfDayIso(6)
  if (selectedRange.value === '30d') return startOfDayIso(29)
  if (selectedRange.value === '90d') return startOfDayIso(89)
  return null
})

const selectedRangeEnd = computed(() => {
  return null
})

function formatDisplayName(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const dashboardProfileName = await useAsyncData('dashboard-profile-name', async (): Promise<string | null> => {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  const authUser = authData.user ?? user.value

  if (authError || !authUser?.id) {
    return null
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', authUser.id)
    .maybeSingle()

  if (error) {
    console.warn('Could not load dashboard profile name', error.message)
    return null
  }

  return data?.full_name?.trim() || null
}, {
  default: () => null,
  watch: [() => user.value?.id]
})

const dashboardGreetingName = computed(() => {
  const profileName = dashboardProfileName.data.value

  if (profileName) {
    return formatDisplayName(profileName)
  }

  const emailLocal = user.value?.email?.split('@')[0]?.replace(/[._-]+/g, ' ') ?? ''
  return emailLocal ? formatDisplayName(emailLocal) : ''
})

const activityDays = computed(() => {
  if (selectedRange.value === '7d') return 7
  if (selectedRange.value === '90d') return 90
  return 30
})

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toIsoDayRange(dayDate: string) {
  const from = new Date(`${dayDate}T00:00:00.000Z`)
  const to = new Date(from)
  to.setUTCDate(from.getUTCDate() + 1)

  return {
    from: from.toISOString(),
    to: to.toISOString()
  }
}

function mapSummaryRow(summary: DashboardSummaryRow | null): Pick<DashboardStats, 'total' | 'average' | 'completedThisWeek' | 'recentAverage' | 'previousAverage' | 'topSipp' | 'recentSipp'> {
  if (!summary) {
    return {
      total: 0,
      average: 0,
      completedThisWeek: 0,
      recentAverage: 0,
      previousAverage: 0,
      topSipp: null,
      recentSipp: null
    }
  }

  const topSipp = summary.top_roaster && summary.top_method && summary.top_overall !== null
    ? {
        roaster: summary.top_roaster,
        method: summary.top_method,
        overall: toNumber(summary.top_overall)
      }
    : null

  const recentSipp = summary.recent_roaster && summary.recent_created_at
    ? {
        roaster: summary.recent_roaster,
        createdAt: summary.recent_created_at
      }
    : null

  return {
    total: toNumber(summary.total),
    average: toNumber(summary.average_score),
    completedThisWeek: toNumber(summary.completed_this_week),
    recentAverage: toNumber(summary.recent_average),
    previousAverage: toNumber(summary.previous_average),
    topSipp,
    recentSipp
  }
}

function mapActivityRows(rows: DashboardActivityRow[]): ActivityPoint[] {
  return rows.map((row) => {
    const date = new Date(`${row.day_date}T00:00:00.000Z`)
    const range = toIsoDayRange(row.day_date)

    return {
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullLabel: date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
      count: toNumber(row.count),
      average: toNumber(row.average_score),
      from: range.from,
      to: range.to
    }
  })
}

function mapMethodMixRows(rows: DashboardMethodMixRow[]): DistributionItem[] {
  return rows.map((row, index) => ({
    label: row.method,
    count: toNumber(row.count),
    average: toNumber(row.average_score),
    share: toNumber(row.share),
    color: methodPalette[index] ?? '#bfdbfe'
  }))
}

function mapTasteProfile(row: DashboardTasteProfileRow | null): TasteMetric[] {
  if (!row) return []

  return [
    { label: 'Aroma', value: toNumber(row.aroma) },
    { label: 'Flavor', value: toNumber(row.flavor) },
    { label: 'Acidity', value: toNumber(row.acidity) },
    { label: 'Body', value: toNumber(row.body) },
    { label: 'Aftertaste', value: toNumber(row.aftertaste) }
  ]
}

function mapTopOrigins(rows: DashboardTopOriginsRow[]): OriginLeader[] {
  return rows.map(row => ({
    origin: row.origin,
    count: toNumber(row.count),
    average: toNumber(row.average_score)
  }))
}

const dashboardAsyncData = await useAsyncData('dashboard-stats', async (): Promise<DashboardStats> => {
  loadError.value = null

  let recentQuery = supabase
    .from('sipps')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  if (selectedRangeStart.value) {
    recentQuery = recentQuery.gte('created_at', selectedRangeStart.value)
  }

  if (selectedRangeEnd.value) {
    recentQuery = recentQuery.lte('created_at', selectedRangeEnd.value)
  }

  const [
    summaryRes,
    activityRes,
    methodMixRes,
    tasteProfileRes,
    topOriginsRes,
    recentRes
  ] = await Promise.all([
    supabase.rpc('dashboard_summary', { p_from: selectedRangeStart.value, p_to: selectedRangeEnd.value }),
    supabase.rpc('dashboard_activity', { p_days: activityDays.value }),
    supabase.rpc('dashboard_method_mix', { p_limit: 4, p_from: selectedRangeStart.value, p_to: selectedRangeEnd.value }),
    supabase.rpc('dashboard_taste_profile', { p_from: selectedRangeStart.value, p_to: selectedRangeEnd.value }),
    supabase.rpc('dashboard_top_origins', { p_limit: 3, p_from: selectedRangeStart.value, p_to: selectedRangeEnd.value }),
    recentQuery
  ])

  const firstError = summaryRes.error
    ?? activityRes.error
    ?? methodMixRes.error
    ?? tasteProfileRes.error
    ?? topOriginsRes.error
    ?? recentRes.error

  if (firstError) {
    loadError.value = firstError.message
    toast.add({ title: 'Could not load dashboard analytics', description: firstError.message, color: 'error' })
    return emptyDashboardStats
  }

  const summary = mapSummaryRow(summaryRes.data?.[0] ?? null)
  const methodMix = mapMethodMixRows(methodMixRes.data ?? [])

  return {
    ...summary,
    recent: recentRes.data ?? [],
    methods: methodMix.slice(0, 3).map(item => ({ method: item.label, count: item.count })),
    activity: mapActivityRows(activityRes.data ?? []),
    methodMix,
    tasteProfile: mapTasteProfile(tasteProfileRes.data?.[0] ?? null),
    topOrigins: mapTopOrigins(topOriginsRes.data ?? [])
  }
}, {
  default: () => emptyDashboardStats,
  watch: [selectedRange]
})

const status = dashboardAsyncData.status
const stats = computed(() => dashboardAsyncData.data.value ?? emptyDashboardStats)

const avgProgress = computed(() => {
  return Math.min(100, Math.round((stats.value.average / 50) * 100))
})

const scoreDelta = computed(() => {
  return stats.value.recentAverage - stats.value.previousAverage
})

const activityMaxCount = computed(() => {
  return Math.max(...stats.value.activity.map(point => point.count), 1)
})

const activityChartPath = computed(() => {
  const points = stats.value.activity

  if (!points.length) return ''

  const width = 100
  const height = 100
  const step = points.length > 1 ? width / (points.length - 1) : width

  return points
    .map((point, index) => {
      const x = Number((index * step).toFixed(2))
      const y = Number((height - (point.average / 50) * height).toFixed(2))
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')
})

function methodFilterLink(method: string) {
  return {
    path: '/log',
    query: {
      method
    }
  }
}

function originFilterLink(origin: string) {
  return {
    path: '/log',
    query: {
      origin
    }
  }
}

function shouldShowActivityLabel(index: number, total: number) {
  if (total <= 7) return true

  const step = total > 20 ? 6 : total > 14 ? 4 : 3
  return index === 0 || index === total - 1 || index % step === 0
}
</script>

<template>
  <UDashboardPanel id="dashboard-home">
    <template #header>
      <UDashboardNavbar title="Dashboard">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <div class="hidden items-center gap-2 md:flex">
            <USelect
              v-model="selectedRange"
              :items="rangeOptions"
              class="w-40"
            />
            <UButton
              label="Insights"
              icon="i-lucide-line-chart"
              color="neutral"
              variant="soft"
              to="/insights"
            />
            <UButton
              label="Log New Sipp"
              icon="i-lucide-plus"
              color="primary"
              to="/log"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="relative overflow-hidden p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        <div class="rounded-2xl border border-default bg-elevated p-2.5 shadow-sm md:hidden">
          <div class="flex flex-col gap-2">
            <USelect
              v-model="selectedRange"
              :items="rangeOptions"
              class="w-full"
            />

            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <UButton
                label="Insights"
                icon="i-lucide-line-chart"
                color="neutral"
                variant="soft"
                block
                to="/insights"
              />
              <UButton
                label="Log New Sipp"
                icon="i-lucide-plus"
                color="primary"
                block
                to="/log"
              />
            </div>
          </div>
        </div>

        <div>
          <h2 class="text-xl font-bold text-highlighted sm:text-2xl">
            Welcome back{{ dashboardGreetingName ? `, ${dashboardGreetingName}` : '' }}
          </h2>
          <p class="text-sm text-muted mt-1">
            Track trends, review your best cups, and keep your next brews queued up.
          </p>
        </div>

        <UAlert
          v-if="loadError"
          color="error"
          variant="soft"
          icon="i-lucide-triangle-alert"
          title="Could not load some analytics"
          :description="loadError"
        />

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          <UCard class="vibe-surface">
            <template #header>
              <p class="text-xs uppercase tracking-wide text-muted">
                Total Sipps
              </p>
            </template>

            <p class="text-3xl font-bold text-highlighted">
              {{ stats.total }}
            </p>
            <p class="text-xs text-muted mt-1">
              {{ stats.completedThisWeek }} logged this week
            </p>
          </UCard>

          <UCard class="vibe-surface">
            <template #header>
              <p class="text-xs uppercase tracking-wide text-muted">
                Average Score
              </p>
            </template>

            <p class="text-3xl font-bold text-primary">
              {{ stats.average }}
              <span class="text-sm text-muted">/50</span>
            </p>

            <UProgress
              :model-value="avgProgress"
              class="mt-3"
            />
            <p class="mt-2 text-xs text-muted">
              <span :class="scoreDelta >= 0 ? 'text-primary' : 'text-error'">
                {{ scoreDelta >= 0 ? '+' : '' }}{{ scoreDelta }}
              </span>
              vs previous five cups
            </p>
          </UCard>

          <UCard class="vibe-surface">
            <template #header>
              <p class="text-xs uppercase tracking-wide text-muted">
                Top Rated
              </p>
            </template>

            <p class="text-lg font-semibold text-highlighted truncate">
              {{ stats.topSipp?.roaster ?? '—' }}
            </p>
            <p class="text-xs text-muted mt-1">
              {{ stats.topSipp ? `${stats.topSipp.overall}/50 · ${stats.topSipp.method}` : 'No data yet' }}
            </p>
            <p class="text-xs text-muted mt-2 truncate">
              {{ stats.recentSipp ? `Latest: ${stats.recentSipp.roaster} on ${formatDashboardDate(stats.recentSipp.createdAt)}` : 'No recent sipps yet' }}
            </p>
          </UCard>

          <UCard class="vibe-surface">
            <template #header>
              <p class="text-xs uppercase tracking-wide text-muted">
                Favorite Methods
              </p>
            </template>

            <div
              v-if="stats.methods.length"
              class="space-y-2"
            >
              <NuxtLink
                v-for="item in stats.methods"
                :key="item.method"
                :to="methodFilterLink(item.method)"
                class="flex items-center justify-between rounded-md px-2 py-1 text-sm hover:bg-elevated transition-colors"
              >
                <span class="text-default">{{ item.method }}</span>
                <UBadge
                  :label="String(item.count)"
                  variant="subtle"
                />
              </NuxtLink>
            </div>

            <p
              v-else
              class="text-xs text-muted"
            >
              Add more sipps to see trends.
            </p>
          </UCard>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-3">
          <UCard class="xl:col-span-2 overflow-hidden vibe-surface">
            <template #header>
              <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p class="font-semibold text-highlighted">
                    Weekly Activity
                  </p>
                  <p class="text-xs text-muted mt-1">
                    Daily logging volume with your average score trend in {{ selectedRangeLabel.toLowerCase() }}.
                  </p>
                </div>

                <UBadge
                  :label="selectedRangeLabel"
                  color="primary"
                  variant="subtle"
                />
              </div>
            </template>

            <div
              v-if="status === 'pending' || status === 'idle'"
              class="space-y-3"
            >
              <USkeleton class="h-40 w-full" />
              <USkeleton class="h-10 w-full" />
            </div>

            <div
              v-else-if="!stats.activity.length"
              class="rounded-xl border border-dashed border-default bg-elevated p-6 text-sm text-muted"
            >
              Log a few cups and this chart will start showing your weekly rhythm.
            </div>

            <div
              v-else
              class="space-y-4"
            >
              <div class="overflow-hidden rounded-2xl border border-default bg-elevated px-3 pb-3 pt-4 sm:px-4 sm:pb-4 sm:pt-5">
                <div class="relative flex h-44 items-end gap-1.5 sm:h-48 sm:gap-2">
                  <NuxtLink
                    v-for="(point, index) in stats.activity"
                    :key="point.fullLabel"
                    :to="{ path: '/log', query: { from: point.from, to: point.to } }"
                    class="flex min-w-0 flex-1 flex-col items-center justify-end gap-2 rounded-md px-0.5 py-1 hover:bg-default transition-colors sm:px-1"
                    :title="`Open logs for ${point.fullLabel}`"
                  >
                    <div class="flex h-32 w-full items-end justify-center sm:h-36">
                      <div
                        class="w-full rounded-t-xl bg-cinnamon-wood-200 ring-1 ring-inset ring-cinnamon-wood-300 transition-all"
                        :style="{ height: `${Math.max(12, (point.count / activityMaxCount) * 100)}%` }"
                      />
                    </div>
                    <div class="min-h-8 text-center sm:min-h-10">
                      <p
                        v-if="shouldShowActivityLabel(index, stats.activity.length)"
                        class="font-mono text-[10px] uppercase tracking-[0.08em] text-muted sm:text-[11px]"
                      >
                        {{ point.label }}
                      </p>
                      <p class="hidden text-xs text-default sm:block">
                        {{ point.count }} sip{{ point.count === 1 ? '' : 's' }}
                      </p>
                    </div>
                  </NuxtLink>

                  <svg
                    class="pointer-events-none absolute inset-x-0 top-5 h-32 sm:h-36"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M 0 100 L 100 100"
                      fill="none"
                      stroke="rgba(148,163,184,0.2)"
                      stroke-dasharray="3 3"
                      vector-effect="non-scaling-stroke"
                    />
                    <path
                      :d="activityChartPath"
                      fill="none"
                      stroke="currentColor"
                      class="text-primary"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2.5"
                      vector-effect="non-scaling-stroke"
                    />
                  </svg>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-2 sm:gap-3">
                <div class="rounded-xl border border-default bg-default p-4">
                  <p class="text-xs uppercase tracking-wide text-muted">
                    Last 7 days
                  </p>
                  <p class="mt-2 text-2xl font-semibold text-highlighted">
                    {{ stats.completedThisWeek }}
                  </p>
                </div>
                <div class="rounded-xl border border-default bg-default p-4">
                  <p class="text-xs uppercase tracking-wide text-muted">
                    Recent avg
                  </p>
                  <p class="mt-2 text-2xl font-semibold text-primary">
                    {{ stats.recentAverage }}<span class="text-sm text-muted">/50</span>
                  </p>
                </div>
                <div class="rounded-xl border border-default bg-default p-4">
                  <p class="text-xs uppercase tracking-wide text-muted">
                    Trend
                  </p>
                  <p
                    class="mt-2 text-2xl font-semibold"
                    :class="scoreDelta >= 0 ? 'text-primary' : 'text-error'"
                  >
                    {{ scoreDelta >= 0 ? '+' : '' }}{{ scoreDelta }}
                  </p>
                </div>
              </div>
            </div>
          </UCard>

          <UCard class="vibe-surface">
            <template #header>
              <div>
                <p class="font-semibold text-highlighted">
                  Taste Profile
                </p>
                <p class="text-xs text-muted mt-1">
                  Average scoring across your five cup dimensions.
                </p>
              </div>
            </template>

            <div
              v-if="status === 'pending' || status === 'idle'"
              class="space-y-3"
            >
              <USkeleton class="h-8 w-full" />
              <USkeleton class="h-8 w-full" />
              <USkeleton class="h-8 w-full" />
              <USkeleton class="h-8 w-full" />
            </div>

            <div
              v-else-if="!stats.tasteProfile.length"
              class="text-sm text-muted"
            >
              No scores yet. Add a few ratings to build your flavor profile.
            </div>

            <div
              v-else
              class="space-y-4"
            >
              <div
                v-for="metric in stats.tasteProfile"
                :key="metric.label"
                class="space-y-2"
              >
                <div class="flex items-center justify-between gap-3">
                  <span class="text-sm text-default">{{ metric.label }}</span>
                  <span class="font-mono text-xs text-muted">{{ metric.value.toFixed(1) }}/10</span>
                </div>
                <div class="h-2 overflow-hidden rounded-full bg-elevated ring-1 ring-inset ring-default">
                  <div
                    class="h-full rounded-full bg-primary"
                    :style="{ width: `${(metric.value / 10) * 100}%` }"
                  />
                </div>
              </div>
            </div>
          </UCard>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-3">
          <UCard class="vibe-surface">
            <template #header>
              <div>
                <p class="font-semibold text-highlighted">
                  Brew Method Mix
                </p>
                <p class="text-xs text-muted mt-1">
                  Which brew methods show up most often in your log.
                </p>
              </div>
            </template>

            <div
              v-if="status === 'pending' || status === 'idle'"
              class="space-y-3"
            >
              <USkeleton class="mx-auto h-40 w-40 rounded-full" />
              <USkeleton class="h-10 w-full" />
            </div>

            <div
              v-else-if="!stats.methodMix.length"
              class="text-sm text-muted"
            >
              Add more sipps to see a distribution by brew method.
            </div>

            <div
              v-else
              class="space-y-5"
            >
              <div class="hidden justify-center sm:flex">
                <div
                  class="relative flex size-40 items-center justify-center rounded-full border border-cinnamon-wood-200 bg-cinnamon-wood-50"
                >
                  <div class="flex size-24 flex-col items-center justify-center rounded-full border border-default bg-default text-center shadow-sm">
                    <span class="text-2xl font-semibold text-highlighted">{{ stats.total }}</span>
                    <span class="text-[11px] uppercase tracking-[0.08em] text-muted">sipps</span>
                  </div>
                </div>
              </div>

              <div class="space-y-3">
                <NuxtLink
                  v-for="method in stats.methodMix"
                  :key="method.label"
                  :to="methodFilterLink(method.label)"
                  class="flex items-center justify-between gap-3 rounded-xl border border-default bg-elevated px-3 py-2 hover:bg-elevated transition-colors"
                >
                  <div class="flex min-w-0 items-center gap-3">
                    <span
                      class="size-2.5 shrink-0 rounded-full"
                      :style="{ backgroundColor: method.color }"
                    />
                    <div class="min-w-0">
                      <p class="truncate text-sm font-medium text-default">{{ method.label }}</p>
                      <p class="text-xs text-muted">Avg {{ method.average }}/50</p>
                    </div>
                  </div>
                  <div class="text-right shrink-0">
                    <p class="text-sm font-semibold text-highlighted">{{ method.share }}%</p>
                    <p class="text-xs text-muted">{{ method.count }} cups</p>
                  </div>
                </NuxtLink>
              </div>
            </div>
          </UCard>

          <UCard class="vibe-surface">
            <template #header>
              <div>
                <p class="font-semibold text-highlighted">
                  Top Origins
                </p>
                <p class="text-xs text-muted mt-1">
                  Origins earning your highest average scores.
                </p>
              </div>
            </template>

            <div
              v-if="status === 'pending' || status === 'idle'"
              class="space-y-3"
            >
              <USkeleton class="h-16 w-full" />
              <USkeleton class="h-16 w-full" />
              <USkeleton class="h-16 w-full" />
            </div>

            <div
              v-else-if="!stats.topOrigins.length"
              class="text-sm text-muted"
            >
              Once you log coffees from a few origins, they will rank here.
            </div>

            <div
              v-else
              class="space-y-3"
            >
              <NuxtLink
                v-for="(origin, index) in stats.topOrigins"
                :key="origin.origin"
                :to="originFilterLink(origin.origin)"
                class="block rounded-xl border border-default bg-elevated p-4 hover:bg-elevated transition-colors"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="min-w-0">
                    <p class="text-sm text-muted">#{{ index + 1 }}</p>
                    <p class="truncate text-lg font-semibold text-highlighted">{{ origin.origin }}</p>
                  </div>
                  <div class="text-right shrink-0">
                    <p class="text-xl font-semibold text-primary">{{ origin.average }}</p>
                    <p class="text-xs text-muted">avg /50</p>
                  </div>
                </div>
                <p class="mt-3 text-xs text-muted">
                  {{ origin.count }} logged cup{{ origin.count === 1 ? '' : 's' }}
                </p>
              </NuxtLink>
            </div>
          </UCard>

          <UCard class="vibe-surface">
            <template #header>
              <p class="font-semibold text-highlighted">
                Quick Actions
              </p>
            </template>

            <div class="space-y-2">
              <UButton
                label="Open Insights"
                icon="i-lucide-line-chart"
                color="neutral"
                variant="soft"
                block
                to="/insights"
              />
              <UButton
                label="Open SippLog"
                icon="i-lucide-scroll-text"
                color="neutral"
                variant="soft"
                block
                to="/log"
              />
              <UButton
                label="Open SippScore"
                icon="i-lucide-star"
                color="neutral"
                variant="soft"
                block
                to="/score"
              />
              <UButton
                label="Manage Wanna Sipp"
                icon="i-lucide-list-todo"
                color="neutral"
                variant="soft"
                block
                to="/wanna-sipp"
              />
            </div>

            <div class="mt-5 rounded-xl border border-default bg-elevated p-4">
              <p class="text-xs uppercase tracking-wide text-muted">
                Dashboard reads
              </p>
              <ul class="mt-3 space-y-2 text-sm text-default">
                <li>
                  {{ stats.methodMix[0] ? `${stats.methodMix[0].label} is your most-used brew method.` : 'Your preferred brew method will show here.' }}
                </li>
                <li>
                  {{ stats.topOrigins[0] ? `${stats.topOrigins[0].origin} is currently your top-performing origin.` : 'Your best origin will show here after a few logs.' }}
                </li>
                <li>
                  {{ stats.recentAverage ? `Your last five cups are averaging ${stats.recentAverage}/50.` : 'Recent average will appear after your first few cups.' }}
                </li>
              </ul>
            </div>
          </UCard>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-2">
          <UCard class="xl:col-span-2 vibe-surface">
            <template #header>
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p class="font-semibold text-highlighted">
                    Recent Activity
                  </p>
                  <p class="text-xs text-muted">
                    Your latest logged cups
                  </p>
                </div>

                <UButton
                  label="Open SippLog"
                  color="neutral"
                  variant="ghost"
                  class="w-full sm:w-auto"
                  to="/log"
                />
              </div>
            </template>

            <div
              v-if="status === 'pending' || status === 'idle'"
              class="space-y-2"
            >
              <USkeleton class="h-10 w-full" />
              <USkeleton class="h-10 w-full" />
              <USkeleton class="h-10 w-full" />
            </div>

            <div
              v-else-if="!stats.recent.length"
              class="text-sm text-muted"
            >
              No sipps yet. Start your first log.
            </div>

            <div
              v-else
              class="space-y-2"
            >
              <div
                v-for="sipp in stats.recent"
                :key="sipp.id"
                class="flex items-center justify-between rounded-lg border border-default p-3"
              >
                <div class="min-w-0">
                  <p class="font-medium text-highlighted truncate">
                    {{ sipp.roaster }}
                  </p>
                  <p class="text-xs text-muted truncate">
                    {{ sipp.origin }} · {{ sipp.method }} · {{ formatDashboardDate(sipp.created_at) }}
                  </p>
                </div>

                <div class="text-right shrink-0 pl-3">
                  <span class="font-semibold text-primary">{{ sipp.overall }}</span>
                  <span class="text-xs text-muted">/50</span>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
