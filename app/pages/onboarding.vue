<!-- onboarding.vue
     First-run setup wizard. Collects user preferences (brew frequency, goal,
     method, roast, flavors, origins) and writes them to the `profiles` table.
     Uses upsert semantics (update then insert fallback) to handle both new
     users and users who revisit before completing. Tracks completion via
     useFunnelEvents for conversion analysis. -->
<script setup lang="ts">
import type { Database } from '~/types/database.types'

definePageMeta({ layout: false })

const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()
const toast = useToast()
const { trackFunnelEvent } = useFunnelEvents()
const {
  brewFrequencyOptions,
  onboardingGoalOptions,
  brewMethodOptions,
  roastPreferenceOptions,
  flavorNoteOptions,
  originOptions
} = useProfilePreferences()

const loading = ref(false)
const loadingProfile = ref(false)
const fullName = ref('')
const brewFrequency = ref('')
const onboardingGoal = ref('')
const favoriteMethod = ref('')
const roastPreference = ref('')
const flavorNotes = ref<string[]>([])
const preferredOrigins = ref<string[]>([])
const logReminders = ref(false)

watchEffect(() => {
  if (!user.value) {
    navigateTo('/login')
  }
})

async function getAuthenticatedUser() {
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    toast.add({ title: 'Authentication error', description: error.message, color: 'error' })
    return null
  }

  return data.user
}

// loadProfile runs on mount and when the user ref changes. If the profile
// is already marked completed it redirects immediately, preventing re-onboarding.
async function loadProfile() {
  if (!user.value) {
    return
  }

  const authUser = await getAuthenticatedUser()

  if (!authUser?.id) {
    return
  }

  loadingProfile.value = true

  const { data, error } = await supabase
    .from('profiles')
    .select('full_name,brew_frequency,onboarding_goal,favorite_method,roast_preference,flavor_notes,preferred_origins,log_reminders,onboarding_completed')
    .eq('id', authUser.id)
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
  brewFrequency.value = data.brew_frequency ?? ''
  onboardingGoal.value = data.onboarding_goal ?? ''
  favoriteMethod.value = data.favorite_method ?? ''
  roastPreference.value = data.roast_preference ?? ''
  flavorNotes.value = data.flavor_notes ?? []
  preferredOrigins.value = data.preferred_origins ?? []
  logReminders.value = data.log_reminders ?? false

  if (data.onboarding_completed) {
    await navigateTo('/dashboard')
  }
}

watch(user, (nextUser) => {
  if (nextUser) {
    loadProfile()
  }
}, { immediate: true })

// toggleMultiChoice enforces a maximum of 3 selections per bucket (flavor/origin)
// and provides an in-app warning rather than silently ignoring extra clicks.
function toggleMultiChoice(bucket: 'flavor' | 'origin', option: string) {
  const target = bucket === 'flavor' ? flavorNotes : preferredOrigins

  if (target.value.includes(option)) {
    target.value = target.value.filter(item => item !== option)
    return
  }

  if (target.value.length >= 3) {
    toast.add({
      title: 'Maximum reached',
      description: 'Choose up to three options for this question.',
      color: 'warning'
    })
    return
  }

  target.value = [...target.value, option]
}

