<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const { data: stats } = await useAsyncData('dashboard-stats', async () => {
  const { data: sipps } = await supabase
    .from('sipps')
    .select('*')
    .order('overall', { ascending: false })

  if (!sipps || sipps.length === 0) {
    return { total: 0, average: 0, topSipp: null, recentSipp: null }
  }

  const total = sipps.length
  const average = Math.round(sipps.reduce((sum: number, s: any) => sum + s.overall, 0) / total)
  const topSipp = sipps[0]
  const recentSipp = [...sipps].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

  return { total, average, topSipp, recentSipp }
})
</script>

<template>
  <div class="p-6 lg:p-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-highlighted">
        Dashboard
      </h1>
      <p class="text-sm text-muted">
        Welcome back{{ user?.email ? `, ${user.email.split('@')[0]}` : '' }}
      </p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="p-4 rounded-lg border border-default bg-elevated/50">
        <p class="text-xs text-muted uppercase tracking-wide">
          Total Sipps
        </p>
        <p class="text-2xl font-bold text-highlighted mt-1">
          {{ stats?.total ?? 0 }}
        </p>
      </div>
      <div class="p-4 rounded-lg border border-default bg-elevated/50">
        <p class="text-xs text-muted uppercase tracking-wide">
          Avg Score
        </p>
        <p class="text-2xl font-bold text-primary mt-1">
          {{ stats?.average ?? 0 }}<span class="text-sm text-muted">/50</span>
        </p>
      </div>
      <div class="p-4 rounded-lg border border-default bg-elevated/50">
        <p class="text-xs text-muted uppercase tracking-wide">
          Top Rated
        </p>
        <p class="text-lg font-bold text-highlighted mt-1 truncate">
          {{ stats?.topSipp?.roaster ?? '—' }}
        </p>
        <p v-if="stats?.topSipp" class="text-xs text-muted">
          {{ stats.topSipp.overall }}/50
        </p>
      </div>
      <div class="p-4 rounded-lg border border-default bg-elevated/50">
        <p class="text-xs text-muted uppercase tracking-wide">
          Most Recent
        </p>
        <p class="text-lg font-bold text-highlighted mt-1 truncate">
          {{ stats?.recentSipp?.roaster ?? '—' }}
        </p>
        <p v-if="stats?.recentSipp" class="text-xs text-muted">
          {{ stats.recentSipp.origin }}
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <UButton
        label="SippLog"
        icon="i-lucide-scroll-text"
        color="neutral"
        variant="soft"
        size="lg"
        block
        to="/log"
      />
      <UButton
        label="SippScore"
        icon="i-lucide-star"
        color="neutral"
        variant="soft"
        size="lg"
        block
        to="/score"
      />
      <UButton
        label="Wanna Sipp"
        icon="i-lucide-list-todo"
        color="neutral"
        variant="soft"
        size="lg"
        block
        to="/wanna-sipp"
      />
    </div>
  </div>
</template>

