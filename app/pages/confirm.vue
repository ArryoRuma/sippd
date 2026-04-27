<!-- confirm.vue
     Landing page for the Supabase email-confirmation link.
     Reads any error from the URL query string, then redirects the
     authenticated user to onboarding or the dashboard based on their profile. -->
<script setup lang="ts">
// No layout wrapper -- this page owns its full-screen shell.
definePageMeta({ layout: false })

// useSupabaseUser() returns a reactive ref that updates whenever auth state changes.
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const route = useRoute()

// Supabase appends error details as percent-encoded query params after a failed
// confirmation. Decode and surface them so the user knows what went wrong.
const errorMessage = computed(() => {
  const raw = route.query.error_description ?? route.query.error

  if (typeof raw !== 'string' || raw.length === 0) {
    return ''
  }

  return decodeURIComponent(raw)
})

// Once the user is confirmed and a session exists, check whether they have
// completed onboarding and send them to the right destination.
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

// { immediate: true } runs the callback right away so a user who arrives
// already authenticated is redirected without waiting for a state change.
watch(user, routeAuthenticatedUser, { immediate: true })
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-default px-4">
    <div class="w-full max-w-md rounded-2xl border border-default bg-elevated/40 p-6 text-center">
      <!-- Eyebrow label: font-mono (IBM Plex Mono) + uppercase tracking matches the brand system. -->
      <p class="font-mono text-xs uppercase tracking-[0.12em] text-primary">
        Account confirmation
      </p>

      <!-- Show the decoded error message when present, otherwise show a neutral waiting state. -->
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

      <!-- UButton with a `to` prop renders as a NuxtLink anchor rather than a button,
           preserving browser link semantics for keyboard and assistive technology users. -->
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
