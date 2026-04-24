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
  const { data: authData, error: authError } = await supabase.auth.getUser()
  const authUser = authData.user ?? user.value

  if (authError || !authUser?.id) {
    if (requiresAuth || isOnboardingPage) {
      return navigateTo('/login')
    }

    return
  }

  async function getOnboardingComplete() {
    const { data, error } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', authUser.id)
      .maybeSingle()

    if (error) {
      console.warn('Could not load onboarding status', error.message)
      return null
    }

    return Boolean(data?.onboarding_completed)
  }

  if (isAuthPage) {
    const complete = await getOnboardingComplete()

    if (complete === true) {
      return navigateTo('/dashboard')
    }

    if (complete === false) {
      return navigateTo('/onboarding')
    }

    return
  }

  if (isOnboardingPage) {
    const complete = await getOnboardingComplete()

    if (complete === true) {
      return navigateTo('/dashboard')
    }

    return
  }

  if (requiresAuth) {
    const complete = await getOnboardingComplete()

    if (complete === false) {
      return navigateTo('/onboarding')
    }
  }
})
