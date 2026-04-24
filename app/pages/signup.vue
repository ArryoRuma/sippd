<script setup lang="ts">
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const email = ref('')
const password = ref('')
const loading = ref(false)
const resending = ref(false)
const error = ref('')
const successMessage = ref('')

const toast = useToast()
const { trackFunnelEvent } = useFunnelEvents()

watchEffect(() => {
  if (user.value) {
    navigateTo('/onboarding')
  }
})

async function handleSignup() {
  if (loading.value) {
    return
  }

  error.value = ''
  successMessage.value = ''

  if (password.value.length < 8) {
    error.value = 'Use at least 8 characters for your password.'
    return
  }

  loading.value = true

  await trackFunnelEvent('signup_submitted', {
    hasEmail: Boolean(email.value.trim())
  })

  const emailRedirectTo = import.meta.client
    ? `${window.location.origin}/confirm`
    : undefined

  const { data, error: authError } = await supabase.auth.signUp({
    email: email.value.trim(),
    password: password.value,
    options: {
      emailRedirectTo
    }
  })

  loading.value = false

  if (authError) {
    error.value = authError.message
    toast.add({
      title: 'Signup failed',
      description: authError.message,
      color: 'error'
    })
    return
  }

  if (data.session) {
    await trackFunnelEvent('signup_succeeded', {
      immediateSession: true
    })

    await navigateTo('/onboarding')
    return
  }

  await trackFunnelEvent('signup_verification_required', {
    immediateSession: false
  })

  successMessage.value = 'Account created. Check your email to verify, then continue signing in.'
  toast.add({
    title: 'Account created',
    description: successMessage.value,
    color: 'success'
  })
}

async function handleResendVerification() {
  const normalizedEmail = email.value.trim()

  if (!normalizedEmail || resending.value) {
    return
  }

  resending.value = true

  const emailRedirectTo = import.meta.client
    ? `${window.location.origin}/confirm`
    : undefined

  const { error: resendError } = await supabase.auth.resend({
    type: 'signup',
    email: normalizedEmail,
    options: {
      emailRedirectTo
    }
  })

  resending.value = false

  if (resendError) {
    toast.add({
      title: 'Could not resend verification',
      description: resendError.message,
      color: 'error'
    })
    return
  }

  toast.add({
    title: 'Verification sent',
    description: 'Check your inbox for a fresh confirmation link.',
    color: 'success'
  })

  await trackFunnelEvent('verification_resent', {
    hasEmail: true
  })
}
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center bg-default px-4">
    <div class="vibe-orb -left-24 top-16 size-80 opacity-60" style="background: radial-gradient(circle, color-mix(in oklch, var(--ui-primary) 20%, transparent) 0%, transparent 72%);" />
    <div class="vibe-orb -right-28 bottom-20 size-80 opacity-55" style="background: radial-gradient(circle, color-mix(in oklch, var(--vibe-accent) 20%, transparent) 0%, transparent 74%); animation-delay: 1.4s;" />

    <div class="vibe-surface w-full max-w-sm space-y-8 rounded-2xl p-6 sm:p-8">
      <div class="text-center">
        <p class="font-mono text-[11px] uppercase tracking-[0.12em] text-primary">
          Get Started
        </p>
        <h1 class="mt-2 font-display text-3xl font-bold tracking-tight text-highlighted">
          Create your Sippd account
        </h1>
        <p class="mt-2 text-sm text-muted">
          Start your coffee log in under a minute.
        </p>
      </div>

      <form
        class="space-y-4"
        @submit.prevent="handleSignup"
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
          help="Minimum 8 characters"
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

        <p
          v-if="successMessage"
          class="text-sm text-success"
        >
          {{ successMessage }}
        </p>

        <UButton
          v-if="successMessage"
          type="button"
          label="Resend verification email"
          color="neutral"
          variant="soft"
          block
          :loading="resending"
          @click="handleResendVerification"
        />

        <UButton
          type="submit"
          label="Create account"
          color="primary"
          size="lg"
          block
          :loading="loading"
        />

        <p class="text-center text-sm text-muted">
          Already have an account?
          <NuxtLink
            to="/login"
            class="text-primary hover:text-primary/80"
          >
            Sign in
          </NuxtLink>
        </p>
      </form>
    </div>
  </div>
</template>
