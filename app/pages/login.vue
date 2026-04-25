<script setup lang="ts">
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const toast = useToast()

// If already logged in, redirect to dashboard
watchEffect(() => {
  if (user.value) {
    navigateTo('/dashboard')
  }
})

async function handleLogin() {
  if (loading.value) {
    return
  }

  error.value = ''
  loading.value = true

  const { data, error: authError } = await supabase.auth.signInWithPassword({
    email: email.value.trim(),
    password: password.value
  })

  loading.value = false

  if (authError) {
    error.value = authError.message
    toast.add({
      title: 'Login failed',
      description: authError.message,
      color: 'error'
    })
  } else if (!data.session) {
    error.value = 'Signed in, but no session was created. Please try again.'
    toast.add({
      title: 'Login incomplete',
      description: error.value,
      color: 'warning'
    })
  } else {
    await navigateTo('/dashboard')
  }
}
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center bg-default px-4">
    <div
      class="vibe-orb -top-16 -left-10 size-52 bg-warning/18"
      aria-hidden="true"
    />
    <div
      class="vibe-orb -right-8 top-24 size-56 bg-primary/14"
      aria-hidden="true"
      style="animation-delay: 1.2s"
    />
    <div class="vibe-surface relative z-10 w-full max-w-sm space-y-8 rounded-2xl bg-gradient-to-b from-warning/10 via-default to-default p-6 sm:p-8">
      <div class="text-center">
        <p class="font-mono text-[11px] uppercase tracking-[0.12em] text-warning">
          Welcome Back
        </p>
        <h1 class="mt-2 font-display text-3xl font-bold tracking-tight text-highlighted">
          Sippd
        </h1>
        <p class="mt-2 text-sm text-muted">
          Sign in to your account
        </p>
      </div>

      <form
        class="space-y-4"
        @submit.prevent="handleLogin"
      >
        <UFormField
          label="Email"
          name="email"
        >
          <UInput
            v-model="email"
            type="email"
            placeholder="you@example.com"
            icon="i-lucide-mail"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Password"
          name="password"
        >
          <UInput
            v-model="password"
            type="password"
            placeholder="••••••••"
            icon="i-lucide-lock"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <p
          v-if="error"
          class="text-sm text-error"
        >
          {{ error }}
        </p>

        <UButton
          type="submit"
          label="Sign in"
          color="primary"
          size="lg"
          class="mt-2 rounded-xl"
          block
          :loading="loading"
        />

        <p class="text-center text-sm text-muted">
          New to Sippd?
          <NuxtLink
            to="/signup"
            class="text-primary hover:text-primary/80"
          >
            Create an account
          </NuxtLink>
        </p>
      </form>
    </div>
  </div>
</template>
