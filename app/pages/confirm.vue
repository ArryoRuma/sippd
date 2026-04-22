<script setup lang="ts">
definePageMeta({ layout: false })

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const route = useRoute()

const errorMessage = computed(() => {
  const raw = route.query.error_description ?? route.query.error

  if (typeof raw !== 'string' || raw.length === 0) {
    return ''
  }

  return decodeURIComponent(raw)
})

async function routeAuthenticatedUser() {
  if (!user.value) {
    return
  }

  const { data } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.value.id)
    .maybeSingle()

  return navigateTo(data?.onboarding_completed ? '/dashboard' : '/onboarding')
}

watch(user, routeAuthenticatedUser, { immediate: true })
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-default px-4">
    <div class="w-full max-w-md rounded-2xl border border-default bg-elevated/40 p-6 text-center">
      <p class="font-mono text-xs uppercase tracking-[0.12em] text-primary">
        Account confirmation
      </p>

      <p
        v-if="errorMessage"
        class="mt-4 text-sm text-error"
      >
        {{ errorMessage }}
      </p>

      <p
        v-else
        class="mt-4 text-sm text-muted"
      >
        Finishing your sign-in. If this takes too long, return to login and try again.
      </p>

      <div class="mt-6 flex flex-col gap-3">
        <UButton
          label="Go to login"
          color="neutral"
          variant="soft"
          to="/login"
          block
        />
        <UButton
          label="Create account"
          color="primary"
          to="/signup"
          block
        />
      </div>
    </div>
  </div>
</template>
