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
  <div
    class="flex items-center rounded-xl border border-default/70 bg-elevated/75 py-1.5"
    :class="collapsed ? 'justify-center px-1.5' : 'gap-2 px-2'"
  >
    <UAvatar
      :label="user?.email?.charAt(0).toUpperCase()"
      size="sm"
      class="shrink-0 ring-1 ring-warning/30 bg-warning/10 text-[color:var(--vibe-accent-ink)]"
    />
    <template v-if="!collapsed">
      <span class="flex-1 truncate text-xs text-cinnamon-wood-700">
        {{ user?.email }}
      </span>
      <UButton
        icon="i-lucide-settings-2"
        color="neutral"
        variant="ghost"
        size="xs"
        square
        class="rounded-lg text-muted hover:bg-warning/12 hover:text-primary"
        aria-label="Settings"
        to="/settings"
      />
      <UButton
        icon="i-lucide-log-out"
        color="neutral"
        variant="ghost"
        size="xs"
        square
        class="rounded-lg text-muted hover:bg-warning/12 hover:text-primary"
        aria-label="Sign out"
        @click="handleLogout"
      />
    </template>
  </div>
</template>
