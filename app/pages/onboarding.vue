<script setup lang="ts">
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()
const { trackFunnelEvent } = useFunnelEvents()

const loading = ref(false)
const loadingProfile = ref(false)
const fullName = ref('')
const favoriteMethod = ref('')

watchEffect(() => {
  if (!user.value) {
    navigateTo('/login')
  }
})

async function loadProfile() {
  if (!user.value) {
    return
  }

  loadingProfile.value = true

  const { data, error } = await supabase
    .from('profiles')
    .select('full_name,favorite_method,onboarding_completed')
    .eq('id', user.value.id)
    .maybeSingle()

  loadingProfile.value = false

  if (error) {
    toast.add({ title: 'Could not load onboarding', description: error.message, color: 'warning' })
    return
  }

  if (!data) {
    return
  }

  fullName.value = data.full_name ?? ''
  favoriteMethod.value = data.favorite_method ?? ''

  if (data.onboarding_completed) {
    await navigateTo('/dashboard')
  }
}

watch(user, (nextUser) => {
  if (nextUser) {
    loadProfile()
  }
}, { immediate: true })

async function handleOnboardingComplete() {
  if (!user.value || loading.value) {
    return
  }

  loading.value = true

  const payload = {
    id: user.value.id,
    email: user.value.email ?? null,
    full_name: fullName.value.trim() || null,
    favorite_method: favoriteMethod.value.trim() || null,
    onboarding_completed: true,
    onboarding_step: 'completed'
  }

  const { error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })

  loading.value = false

  if (error) {
    toast.add({ title: 'Could not complete onboarding', description: error.message, color: 'error' })
    return
  }

  toast.add({ title: 'Welcome to Sippd', description: 'Your account is ready.', color: 'success' })
  await trackFunnelEvent('onboarding_completed', {
    hasName: Boolean(fullName.value.trim()),
    hasFavoriteMethod: Boolean(favoriteMethod.value.trim())
  })

  await navigateTo('/dashboard')
}
</script>

<template>
  <div class="min-h-screen bg-default px-4 py-10">
    <div class="mx-auto w-full max-w-xl rounded-2xl border border-default bg-elevated/40 p-6 sm:p-8">
      <p class="font-mono text-xs uppercase tracking-[0.12em] text-primary">
        Onboarding
      </p>
      <h1 class="mt-3 text-3xl font-semibold tracking-tight text-highlighted">
        Let’s set up your account
      </h1>
      <p class="mt-2 text-sm text-muted">
        Add a few details so we can personalize your coffee logging experience.
      </p>

      <form
        class="mt-8 space-y-5"
        @submit.prevent="handleOnboardingComplete"
      >
        <UFormField
          label="What should we call you?"
          name="full_name"
        >
          <UInput
            v-model="fullName"
            placeholder="Your name"
            icon="i-lucide-user-round"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Favorite brew method"
          name="favorite_method"
          help="Optional"
        >
          <UInput
            v-model="favoriteMethod"
            placeholder="V60, espresso, AeroPress..."
            icon="i-lucide-coffee"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UButton
          type="submit"
          label="Finish setup"
          color="primary"
          size="lg"
          block
          :loading="loading || loadingProfile"
        />
      </form>
    </div>
  </div>
</template>
