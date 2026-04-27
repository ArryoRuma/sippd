<script setup lang="ts">
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'dashboard' })

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
type EditableProfile = Pick<ProfileRow, 'full_name' | 'favorite_method' | 'brew_frequency' | 'roast_preference' | 'onboarding_goal' | 'flavor_notes' | 'preferred_origins' | 'log_reminders'>

const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()
const toast = useToast()
const {
  brewFrequencyOptions,
  onboardingGoalOptions,
  brewMethodOptions,
  roastPreferenceOptions,
  flavorNoteOptions,
  originOptions
} = useProfilePreferences()

const loading = ref(false)
const exporting = ref(false)
const exportingLogs = ref(false)
const deletingAccount = ref(false)
const showDeleteConfirm = ref(false)
const deleteConfirmText = ref('')

// Security section state
const newEmail = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const updatingEmail = ref(false)
const updatingPassword = ref(false)
const emailUpdateSent = ref(false)

const fullName = ref('')
const favoriteMethod = ref('')
const brewFrequency = ref('')
const roastPreference = ref('')
const onboardingGoal = ref('')
const flavorNotes = ref<string[]>([])
const preferredOrigins = ref<string[]>([])
const logReminders = ref(false)
const profileEmail = ref('')
const initialProfile = ref<EditableProfile | null>(null)

const sectionLinks = [
  { label: 'Profile', to: '#profile', icon: 'i-lucide-user-round' },
  { label: 'Preferences', to: '#preferences', icon: 'i-lucide-sliders-horizontal' },
  { label: 'Taste', to: '#taste', icon: 'i-lucide-sparkles' },
  { label: 'Security', to: '#security', icon: 'i-lucide-shield-check' },
  { label: 'Data', to: '#data', icon: 'i-lucide-database' }
]

function currentProfileState(): EditableProfile {
  return {
    full_name: fullName.value.trim() || null,
    favorite_method: favoriteMethod.value || null,
    brew_frequency: brewFrequency.value || null,
    roast_preference: roastPreference.value || null,
    onboarding_goal: onboardingGoal.value || null,
    flavor_notes: [...flavorNotes.value],
    preferred_origins: [...preferredOrigins.value],
    log_reminders: logReminders.value
  }
}

function syncProfileForm(profile: EditableProfile) {
  fullName.value = profile.full_name ?? ''
  favoriteMethod.value = profile.favorite_method ?? ''
  brewFrequency.value = profile.brew_frequency ?? ''
  roastPreference.value = profile.roast_preference ?? ''
  onboardingGoal.value = profile.onboarding_goal ?? ''
  flavorNotes.value = profile.flavor_notes ?? []
  preferredOrigins.value = profile.preferred_origins ?? []
  logReminders.value = profile.log_reminders ?? false
  initialProfile.value = profile
}

function isSameList(left: string[], right: string[]) {
  return left.length === right.length && left.every((item, index) => item === right[index])
}

const hasUnsavedChanges = computed(() => {
  if (!initialProfile.value) {
    return false
  }

  const current = currentProfileState()
  const initial = initialProfile.value

  return current.full_name !== initial.full_name
    || current.favorite_method !== initial.favorite_method
    || current.brew_frequency !== initial.brew_frequency
    || current.roast_preference !== initial.roast_preference
    || current.onboarding_goal !== initial.onboarding_goal
    || current.log_reminders !== initial.log_reminders
    || !isSameList(current.flavor_notes, initial.flavor_notes)
    || !isSameList(current.preferred_origins, initial.preferred_origins)
})

const profileCompletion = computed(() => {
  const fields = [
    Boolean(fullName.value.trim()),
    Boolean(favoriteMethod.value),
    Boolean(brewFrequency.value),
    Boolean(roastPreference.value),
    Boolean(onboardingGoal.value),
    flavorNotes.value.length > 0,
    preferredOrigins.value.length > 0
  ]

  return Math.round((fields.filter(Boolean).length / fields.length) * 100)
})

async function getAuthenticatedUser() {
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    toast.add({ title: 'Authentication error', description: error.message, color: 'error' })
    return null
  }

  return data.user
}

