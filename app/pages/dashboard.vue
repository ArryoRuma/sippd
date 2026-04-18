<script setup lang="ts">
import { useDashboardTable } from '~/composables/useDashboardTable'
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'dashboard' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { formatDashboardDate } = useDashboardTable()

const { data: stats, status } = await useAsyncData('dashboard-stats', async () => {
  const { data: sipps } = await supabase
    .from('sipps')
    .select('*')
    .order('overall', { ascending: false })

  if (!sipps || sipps.length === 0) {
    return {
      total: 0,
      average: 0,
      topSipp: null,
      recentSipp: null,
      recent: [],
      completedThisWeek: 0,
      methods: []
    }
  }

  const total = sipps.length
  const average = Math.round(sipps.reduce((sum: number, s) => sum + s.overall, 0) / total)
  const topSipp = sipps[0]
  const recentSipp = [...sipps].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
  const recent = [...sipps]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
  const completedThisWeek = sipps.filter(sipp => new Date(sipp.created_at).getTime() >= weekAgo).length

  const methodMap = new Map<string, number>()
  for (const sipp of sipps) {
    methodMap.set(sipp.method, (methodMap.get(sipp.method) ?? 0) + 1)
  }

  const methods = Array
    .from(methodMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([method, count]) => ({ method, count }))

  return { total, average, topSipp, recentSipp, recent, completedThisWeek, methods }
})

const avgProgress = computed(() => {
  return Math.min(100, Math.round(((stats.value?.average ?? 0) / 50) * 100))
})

type Sipp = Database['public']['Tables']['sipps']['Row']
</script>

<template>
  <UDashboardPanel id="dashboard-home">
    <template #header>
      <UDashboardNavbar title="Dashboard">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            label="Log New Sipp"
            icon="i-lucide-plus"
            color="primary"
            to="/log"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-4 lg:p-6 space-y-6">
        <div>
          <h2 class="text-2xl font-bold text-highlighted">
            Welcome back{{ user?.email ? `, ${user.email.split('@')[0]}` : '' }}
          </h2>
          <p class="text-sm text-muted mt-1">
            Track trends, review your best cups, and keep your next brews queued up.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <UCard>
            <template #header>
              <p class="text-xs uppercase tracking-wide text-muted">
                Total Sipps
              </p>
            </template>

            <p class="text-3xl font-bold text-highlighted">
              {{ stats?.total ?? 0 }}
            </p>
            <p class="text-xs text-muted mt-1">
              {{ stats?.completedThisWeek ?? 0 }} logged this week
            </p>
          </UCard>

          <UCard>
            <template #header>
              <p class="text-xs uppercase tracking-wide text-muted">
                Average Score
              </p>
            </template>

            <p class="text-3xl font-bold text-primary">
              {{ stats?.average ?? 0 }}
              <span class="text-sm text-muted">/50</span>
            </p>

            <UProgress
              :model-value="avgProgress"
              class="mt-3"
            />
          </UCard>

          <UCard>
            <template #header>
              <p class="text-xs uppercase tracking-wide text-muted">
                Top Rated
              </p>
            </template>

            <p class="text-lg font-semibold text-highlighted truncate">
              {{ stats?.topSipp?.roaster ?? '—' }}
            </p>
            <p class="text-xs text-muted mt-1">
              {{ stats?.topSipp ? `${stats.topSipp.overall}/50 · ${stats.topSipp.method}` : 'No data yet' }}
            </p>
          </UCard>

          <UCard>
            <template #header>
              <p class="text-xs uppercase tracking-wide text-muted">
                Favorite Methods
              </p>
            </template>

            <div
              v-if="stats?.methods?.length"
              class="space-y-2"
            >
              <div
                v-for="item in stats.methods"
                :key="item.method"
                class="flex items-center justify-between text-sm"
              >
                <span class="text-default">{{ item.method }}</span>
                <UBadge
                  :label="String(item.count)"
                  variant="subtle"
                />
              </div>
            </div>

            <p
              v-else
              class="text-xs text-muted"
            >
              Add more sipps to see trends.
            </p>
          </UCard>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <UCard class="xl:col-span-2">
            <template #header>
              <div class="flex items-center justify-between gap-3">
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
              v-else-if="!stats?.recent?.length"
              class="text-sm text-muted"
            >
              No sipps yet. Start your first log.
            </div>

            <div
              v-else
              class="space-y-2"
            >
              <div
                v-for="sipp in stats.recent as Sipp[]"
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

          <UCard>
            <template #header>
              <p class="font-semibold text-highlighted">
                Quick Actions
              </p>
            </template>

            <div class="space-y-2">
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
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
