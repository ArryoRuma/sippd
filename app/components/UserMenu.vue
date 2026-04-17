<script setup lang="ts">
defineProps<{
  collapsed?: boolean
}>()

const supabase = useSupabaseClient()
const user = useSupabaseUser()

async function handleLogout() {
  await supabase.auth.signOut()
  navigateTo('/')
}
</script>

<template>
  <div class="flex items-center" :class="collapsed ? 'justify-center' : 'gap-2 px-2'">
    <UAvatar
      :label="user?.email?.charAt(0).toUpperCase()"
      size="sm"
      class="shrink-0"
    />
    <template v-if="!collapsed">
      <span class="flex-1 truncate text-xs text-muted">
        {{ user?.email }}
      </span>
      <UButton
        icon="i-lucide-log-out"
        color="neutral"
        variant="ghost"
        size="xs"
        square
        aria-label="Sign out"
        @click="handleLogout"
      />
    </template>
  </div>
</template>