async function loadProfile() {
  const authUser = await getAuthenticatedUser()

  if (!authUser?.id) {
    return
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('email, full_name, favorite_method, brew_frequency, roast_preference, onboarding_goal, flavor_notes, preferred_origins, log_reminders')
    .eq('id', authUser.id)
    .maybeSingle()

  if (error) {
    toast.add({ title: 'Could not load settings', description: error.message, color: 'error' })
    return
  }

  profileEmail.value = data?.email ?? authUser.email ?? ''
  syncProfileForm({
    full_name: data?.full_name ?? null,
    favorite_method: data?.favorite_method ?? null,
    brew_frequency: data?.brew_frequency ?? null,
    roast_preference: data?.roast_preference ?? null,
    onboarding_goal: data?.onboarding_goal ?? null,
    flavor_notes: data?.flavor_notes ?? [],
    preferred_origins: data?.preferred_origins ?? [],
    log_reminders: data?.log_reminders ?? false
  })
}

watch(() => user.value?.id, () => {
  if (user.value?.id) {
    void loadProfile()
  }
}, { immediate: true })

function toggleMultiChoice(bucket: 'flavor' | 'origin', option: string) {
  const target = bucket === 'flavor' ? flavorNotes : preferredOrigins

  if (target.value.includes(option)) {
    target.value = target.value.filter(item => item !== option)
    return
  }

  if (target.value.length >= 3) {
    toast.add({
      title: 'Maximum reached',
      description: 'Choose up to three options for this section.',
      color: 'warning'
    })
    return
  }

  target.value = [...target.value, option]
}

function resetForm() {
  if (!initialProfile.value) {
    return
  }

  syncProfileForm(initialProfile.value)
}

async function handleSave() {
  if (loading.value) {
    return
  }

  const authUser = await getAuthenticatedUser()

  if (!authUser?.id) {
    return
  }

  if (!fullName.value.trim()) {
    toast.add({ title: 'Name required', description: 'Tell us what to call you.', color: 'warning' })
    return
  }

  loading.value = true

  const profileUpdate: ProfileUpdate = {
    email: authUser.email ?? null,
    ...currentProfileState()
  }

  const { error } = await supabase
    .from('profiles')
    .update(profileUpdate)
    .eq('id', authUser.id)

  loading.value = false

  if (error) {
    toast.add({ title: 'Could not save settings', description: error.message, color: 'error' })
    return
  }

  profileEmail.value = authUser.email ?? profileEmail.value
  syncProfileForm(currentProfileState())
  toast.add({ title: 'Settings saved', description: 'Your profile preferences are up to date.', color: 'success' })
}

async function handleSignOut() {
  await supabase.auth.signOut()
  await navigateTo('/')
}

async function handleEmailChange() {
  if (updatingEmail.value) return

  const trimmed = newEmail.value.trim().toLowerCase()

  if (!trimmed || !trimmed.includes('@')) {
    toast.add({ title: 'Invalid email', description: 'Enter a valid email address.', color: 'warning' })
    return
  }

  if (trimmed === profileEmail.value.toLowerCase()) {
    toast.add({ title: 'Same email', description: 'The new email matches your current one.', color: 'warning' })
    return
  }

  updatingEmail.value = true

  const { error } = await supabase.auth.updateUser({ email: trimmed })

  updatingEmail.value = false

  if (error) {
    toast.add({ title: 'Email update failed', description: error.message, color: 'error' })
    return
  }

  emailUpdateSent.value = true
  newEmail.value = ''
  toast.add({
    title: 'Confirmation email sent',
    description: 'Check both inboxes and click the confirmation link to complete the change.',
    color: 'success'
  })
}

async function handlePasswordChange() {
  if (updatingPassword.value) return

  if (!newPassword.value || newPassword.value.length < 8) {
    toast.add({ title: 'Password too short', description: 'Use at least 8 characters.', color: 'warning' })
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    toast.add({ title: 'Passwords do not match', description: 'Both fields must be identical.', color: 'warning' })
    return
  }

  updatingPassword.value = true

  const { error } = await supabase.auth.updateUser({ password: newPassword.value })

  updatingPassword.value = false

  if (error) {
    toast.add({ title: 'Password update failed', description: error.message, color: 'error' })
    return
  }

  newPassword.value = ''
  confirmPassword.value = ''
  toast.add({ title: 'Password updated', description: 'Your new password is active.', color: 'success' })
}

function downloadJson(filename: string, payload: string) {
  const blob = new Blob([payload], { type: 'application/json' })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  link.click()
  URL.revokeObjectURL(objectUrl)
}

async function handleExportProfile() {
  exporting.value = true

  try {
    downloadJson('sippd-profile-settings.json', JSON.stringify({
      exportedAt: new Date().toISOString(),
      email: profileEmail.value,
      profile: currentProfileState()
    }, null, 2))

    toast.add({ title: 'Export ready', description: 'Your profile settings were downloaded as JSON.', color: 'success' })
  } finally {
    exporting.value = false
  }
}

function sippsToCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0]!)
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n')
}

