const AUTH_PAGES = new Set(['/login', '/signup', '/confirm'])
const PROTECTED_PAGES = new Set(['/dashboard', '/log', '/score', '/insights', '/wanna-sipp'])

export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()

  const requiresAuth = PROTECTED_PAGES.has(to.path)
  const isAuthPage = AUTH_PAGES.has(to.path)
  const isOnboardingPage = to.path === '/onboarding'

  if (!user.value) {
    if (requiresAuth || isOnboardingPage) {
      return navigateTo('/login')
    }

    return
  }

  const supabase = useSupabaseClient()
  const userId = user.value.id

  async function getOnboardingComplete() {
    const { data, error } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      // Missing profile is treated as not completed so users are guided to onboarding.
      return false
    }

    return Boolean(data?.onboarding_completed)
  }

  if (isAuthPage) {
    const complete = await getOnboardingComplete()
    return navigateTo(complete ? '/dashboard' : '/onboarding')
  }

  if (isOnboardingPage) {
    const complete = await getOnboardingComplete()

    if (complete) {
      return navigateTo('/dashboard')
    }

    return
  }

  if (requiresAuth) {
    const complete = await getOnboardingComplete()

    if (!complete) {
      return navigateTo('/onboarding')
    }
  }
})
