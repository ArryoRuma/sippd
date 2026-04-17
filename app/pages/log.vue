<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const supabase = useSupabaseClient()
const toast = useToast()

const slideoverOpen = ref(false)
const selectedSipp = ref<any>(null)
const viewMode = ref(false)

const { data: sipps, refresh } = await useAsyncData('sipps', async () => {
  const { data, error } = await supabase
    .from('sipps')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    toast.add({ title: 'Error loading sipps', description: error.message, color: 'error' })
    return []
  }
  return data
})

function openNew() {
  selectedSipp.value = null
  viewMode.value = false
  slideoverOpen.value = true
}

function openView(sipp: any) {
  selectedSipp.value = sipp
  viewMode.value = true
  slideoverOpen.value = true
}

async function deleteSipp(id: string) {
  const { error } = await supabase.from('sipps').delete().eq('id', id)
  if (error) {
    toast.add({ title: 'Error deleting sipp', description: error.message, color: 'error' })
  } else {
    toast.add({ title: 'Sipp deleted', color: 'success' })
    refresh()
  }
}

function onSaved() {
  refresh()
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
  <div class="p-6 lg:p-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-highlighted">
          SippLog
        </h1>
        <p class="text-sm text-muted">
          Your coffee rating history
        </p>
      </div>
      <UButton
        label="New Sipp"
        icon="i-lucide-plus"
        color="primary"
        @click="openNew"
      />
    </div>

    <div
      v-if="!sipps?.length"
      class="text-center py-16"
    >
      <UIcon
        name="i-lucide-coffee"
        class="size-12 text-muted mb-4"
      />
      <p class="text-muted">
        No sipps yet. Log your first coffee!
      </p>
    </div>

    <div
      v-else
      class="space-y-3"
    >
      <div
        v-for="sipp in sipps"
        :key="sipp.id"
        class="flex items-center justify-between p-4 rounded-lg border border-default bg-elevated/50 hover:bg-elevated transition-colors cursor-pointer"
        @click="openView(sipp)"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-highlighted truncate">{{ sipp.roaster }}</span>
            <UBadge
              :label="sipp.method"
              variant="subtle"
              size="xs"
            />
          </div>
          <div class="text-sm text-muted mt-0.5">
            {{ sipp.origin }} · {{ sipp.roast_type }}
          </div>
        </div>

        <div class="flex items-center gap-4 shrink-0">
          <div class="text-right">
            <span class="text-lg font-bold text-primary">{{ sipp.overall }}</span>
            <span class="text-xs text-muted">/50</span>
          </div>
          <span class="text-xs text-muted hidden sm:block">{{ formatDate(sipp.created_at) }}</span>
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="xs"
            square
            @click.stop="deleteSipp(sipp.id)"
          />
        </div>
      </div>
    </div>

    <USlideover v-model:open="slideoverOpen">
      <template #content>
        <SippSlideover
          :sipp="selectedSipp"
          :readonly="viewMode"
          @close="slideoverOpen = false"
          @saved="onSaved"
        />
      </template>
    </USlideover>
  </div>
</template>