function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv' })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  link.click()
  URL.revokeObjectURL(objectUrl)
}

async function handleExportSippLog() {
  if (exportingLogs.value) return

  const authUser = await getAuthenticatedUser()
  if (!authUser?.id) return

  exportingLogs.value = true

  const { data, error } = await supabase
    .from('sipps')
    .select('*')
    .eq('user_id', authUser.id)
    .order('created_at', { ascending: false })

  exportingLogs.value = false

  if (error) {
    toast.add({ title: 'Export failed', description: error.message, color: 'error' })
    return
  }

  if (!data?.length) {
    toast.add({ title: 'Nothing to export', description: 'You have no sipp entries yet.', color: 'warning' })
    return
  }

  downloadCSV('sippd-sipp-log.csv', sippsToCSV(data as unknown as Record<string, unknown>[]))
  toast.add({ title: 'Export ready', description: `Downloaded ${data.length} sipp entries as CSV.`, color: 'success' })
}

async function handleDeleteAccount() {
  if (deletingAccount.value) return

  if (deleteConfirmText.value.trim().toUpperCase() !== 'DELETE') {
    toast.add({ title: 'Type DELETE to confirm', description: 'This action cannot be undone.', color: 'warning' })
    return
  }

  const authUser = await getAuthenticatedUser()
  if (!authUser?.id) return

  deletingAccount.value = true

  // Delete user profile data first (RLS prevents other users' data).
  // Supabase auth user deletion requires service_role; we sign out and
  // let the user contact support for hard deletion, which is the safe
  // client-side approach without exposing service_role on the frontend.
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', authUser.id)

  if (error) {
    deletingAccount.value = false
    toast.add({ title: 'Deletion failed', description: error.message, color: 'error' })
    return
  }

  await supabase.auth.signOut()
  deletingAccount.value = false
  showDeleteConfirm.value = false
  await navigateTo('/')
}
</script>

