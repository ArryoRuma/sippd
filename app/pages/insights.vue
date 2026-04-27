<!-- insights.vue
     Deep-dive analytics panel. Shares the same Supabase RPC functions as
     dashboard.vue but surfaces more detail: full method distribution, full
     taste profile, and top origins. The `range` ref controls all queries. -->
<script setup lang="ts">
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'dashboard' })

type DashboardSummaryRow = Database['public']['Functions']['dashboard_summary']['Returns'][number]
type DashboardActivityRow = Database['public']['Functions']['dashboard_activity']['Returns'][number]
type DashboardMethodMixRow = Database['public']['Functions']['dashboard_method_mix']['Returns'][number]
type DashboardTasteProfileRow = Database['public']['Functions']['dashboard_taste_profile']['Returns'][number]
type DashboardTopOriginsRow = Database['public']['Functions']['dashboard_top_origins']['Returns'][number]

type InsightRange = '7d' | '30d' | '90d' | 'all'
type InsightActivityPoint = {
  label: string
  fullLabel: string
  count: number
  average: number
  from: string
  to: string
}
type InsightMethod = {
  label: string
  count: number
  average: number
  share: number
  color: string
}
type InsightTaste = {
  label: string
  value: number
}
type InsightOrigin = {
  origin: string
  count: number
  average: number
}
type InsightsData = {
  total: number
  average: number
  recentAverage: number
  previousAverage: number
  activity: InsightActivityPoint[]
  methods: InsightMethod[]
  taste: InsightTaste[]
  origins: InsightOrigin[]
}

const emptyInsightsData: InsightsData = {
  total: 0,
  average: 0,
  recentAverage: 0,
  previousAverage: 0,
  activity: [],
  methods: [],
  taste: [],
  origins: []
}

const range = ref<InsightRange>('30d')
const supabase = useSupabaseClient<Database>()
const toast = useToast()
const loadError = ref<string | null>(null)
const methodPalette = ['#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd']

const rangeOptions = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: 'All time', value: 'all' }
]

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

// getRangeBounds converts a user-facing range label into concrete ISO timestamps
// that are passed as p_from / p_to params to every RPC call.
function getRangeBounds(selected: InsightRange): { from: string | null, to: string | null, days: number } {
  const now = new Date()

  if (selected === 'all') {
    return { from: null, to: now.toISOString(), days: 30 }
  }

  const days = selected === '7d' ? 7 : selected === '30d' ? 30 : 90
  const from = new Date(now)
  from.setDate(now.getDate() - (days - 1))
  from.setHours(0, 0, 0, 0)

  return {
    from: from.toISOString(),
    to: now.toISOString(),
    days
  }
}

function mapActivity(rows: DashboardActivityRow[]): InsightActivityPoint[] {
  return rows.map((row) => {
    const date = new Date(`${row.day_date}T00:00:00.000Z`)
    const from = new Date(`${row.day_date}T00:00:00.000Z`)
    const to = new Date(from)
    to.setUTCDate(from.getUTCDate() + 1)

    return {
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullLabel: date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
      count: toNumber(row.count),
      average: toNumber(row.average_score),
      from: from.toISOString(),
      to: to.toISOString()
    }
  })
}

function mapMethods(rows: DashboardMethodMixRow[]): InsightMethod[] {
  return rows.map((row, index) => ({
    label: row.method,
    count: toNumber(row.count),
    average: toNumber(row.average_score),
    share: toNumber(row.share),
    color: methodPalette[index] ?? '#bfdbfe'
  }))
}

function mapTaste(row: DashboardTasteProfileRow | null): InsightTaste[] {
  if (!row) return []

  return [
    { label: 'Aroma', value: toNumber(row.aroma) },
    { label: 'Flavor', value: toNumber(row.flavor) },
    { label: 'Acidity', value: toNumber(row.acidity) },
    { label: 'Body', value: toNumber(row.body) },
    { label: 'Aftertaste', value: toNumber(row.aftertaste) }
  ]
}

function mapOrigins(rows: DashboardTopOriginsRow[]): InsightOrigin[] {
  return rows.map(row => ({
    origin: row.origin,
    count: toNumber(row.count),
    average: toNumber(row.average_score)
  }))
}

