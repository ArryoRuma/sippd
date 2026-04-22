import type { Database, Json } from '~/types/database.types'

type FunnelEventName
  = | 'landing_cta_clicked'
    | 'signup_submitted'
    | 'signup_succeeded'
    | 'signup_verification_required'
    | 'verification_resent'
    | 'onboarding_completed'

export function useFunnelEvents() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  async function trackFunnelEvent(eventName: FunnelEventName, metadata: Json = {}) {
    const { error } = await supabase
      .from('funnel_events')
      .insert({
        event_name: eventName,
        source: 'web',
        user_id: user.value?.id ?? null,
        metadata
      })

    if (error) {
      // Avoid blocking auth and onboarding UX on telemetry write failures.
      console.warn('Funnel event tracking failed', error.message)
    }
  }

  return {
    trackFunnelEvent
  }
}
