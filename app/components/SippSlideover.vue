<script setup lang="ts">
import { z } from 'zod'

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

const supabase = useSupabaseClient()
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
  aroma: z.number().min(1).max(10),
  flavor: z.number().min(1).max(10),
  acidity: z.number().min(1).max(10),
  body: z.number().min(1).max(10),
  aftertaste: z.number().min(1).max(10)
})

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

const overall = computed(() => state.aroma + state.flavor + state.acidity + state.body + state.aftertaste)

async function handleSubmit() {
  loading.value = true

  const { error } = await supabase.from('sipps').insert({
    user_id: user.value!.id,
    roaster: state.roaster,
    roast_type: state.roast_type,
    origin: state.origin,
    method: state.method,
    aroma: state.aroma,
    flavor: state.flavor,
    acidity: state.acidity,
    body: state.body,
    aftertaste: state.aftertaste
  })

  loading.value = false

  if (error) {
    toast.add({ title: 'Error saving sipp', description: error.message, color: 'error' })
  } else {
    toast.add({ title: 'Sipp logged!', color: 'success' })
    emit('saved')
    emit('close')
  }
}
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold text-highlighted">
        {{ readonly ? 'Sipp Details' : 'New Sipp' }}
      </h2>
      <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" square @click="emit('close')" />
    </div>

    <UForm :schema="schema" :state="state" class="space-y-4" @submit="handleSubmit">
      <UFormField label="Coffee Roaster" name="roaster">
        <UInput v-model="state.roaster" placeholder="e.g. Counter Culture" :disabled="readonly" class="w-full" />
      </UFormField>

      <UFormField label="Roast Type" name="roast_type">
        <UInput v-model="state.roast_type" placeholder="e.g. Light, Medium, Dark" :disabled="readonly" class="w-full" />
      </UFormField>

      <UFormField label="Origin" name="origin">
        <UInput v-model="state.origin" placeholder="e.g. Ethiopia Yirgacheffe" :disabled="readonly" class="w-full" />
      </UFormField>

      <UFormField label="Method" name="method">
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
          <UFormField label="Aroma" name="aroma">
            <UInput v-model.number="state.aroma" type="number" :min="1" :max="10" :disabled="readonly" class="w-full" />
          </UFormField>

          <UFormField label="Flavor" name="flavor">
            <UInput v-model.number="state.flavor" type="number" :min="1" :max="10" :disabled="readonly" class="w-full" />
          </UFormField>

          <UFormField label="Acidity" name="acidity">
            <UInput v-model.number="state.acidity" type="number" :min="1" :max="10" :disabled="readonly" class="w-full" />
          </UFormField>

          <UFormField label="Body" name="body">
            <UInput v-model.number="state.body" type="number" :min="1" :max="10" :disabled="readonly" class="w-full" />
          </UFormField>

          <UFormField label="Aftertaste" name="aftertaste">
            <UInput v-model.number="state.aftertaste" type="number" :min="1" :max="10" :disabled="readonly" class="w-full" />
          </UFormField>

          <div class="flex flex-col justify-end">
            <span class="text-xs text-muted">Overall</span>
            <span class="text-2xl font-bold text-primary">{{ overall }}<span class="text-sm text-muted">/50</span></span>
          </div>
        </div>
      </div>

      <div v-if="!readonly" class="pt-4">
        <UButton type="submit" label="Log Sipp" color="primary" block :loading="loading" />
      </div>
    </UForm>
  </div>
</template>