// The useAsyncData key is dynamic so that changing `range` creates a new
// cache entry rather than reusing a stale one from a different time window.
const asyncInsights = await useAsyncData(
  () => `insights-${range.value}`,
  async (): Promise<InsightsData> => {
    loadError.value = null

    const bounds = getRangeBounds(range.value)
    const [summaryRes, activityRes, methodRes, tasteRes, originRes] = await Promise.all([
      supabase.rpc('dashboard_summary', { p_from: bounds.from, p_to: bounds.to }),
      supabase.rpc('dashboard_activity', { p_days: bounds.days }),
      supabase.rpc('dashboard_method_mix', { p_limit: 5, p_from: bounds.from, p_to: bounds.to }),
      supabase.rpc('dashboard_taste_profile', { p_from: bounds.from, p_to: bounds.to }),
      supabase.rpc('dashboard_top_origins', { p_limit: 5, p_from: bounds.from, p_to: bounds.to })
    ])

    const firstError = summaryRes.error ?? activityRes.error ?? methodRes.error ?? tasteRes.error ?? originRes.error

    if (firstError) {
      loadError.value = firstError.message
      toast.add({ title: 'Could not load insights', description: firstError.message, color: 'error' })
      return emptyInsightsData
    }

    const summary = summaryRes.data?.[0] as DashboardSummaryRow | undefined

    return {
      total: toNumber(summary?.total),
      average: toNumber(summary?.average_score),
      recentAverage: toNumber(summary?.recent_average),
      previousAverage: toNumber(summary?.previous_average),
      activity: mapActivity(activityRes.data ?? []),
      methods: mapMethods(methodRes.data ?? []),
      taste: mapTaste((tasteRes.data?.[0] as DashboardTasteProfileRow | undefined) ?? null),
      origins: mapOrigins(originRes.data ?? [])
    }
  },
  {
    watch: [range],
    default: () => emptyInsightsData
  }
)

const insights = computed(() => asyncInsights.data.value ?? emptyInsightsData)
const status = asyncInsights.status

const scoreDelta = computed(() => {
  return insights.value.recentAverage - insights.value.previousAverage
})

const activityMaxCount = computed(() => {
  return Math.max(...insights.value.activity.map(point => point.count), 1)
})

const selectedBounds = computed(() => {
  const bounds = getRangeBounds(range.value)
  return {
    from: bounds.from ?? undefined,
    to: bounds.to ?? undefined
  }
})