// handleOnboardingComplete validates required fields client-side, then attempts
// an UPDATE. If no row was modified (new user), it falls back to INSERT.
// This avoids a separate existence check round-trip.
async function handleOnboardingComplete() {
  if (!user.value || loading.value) {
    return
  }

  const authUser = await getAuthenticatedUser()

  if (!authUser?.id) {
    toast.add({
      title: 'Could not complete onboarding',
      description: 'Your session is not ready yet. Please try again.',
      color: 'error'
    })
    return
  }

  if (!fullName.value.trim()) {
    toast.add({ title: 'Name required', description: 'Tell us what to call you.', color: 'warning' })
    return
  }

  if (!brewFrequency.value) {
    toast.add({ title: 'Coffee frequency required', description: 'Pick how often you drink coffee.', color: 'warning' })
    return
  }

  if (!onboardingGoal.value) {
    toast.add({ title: 'Goal required', description: 'Select your main reason for using Sippd.', color: 'warning' })
    return
  }

  loading.value = true

  const profileId = authUser.id
  const profileValues = {
    email: authUser.email ?? null,
    full_name: fullName.value.trim() || null,
    brew_frequency: brewFrequency.value || null,
    onboarding_goal: onboardingGoal.value || null,
    favorite_method: favoriteMethod.value.trim() || null,
    roast_preference: roastPreference.value || null,
    flavor_notes: flavorNotes.value,
    preferred_origins: preferredOrigins.value,
    log_reminders: logReminders.value,
    onboarding_completed: true,
    onboarding_step: 'completed'
  }

  const { data: updatedProfile, error: updateError } = await supabase
    .from('profiles')
    .update(profileValues)
    .eq('id', profileId)
    .select('id')
    .maybeSingle()

  let error = updateError

  if (!error && !updatedProfile) {
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: profileId,
        ...profileValues
      })

    error = insertError
  }

  loading.value = false

  if (error) {
    toast.add({ title: 'Could not complete onboarding', description: error.message, color: 'error' })
    return
  }

  toast.add({ title: 'Welcome to Sippd', description: 'Your account is ready.', color: 'success' })
  void trackFunnelEvent('onboarding_completed', {
    hasName: Boolean(fullName.value.trim()),
    brewFrequency: brewFrequency.value,
    goal: onboardingGoal.value,
    favoriteMethod: favoriteMethod.value,
    roastPreference: roastPreference.value,
    flavorNotesCount: flavorNotes.value.length,
    preferredOriginsCount: preferredOrigins.value.length,
    remindersEnabled: logReminders.value
  })

  await navigateTo('/dashboard')
}
</script>

<template>
  <div class="relative min-h-screen bg-default px-4 py-10 overflow-hidden">
    <div class="mx-auto w-full max-w-xl rounded-2xl p-6 sm:p-8 vibe-surface">
      <p class="font-mono text-xs uppercase tracking-[0.12em] text-primary">
        Onboarding
      </p>
      <h1 class="mt-3 font-display text-3xl font-semibold tracking-tight text-highlighted">
        Let’s tailor Sippd to your taste
      </h1>
      <p class="mt-2 text-sm text-muted">
        Answer a few quick questions so your dashboard and suggestions feel personal from day one.
      </p>

      <form
        class="mt-8 space-y-6"
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
          label="How often do you drink coffee?"
          name="brew_frequency"
        >
          <USelect
            v-model="brewFrequency"
            :items="brewFrequencyOptions"
            placeholder="Select frequency"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="What’s your main goal with Sippd?"
          name="onboarding_goal"
        >
          <USelect
            v-model="onboardingGoal"
            :items="onboardingGoalOptions"
            placeholder="Choose your goal"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Most-used brew method"
          name="favorite_method"
        >
          <USelect
            v-model="favoriteMethod"
            :items="brewMethodOptions"
            placeholder="Pick one"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Preferred roast level"
          name="roast_preference"
        >
          <USelect
            v-model="roastPreference"
            :items="roastPreferenceOptions"
            placeholder="Pick one"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Favorite flavor notes"
          name="flavor_notes"
          help="Choose up to 3"
        >
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="note in flavorNoteOptions"
              :key="note"
              :label="note"
              type="button"
              size="sm"
              :color="flavorNotes.includes(note) ? 'primary' : 'neutral'"
              :variant="flavorNotes.includes(note) ? 'soft' : 'outline'"
              @click="toggleMultiChoice('flavor', note)"
            />
          </div>
        </UFormField>

        <UFormField
          label="Favorite origins"
          name="preferred_origins"
          help="Choose up to 3"
        >
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="origin in originOptions"
              :key="origin"
              :label="origin"
              type="button"
              size="sm"
              :color="preferredOrigins.includes(origin) ? 'primary' : 'neutral'"
              :variant="preferredOrigins.includes(origin) ? 'soft' : 'outline'"
              @click="toggleMultiChoice('origin', origin)"
            />
          </div>
        </UFormField>

        <UFormField
          label="Get reminder nudges to log new cups"
          name="log_reminders"
        >
          <UCheckbox
            :model-value="logReminders"
            label="Yes, send me friendly reminders"
            @update:model-value="logReminders = Boolean($event)"
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

        <UButton
          type="button"
          label="Go to dashboard"
          color="neutral"
          variant="soft"
          size="lg"
          block
          to="/dashboard"
          :disabled="loading || loadingProfile"
        />
      </form>
    </div>
  </div>
</template>
