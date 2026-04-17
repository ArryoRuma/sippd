<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()

const newRoaster = ref('')
const newNotes = ref('')
const adding = ref(false)

const { data: items, refresh } = await useAsyncData('wanna-sipps', async () => {
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

  const { error } = await supabase.from('wanna_sipps').insert({
    user_id: user.value.id,
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
</script>

<template>
  <div class="p-6 lg:p-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-highlighted">
          Wanna Sipp
        </h1>
        <p class="text-sm text-muted">
          Coffees you want to try
        </p>
      </div>
      <UButton
        label="Add"
        icon="i-lucide-plus"
        color="primary"
        @click="adding = !adding"
      />
    </div>

    <div
      v-if="adding"
      class="mb-6 p-4 rounded-lg border border-default bg-elevated/50 space-y-3"
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

    <div
      v-if="!items?.length && !adding"
      class="text-center py-16"
    >
      <UIcon
        name="i-lucide-list-todo"
        class="size-12 text-muted mb-4"
      />
      <p class="text-muted">
        Your wishlist is empty. Add coffees you want to try!
      </p>
    </div>

    <div
      v-else
      class="space-y-2"
    >
      <div
        v-for="item in items"
        :key="item.id"
        class="flex items-center gap-3 p-3 rounded-lg border border-default bg-elevated/50"
        :class="item.completed ? 'opacity-50' : ''"
      >
        <UCheckbox
          :model-value="item.completed"
          @update:model-value="toggleCompleted(item.id, item.completed)"
        />

        <div class="flex-1 min-w-0">
          <span
            class="font-medium"
            :class="item.completed ? 'line-through text-muted' : 'text-highlighted'"
          >
            {{ item.roaster }}
          </span>
          <p
            v-if="item.notes"
            class="text-xs text-muted mt-0.5 truncate"
          >
            {{ item.notes }}
          </p>
        </div>

        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="xs"
          square
          @click="deleteItem(item.id)"
        />
      </div>
    </div>
  </div>
</template>