// toLogWithRange builds a /log query object that pre-filters the log page
// to the same date range currently selected in insights, enabling drill-through.
function toLogWithRange(extra: Record<string, string | undefined> = {}) {
  return {
    path: '/log',
    query: {
      ...selectedBounds.value,
      ...extra
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
  <UDashboardPanel id="insights-page">
    <template #header>
      <UDashboardNavbar title="Insights">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <div class="flex items-center gap-2">
            <USelect
              v-model="range"
              :items="rangeOptions"
              value-key="value"
              class="w-28 sm:w-40"
            />
            <UButton
              label="Dashboard"
              icon="i-lucide-layout-dashboard"
              color="neutral"
              variant="soft"
              to="/dashboard"
              class="hidden sm:flex"
            />
            <UButton
              icon="i-lucide-layout-dashboard"
              color="neutral"
              variant="ghost"
              to="/dashboard"
              aria-label="Back to Dashboard"
              class="sm:hidden"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-4 lg:p-6 space-y-6">
        <UAlert
          v-if="loadError"
          color="error"
          variant="soft"
          icon="i-lucide-triangle-alert"
          title="Could not load insights"
          :description="loadError"
        />

        <div class="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <UCard>
            <p class="text-xs uppercase tracking-wide text-muted">
              Total logged
            </p>
            <p class="mt-2 text-3xl font-semibold text-highlighted">
              {{ insights.total }}
            </p>
          </UCard>
          <UCard>
            <p class="text-xs uppercase tracking-wide text-muted">
              Average score
            </p>
            <p class="mt-2 text-3xl font-semibold text-primary">
              {{ insights.average }}<span class="text-sm text-muted">/50</span>
            </p>
          </UCard>
          <UCard>
            <p class="text-xs uppercase tracking-wide text-muted">
              Recent avg
            </p>
            <p class="mt-2 text-3xl font-semibold text-highlighted">
              {{ insights.recentAverage }}<span class="text-sm text-muted">/50</span>
            </p>
          </UCard>
          <UCard>
            <p class="text-xs uppercase tracking-wide text-muted">
              Trend
            </p>
            <p
              class="mt-2 text-3xl font-semibold"
              :class="scoreDelta >= 0 ? 'text-primary' : 'text-error'"
            >
              {{ scoreDelta >= 0 ? '+' : '' }}{{ scoreDelta }}
            </p>
          </UCard>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <UCard class="xl:col-span-2">
            <template #header>
              <p class="font-semibold text-highlighted">
                Activity & Score Trend
              </p>
            </template>

            <div
              v-if="status === 'pending' || status === 'idle'"
              class="space-y-3"
            >
              <USkeleton class="h-56 w-full" />
            </div>

            <div
              v-else-if="!insights.activity.length"
              class="text-sm text-muted"
            >
              Not enough data in this range yet.
            </div>

            <div
              v-else
              class="rounded-2xl border border-default bg-elevated/50 px-4 py-5"
            >
              <div class="relative flex h-56 items-end gap-1.5 sm:gap-2">
                <div
                  v-for="(point, index) in insights.activity"
                  :key="point.fullLabel"
                  class="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
                >
                  <NuxtLink
                    :to="{ path: '/log', query: { from: point.from, to: point.to } }"
                    class="flex w-full flex-col items-center gap-2 rounded-md px-0.5 py-1 hover:bg-default/50 transition-colors sm:px-1"
                    :title="`Open logs for ${point.fullLabel}`"
                  >
                    <div class="flex h-36 w-full items-end justify-center">
                      <div
                        class="w-full rounded-t-xl bg-primary/20 ring-1 ring-inset ring-primary/15"
                        :style="{ height: `${Math.max(12, (point.count / activityMaxCount) * 100)}%` }"
                      />
                    </div>
                    <p
                      v-if="shouldShowActivityLabel(index, insights.activity.length)"
                      class="font-mono text-[10px] uppercase tracking-[0.08em] text-muted sm:text-[11px]"
                    >
                      {{ point.label }}
                    </p>
                  </NuxtLink>
                </div>

                <svg
                  class="pointer-events-none absolute inset-x-0 top-4 h-36"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <path
                    :d="insights.activity.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i * (100 / Math.max(insights.activity.length - 1, 1))).toFixed(2)} ${(100 - ((p.average / 50) * 100)).toFixed(2)}`).join(' ')"
                    fill="none"
                    stroke="#2563eb"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    vector-effect="non-scaling-stroke"
                  />
                </svg>
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <p class="font-semibold text-highlighted">
                Taste Profile
              </p>
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
              v-else-if="!insights.taste.length"
              class="text-sm text-muted"
            >
              Taste profile is empty for this range.
            </div>

            <div
              v-else
              class="space-y-4"
            >
              <div
                v-for="metric in insights.taste"
                :key="metric.label"
                class="space-y-2"
              >
                <div class="flex items-center justify-between">
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

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <UCard>
            <template #header>
              <p class="font-semibold text-highlighted">
                Brew Method Breakdown
              </p>
            </template>

            <div
              v-if="status === 'pending' || status === 'idle'"
              class="space-y-3"
            >
              <USkeleton class="h-14 w-full" />
              <USkeleton class="h-14 w-full" />
              <USkeleton class="h-14 w-full" />
            </div>

            <div
              v-else-if="!insights.methods.length"
              class="text-sm text-muted"
            >
              Method breakdown is empty for this range.
            </div>

            <div
              v-else
              class="space-y-3"
            >
              <div
                v-for="method in insights.methods"
                :key="method.label"
                class="rounded-xl border border-default bg-elevated/40 p-3"
              >
                <NuxtLink
                  :to="toLogWithRange({ method: method.label })"
                  class="block rounded-md -m-1 p-1 hover:bg-default/50 transition-colors"
                >
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2 min-w-0">
                      <span
                        class="size-2.5 rounded-full"
                        :style="{ backgroundColor: method.color }"
                      />
                      <p class="truncate text-sm font-medium text-default">{{ method.label }}</p>
                    </div>
                    <p class="text-sm font-semibold text-highlighted">{{ method.share }}%</p>
                  </div>
                  <p class="mt-2 text-xs text-muted">{{ method.count }} cups · Avg {{ method.average }}/50</p>
                </NuxtLink>
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <p class="font-semibold text-highlighted">
                Top Origins
              </p>
            </template>

            <div
              v-if="status === 'pending' || status === 'idle'"
              class="space-y-3"
            >
              <USkeleton class="h-14 w-full" />
              <USkeleton class="h-14 w-full" />
              <USkeleton class="h-14 w-full" />
            </div>

            <div
              v-else-if="!insights.origins.length"
              class="text-sm text-muted"
            >
              No origin rankings in this range yet.
            </div>

            <div
              v-else
              class="space-y-3"
            >
              <div
                v-for="(origin, index) in insights.origins"
                :key="origin.origin"
                class="rounded-xl border border-default bg-elevated/40 p-3"
              >
                <NuxtLink
                  :to="toLogWithRange({ origin: origin.origin })"
                  class="block rounded-md -m-1 p-1 hover:bg-default/50 transition-colors"
                >
                  <div class="flex items-center justify-between gap-3">
                    <div class="min-w-0">
                      <p class="text-xs text-muted">#{{ index + 1 }}</p>
                      <p class="truncate text-base font-semibold text-highlighted">{{ origin.origin }}</p>
                    </div>
                    <div class="text-right shrink-0">
                      <p class="text-lg font-semibold text-primary">{{ origin.average }}</p>
                      <p class="text-xs text-muted">avg /50</p>
                    </div>
                  </div>
                  <p class="mt-1 text-xs text-muted">{{ origin.count }} cups</p>
                </NuxtLink>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
