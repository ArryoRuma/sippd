<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, FormErrorEvent } from '@nuxt/ui'
import type { Database } from '~/types/database.types'

const props = defineProps<{
  sipp?: {
    id: string
    roaster: string
    roast_type: string
    origin: string
    method: string
    aroma: number
    flavor: number
    acidity: number
    body: number
    aftertaste: number
    overall: number
    created_at: string
  }
  readonly?: boolean
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()
const toast = useToast()
const loading = ref(false)

const methods = [
  'Pour Over',
  'French Press',
  'Espresso',
  'AeroPress',
  'Cold Brew',
  'Drip',
  'Moka Pot',
  'Other'
]

const schema = z.object({
  roaster: z.string().min(1, 'Roaster is required'),
  roast_type: z.string().min(1, 'Roast type is required'),
  origin: z.string().min(1, 'Origin is required'),
  method: z.string().min(1, 'Method is required'),
  aroma: z.coerce.number().min(1).max(10),
  flavor: z.coerce.number().min(1).max(10),
  acidity: z.coerce.number().min(1).max(10),
  body: z.coerce.number().min(1).max(10),
  aftertaste: z.coerce.number().min(1).max(10)
})

type Schema = z.output<typeof schema>
type SippPreset = Pick<Database['public']['Tables']['sipps']['Row'], 'id' | 'roaster' | 'roast_type' | 'origin' | 'method' | 'aroma' | 'flavor' | 'acidity' | 'body' | 'aftertaste' | 'overall' | 'created_at'>

const state = reactive({
  roaster: props.sipp?.roaster ?? '',
  roast_type: props.sipp?.roast_type ?? '',
  origin: props.sipp?.origin ?? '',
  method: props.sipp?.method ?? '',
  aroma: props.sipp?.aroma ?? 5,
  flavor: props.sipp?.flavor ?? 5,
  acidity: props.sipp?.acidity ?? 5,
  body: props.sipp?.body ?? 5,
  aftertaste: props.sipp?.aftertaste ?? 5
})

const { data: presetSipps } = await useAsyncData('sipp-log-presets', async (): Promise<SippPreset[]> => {
  const { data, error } = await supabase
    .from('sipps')
    .select('id, roaster, roast_type, origin, method, aroma, flavor, acidity, body, aftertaste, overall, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    return []
  }

  return (data ?? []) as SippPreset[]
})

const topPreset = computed(() => {
  const presets = presetSipps.value ?? []
  if (!presets.length) return null

  return [...presets].sort((a, b) => b.overall - a.overall)[0] ?? null
})

const latestPreset = computed(() => {
  return (presetSipps.value ?? [])[0] ?? null
})

const presetMenuItems = computed(() => {
  return [
    (presetSipps.value ?? []).map(preset => ({
      label: `${preset.roaster} · ${preset.method} · ${preset.overall}/50`,
      icon: 'i-lucide-copy',
      onSelect: () => applyPreset(preset)
    }))
  ]
})

const mode = computed(() => {
  if (props.readonly) return 'view'
  if (props.sipp) return 'edit'
  return 'create'
})

function syncStateFromSipp() {
  state.roaster = props.sipp?.roaster ?? ''
  state.roast_type = props.sipp?.roast_type ?? ''
  state.origin = props.sipp?.origin ?? ''
  state.method = props.sipp?.method ?? ''
  state.aroma = props.sipp?.aroma ?? 5
  state.flavor = props.sipp?.flavor ?? 5
  state.acidity = props.sipp?.acidity ?? 5
  state.body = props.sipp?.body ?? 5
  state.aftertaste = props.sipp?.aftertaste ?? 5
}

function applyPreset(preset: SippPreset) {
  state.roaster = preset.roaster
  state.roast_type = preset.roast_type
  state.origin = preset.origin
  state.method = preset.method
  state.aroma = preset.aroma
  state.flavor = preset.flavor
  state.acidity = preset.acidity
  state.body = preset.body
  state.aftertaste = preset.aftertaste

  toast.add({
    title: 'Preset applied',
    description: `Loaded fields from ${preset.roaster}.`,
    color: 'success'
  })
}

watch(() => props.sipp, syncStateFromSipp, { immediate: true })

const overall = computed(() => state.aroma + state.flavor + state.acidity + state.body + state.aftertaste)

function onError(event: FormErrorEvent) {
  toast.add({
    title: 'Please fix the form errors',
    description: event.errors.map(e => e.message).join(', '),
    color: 'warning'
  })
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!user.value) {
    toast.add({ title: 'Not authenticated', description: 'Please log in again.', color: 'error' })
    navigateTo('/login')
    return
  }

  const { data: authData, error: authError } = await supabase.auth.getUser()
  const currentUser = authData.user

  if (authError || !currentUser) {
    toast.add({ title: 'Session expired', description: 'Please log in again.', color: 'error' })
    navigateTo('/login')
    return
  }

  loading.value = true

  const payload = {
    roaster: event.data.roaster,
    roast_type: event.data.roast_type,
    origin: event.data.origin,
    method: event.data.method,
    aroma: event.data.aroma,
    flavor: event.data.flavor,
    acidity: event.data.acidity,
    body: event.data.body,
    aftertaste: event.data.aftertaste
  }

  const { error } = props.sipp
    ? await supabase
        .from('sipps')
        .update(payload)
        .eq('id', props.sipp.id)
    : await supabase.from('sipps').insert({
        user_id: currentUser.id,
        ...payload
      })

  loading.value = false

  if (error) {
    toast.add({ title: 'Error saving sipp', description: error.message, color: 'error' })
  } else {
    toast.add({
      title: props.sipp ? 'Sipp updated!' : 'Sipp logged!',
      color: 'success'
    })
    emit('saved')
    emit('close')
  }
}
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold text-highlighted">
        {{ mode === 'view' ? 'Sipp Details' : mode === 'edit' ? 'Edit Sipp' : 'New Sipp' }}
      </h2>
      <UButton
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        size="sm"
        square
        @click="emit('close')"
      />
    </div>

    <UForm
      :schema="schema"
      :state="state"
      class="space-y-4"
      @submit="onSubmit"
      @error="onError"
    >
      <div
        v-if="mode === 'create' && (latestPreset || topPreset)"
        class="rounded-xl border border-default bg-elevated/50 p-3"
      >
        <p class="text-xs uppercase tracking-wide text-muted">
          Quick presets
        </p>

        <div class="mt-3 flex flex-wrap items-center gap-2">
          <UButton
            v-if="latestPreset"
            label="Use latest log"
            icon="i-lucide-history"
            size="xs"
            color="neutral"
            variant="soft"
            @click="latestPreset && applyPreset(latestPreset)"
          />
          <UButton
            v-if="topPreset"
            label="Use top-rated"
            icon="i-lucide-star"
            size="xs"
            color="neutral"
            variant="soft"
            @click="topPreset && applyPreset(topPreset)"
          />

          <UDropdownMenu
            v-if="presetMenuItems[0]?.length"
            :items="presetMenuItems"
          >
            <UButton
              label="Choose recent"
              icon="i-lucide-chevron-down"
              size="xs"
              color="neutral"
              variant="outline"
            />
          </UDropdownMenu>
        </div>
      </div>

      <UFormField
        label="Coffee Roaster"
        name="roaster"
      >
        <UInput
          v-model="state.roaster"
          placeholder="e.g. Counter Culture"
          :disabled="readonly"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Roast Type"
        name="roast_type"
      >
        <UInput
          v-model="state.roast_type"
          placeholder="e.g. Light, Medium, Dark"
          :disabled="readonly"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Origin"
        name="origin"
      >
        <UInput
          v-model="state.origin"
          placeholder="e.g. Ethiopia Yirgacheffe"
          :disabled="readonly"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Method"
        name="method"
      >
        <USelect
          v-model="state.method"
          :items="methods"
          placeholder="Select brewing method"
          :disabled="readonly"
          class="w-full"
        />
      </UFormField>

      <div class="border-t border-default pt-4">
        <h3 class="text-sm font-semibold text-muted mb-3">
          Scores (1–10)
        </h3>
        <div class="grid grid-cols-2 gap-4">
          <UFormField
            label="Aroma"
            name="aroma"
          >
            <UInput
              v-model.number="state.aroma"
              type="number"
              :min="1"
              :max="10"
              :disabled="readonly"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Flavor"
            name="flavor"
          >
            <UInput
              v-model.number="state.flavor"
              type="number"
              :min="1"
              :max="10"
              :disabled="readonly"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Acidity"
            name="acidity"
          >
            <UInput
              v-model.number="state.acidity"
              type="number"
              :min="1"
              :max="10"
              :disabled="readonly"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Body"
            name="body"
          >
            <UInput
              v-model.number="state.body"
              type="number"
              :min="1"
              :max="10"
              :disabled="readonly"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Aftertaste"
            name="aftertaste"
          >
            <UInput
              v-model.number="state.aftertaste"
              type="number"
              :min="1"
              :max="10"
              :disabled="readonly"
              class="w-full"
            />
          </UFormField>

          <div class="flex flex-col justify-end">
            <span class="text-xs text-muted">Overall</span>
            <span class="text-2xl font-bold text-primary">{{ overall }}<span class="text-sm text-muted">/50</span></span>
          </div>
        </div>
      </div>

      <div
        v-if="!readonly"
        class="pt-4"
      >
        <UButton
          type="submit"
          :label="mode === 'edit' ? 'Save Changes' : 'Log Sipp'"
          color="primary"
          block
          :loading="loading"
        />
      </div>
    </UForm>
  </div>
</template>