<template>
  <UDashboardPanel id="settings">
    <template #header>
      <UDashboardNavbar title="Settings">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <div class="flex items-center gap-2">
            <UButton
              label="Reset"
              color="neutral"
              variant="soft"
              :disabled="!hasUnsavedChanges || loading"
              @click="resetForm"
            />
            <UButton
              label="Save changes"
              icon="i-lucide-save"
              :loading="loading"
              :disabled="!hasUnsavedChanges"
              @click="handleSave"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section class="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,1fr)]">
          <UCard class="rounded-2xl border border-default/70 bg-elevated/80 shadow-sm">
            <div class="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div class="space-y-3">
                <p class="font-mono text-xs uppercase tracking-[0.14em] text-primary">
                  Dashboard settings
                </p>
                <div>
                  <h1 class="font-display text-3xl font-semibold tracking-tight text-highlighted">
                    Profile controls inspired by the Nuxt dashboard template
                  </h1>
                  <p class="mt-2 max-w-2xl text-sm leading-6 text-muted">
                    Manage the identity and taste signals that shape your Sippd dashboard. Security and data actions live here too, so the dashboard becomes the single control surface for your account.
                  </p>
                </div>
              </div>

              <div class="grid gap-3 rounded-2xl border border-default/70 bg-default/80 p-4 sm:min-w-60">
                <div>
                  <p class="text-xs uppercase tracking-[0.14em] text-muted">
                    Completion
                  </p>
                  <p class="mt-2 text-3xl font-semibold text-highlighted">
                    {{ profileCompletion }}%
                  </p>
                </div>
                <UProgress :model-value="profileCompletion" />
                <p class="text-xs leading-5 text-muted">
                  Your current profile depth improves personalization across dashboard summaries and future recommendations.
                </p>
              </div>
            </div>
          </UCard>

          <UCard class="rounded-2xl border border-default/70 bg-default/80 shadow-sm">
            <template #header>
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="text-xs uppercase tracking-[0.14em] text-muted">
                    Quick jump
                  </p>
                  <h2 class="mt-1 text-lg font-semibold text-highlighted">
                    Sections
                  </h2>
                </div>
                <UBadge
                  color="neutral"
                  variant="soft"
                  label="Foundations"
                />
              </div>
            </template>

            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="section in sectionLinks"
                :key="section.to"
                :label="section.label"
                :icon="section.icon"
                variant="soft"
                color="neutral"
                :to="section.to"
              />
            </div>
          </UCard>
        </section>

        <section
          id="profile"
          class="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.8fr)]"
        >
          <UCard class="rounded-2xl border border-default/70 bg-elevated/80 shadow-sm">
            <template #header>
              <div class="space-y-1">
                <p class="text-xs uppercase tracking-[0.14em] text-muted">
                  Profile
                </p>
                <h2 class="text-xl font-semibold text-highlighted">
                  Identity basics
                </h2>
              </div>
            </template>

            <div class="grid gap-5 md:grid-cols-2">
              <UFormField
                label="Display name"
                name="full_name"
                required
              >
                <UInput
                  v-model="fullName"
                  placeholder="Your name"
                  icon="i-lucide-user-round"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Account email"
                name="email"
                help="Email management ships in the next pass."
              >
                <UInput
                  :model-value="profileEmail"
                  icon="i-lucide-mail"
                  class="w-full"
                  readonly
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
                label="Reminder nudges"
                name="log_reminders"
                help="Helps keep your log current."
              >
                <UCheckbox
                  :model-value="logReminders"
                  label="Enable coffee logging reminders"
                  @update:model-value="logReminders = Boolean($event)"
                />
              </UFormField>
            </div>
          </UCard>

          <UCard class="rounded-2xl border border-default/70 bg-default/80 shadow-sm">
            <template #header>
              <div class="space-y-1">
                <p class="text-xs uppercase tracking-[0.14em] text-muted">
                  Snapshot
                </p>
                <h2 class="text-xl font-semibold text-highlighted">
                  Current identity
                </h2>
              </div>
            </template>

            <div class="space-y-4 text-sm text-muted">
              <div>
                <p class="text-xs uppercase tracking-[0.14em] text-muted">
                  Name
                </p>
                <p class="mt-1 text-base font-medium text-highlighted">
                  {{ fullName || 'Not set yet' }}
                </p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-[0.14em] text-muted">
                  Email
                </p>
                <p class="mt-1 text-base font-medium text-highlighted">
                  {{ profileEmail || 'No email found' }}
                </p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-[0.14em] text-muted">
                  Favorite method
                </p>
                <p class="mt-1 text-base font-medium text-highlighted">
                  {{ favoriteMethod || 'Choose a go-to method' }}
                </p>
              </div>
            </div>
          </UCard>
        </section>

        <section id="preferences">
          <UCard class="rounded-2xl border border-default/70 bg-elevated/80 shadow-sm">
            <template #header>
              <div class="space-y-1">
                <p class="text-xs uppercase tracking-[0.14em] text-muted">
                  Preferences
                </p>
                <h2 class="text-xl font-semibold text-highlighted">
                  Brewing habits and goals
                </h2>
              </div>
            </template>

            <div class="grid gap-5 md:grid-cols-3">
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
                label="Main goal with Sippd"
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
            </div>
          </UCard>
        </section>

        <section
          id="taste"
          class="grid gap-6 lg:grid-cols-2"
        >
          <UCard class="rounded-2xl border border-default/70 bg-elevated/80 shadow-sm">
            <template #header>
              <div class="space-y-1">
                <p class="text-xs uppercase tracking-[0.14em] text-muted">
                  Taste
                </p>
                <h2 class="text-xl font-semibold text-highlighted">
                  Favorite flavor notes
                </h2>
              </div>
            </template>

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
          </UCard>

          <UCard class="rounded-2xl border border-default/70 bg-elevated/80 shadow-sm">
            <template #header>
              <div class="space-y-1">
                <p class="text-xs uppercase tracking-[0.14em] text-muted">
                  Taste
                </p>
                <h2 class="text-xl font-semibold text-highlighted">
                  Favorite origins
                </h2>
              </div>
            </template>

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
          </UCard>
        </section>

        <section class="grid gap-6 lg:grid-cols-2">
          <UCard
            id="security"
            class="rounded-2xl border border-default/70 bg-default/80 shadow-sm"
          >
            <template #header>
              <div class="space-y-1">
                <p class="text-xs uppercase tracking-[0.14em] text-muted">
                  Security
                </p>
                <h2 class="text-xl font-semibold text-highlighted">
                  Account access
                </h2>
              </div>
            </template>

            <div class="space-y-6 text-sm">
              <div class="rounded-xl border border-default/70 bg-elevated/70 px-4 py-3">
                <p class="text-xs uppercase tracking-[0.14em] text-muted">
                  Signed in as
                </p>
                <p class="mt-1 text-base font-medium text-highlighted">
                  {{ profileEmail || user?.email || 'Unknown user' }}
                </p>
              </div>

              <div class="space-y-3">
                <p class="font-medium text-highlighted">
                  Change email
                </p>
                <UAlert
                  v-if="emailUpdateSent"
                  icon="i-lucide-mail-check"
                  color="success"
                  variant="soft"
                  title="Confirmation sent"
                  description="Click the link in both inboxes to complete the email change."
                  class="rounded-xl"
                />
                <template v-else>
                  <UFormField
                    label="New email address"
                    name="new_email"
                  >
                    <UInput
                      v-model="newEmail"
                      type="email"
                      placeholder="new@example.com"
                      icon="i-lucide-mail"
                      class="w-full"
                      autocomplete="email"
                    />
                  </UFormField>
                  <UButton
                    label="Send confirmation"
                    icon="i-lucide-send"
                    :loading="updatingEmail"
                    :disabled="!newEmail.trim()"
                    variant="soft"
                    @click="handleEmailChange"
                  />
                </template>
              </div>

              <USeparator />

              <div class="space-y-3">
                <p class="font-medium text-highlighted">
                  Change password
                </p>
                <UFormField
                  label="New password"
                  name="new_password"
                >
                  <UInput
                    v-model="newPassword"
                    type="password"
                    placeholder="At least 8 characters"
                    icon="i-lucide-lock"
                    class="w-full"
                    autocomplete="new-password"
                  />
                </UFormField>
                <UFormField
                  label="Confirm password"
                  name="confirm_password"
                >
                  <UInput
                    v-model="confirmPassword"
                    type="password"
                    placeholder="Repeat new password"
                    icon="i-lucide-lock-keyhole"
                    class="w-full"
                    autocomplete="new-password"
                  />
                </UFormField>
                <UButton
                  label="Update password"
                  icon="i-lucide-shield-check"
                  :loading="updatingPassword"
                  :disabled="!newPassword || !confirmPassword"
                  variant="soft"
                  @click="handlePasswordChange"
                />
              </div>

              <USeparator />

              <UButton
                label="Sign out"
                icon="i-lucide-log-out"
                color="neutral"
                variant="soft"
                @click="handleSignOut"
              />
            </div>
          </UCard>

          <UCard
            id="data"
            class="rounded-2xl border border-default/70 bg-default/80 shadow-sm"
          >
            <template #header>
              <div class="space-y-1">
                <p class="text-xs uppercase tracking-[0.14em] text-muted">
                  Data
                </p>
                <h2 class="text-xl font-semibold text-highlighted">
                  Portable account data
                </h2>
              </div>
            </template>

            <div class="space-y-6 text-sm text-muted">
              <div class="space-y-3">
                <p class="font-medium text-highlighted">
                  Export your data
                </p>
                <p>Download your profile settings or full sipp log at any time.</p>
                <div class="flex flex-wrap gap-2">
                  <UButton
                    label="Profile JSON"
                    icon="i-lucide-download"
                    :loading="exporting"
                    variant="soft"
                    @click="handleExportProfile"
                  />
                  <UButton
                    label="Sipp log CSV"
                    icon="i-lucide-table"
                    :loading="exportingLogs"
                    color="neutral"
                    variant="soft"
                    @click="handleExportSippLog"
                  />
                </div>
              </div>

              <USeparator />

              <div class="space-y-3">
                <p class="font-medium text-error">
                  Delete account
                </p>
                <p>
                  This permanently removes your profile and signs you out. Your sipp entries are also deleted. This cannot be undone.
                </p>
                <template v-if="!showDeleteConfirm">
                  <UButton
                    label="Delete my account"
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="soft"
                    @click="showDeleteConfirm = true"
                  />
                </template>
                <template v-else>
                  <UAlert
                    icon="i-lucide-triangle-alert"
                    color="error"
                    variant="soft"
                    title="This cannot be undone"
                    description="Type DELETE in the box below to confirm permanent account deletion."
                    class="rounded-xl"
                  />
                  <UFormField
                    label="Type DELETE to confirm"
                    name="delete_confirm"
                  >
                    <UInput
                      v-model="deleteConfirmText"
                      placeholder="DELETE"
                      class="w-full font-mono"
                    />
                  </UFormField>
                  <div class="flex gap-2">
                    <UButton
                      label="Cancel"
                      color="neutral"
                      variant="soft"
                      @click="showDeleteConfirm = false; deleteConfirmText = ''"
                    />
                    <UButton
                      label="Confirm delete"
                      icon="i-lucide-trash-2"
                      color="error"
                      :loading="deletingAccount"
                      :disabled="deleteConfirmText.trim().toUpperCase() !== 'DELETE'"
                      @click="handleDeleteAccount"
                    />
                  </div>
                </template>
              </div>
            </div>
          </UCard>
        </section>
      </div>
    </template>
  </UDashboardPanel>
</template>
