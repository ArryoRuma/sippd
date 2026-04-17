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
  error.value = ''
  loading.value = true

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: email.value,
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
  } else {
    navigateTo('/dashboard', { external: true })
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-default">
    <div class="w-full max-w-sm space-y-8 px-4">
      <div class="text-center">
        <h1 class="text-3xl font-bold text-highlighted">
          Sippd
        </h1>
        <p class="mt-2 text-sm text-muted">
          Sign in to your account
        </p>
      </div>

      <UForm
        :state="{ email, password }"
        class="space-y-4"
        @submit="handleLogin"
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
            required
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
            required
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
          block
          :loading="loading"
        />
      </UForm>
    </div>
  </div>
</template>
