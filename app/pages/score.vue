<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const supabase = useSupabaseClient()
const toast = useToast()

const { data: sipps } = await useAsyncData('sipps-ranked', async () => {
  const { data, error } = await supabase
    .from('sipps')
    .select('*')
    .order('overall', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    toast.add({ title: 'Error loading scores', description: error.message, color: 'error' })
    return []
  }
  return data
})

function getRankIcon(index: number) {
  if (index === 0) return 'i-lucide-trophy'
  if (index === 1) return 'i-lucide-medal'
  if (index === 2) return 'i-lucide-award'
  return null
}

function getRankColor(index: number) {
  if (index === 0) return 'text-yellow-500'
  if (index === 1) return 'text-gray-400'
  if (index === 2) return 'text-amber-700'
  return 'text-muted'
}
</script>

<template>
  <div class="p-6 lg:p-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-highlighted">
        SippScore
      </h1>
      <p class="text-sm text-muted">
        Your top-rated coffees, ranked
      </p>
    </div>

    <div v-if="!sipps?.length" class="text-center py-16">
      <UIcon name="i-lucide-star" class="size-12 text-muted mb-4" />
      <p class="text-muted">
        No scores yet. Start rating your coffees in SippLog!
      </p>
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="(sipp, index) in sipps"
        :key="sipp.id"
        class="flex items-center gap-4 p-4 rounded-lg border border-default bg-elevated/50"
        :class="index < 3 ? 'ring-1 ring-primary/20' : ''"
      >
        <div class="flex items-center justify-center w-8 shrink-0">
          <UIcon
            v-if="getRankIcon(index)"
            :name="getRankIcon(index)!"
            :class="['size-5', getRankColor(index)]"
          />
          <span v-else class="text-sm font-mono text-muted">{{ index + 1 }}</span>
        </div>

        <div class="flex-1 min-w-0">
          <div class="font-semibold text-highlighted truncate">
            {{ sipp.roaster }}
          </div>
          <div class="text-sm text-muted">
            {{ sipp.origin }} · {{ sipp.method }}
          </div>
        </div>

        <div class="text-right shrink-0">
          <span class="text-xl font-bold text-primary">{{ sipp.overall }}</span>
          <span class="text-xs text-muted">/50</span>
        </div>
      </div>
    </div>
  </div>
</template>
