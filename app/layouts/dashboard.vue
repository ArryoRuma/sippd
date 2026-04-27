<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

const mobileSidebarQuery = '(max-width: 1023px)'
const open = ref(false)
const isMobileSidebar = ref(false)

function syncSidebarViewport(matches: boolean) {
  isMobileSidebar.value = matches
  open.value = !matches
}

watch(() => route.fullPath, () => {
  if (isMobileSidebar.value) {
    open.value = false
  }
})

onMounted(() => {
  const mediaQuery = window.matchMedia(mobileSidebarQuery)

  syncSidebarViewport(mediaQuery.matches)

  const handleChange = (event: MediaQueryListEvent) => {
    syncSidebarViewport(event.matches)
  }

  mediaQuery.addEventListener('change', handleChange)

  onBeforeUnmount(() => {
    mediaQuery.removeEventListener('change', handleChange)
  })
})

const links = [[{
  label: 'Home',
  icon: 'i-lucide-house',
  to: '/',
  onSelect: () => {
    open.value = false
  }
},
{
  label: 'Settings',
  icon: 'i-lucide-settings-2',
  to: '/settings',
  exact: true,
  onSelect: () => {
    open.value = false
  }
},
{
  label: 'My Sipps',
  to: '/my-sipps',
  icon: 'i-lucide-coffee',
  defaultOpen: true,
  type: 'trigger',
  children: [{
    label: 'SippLog',
    to: '/log',
    icon: 'i-lucide-scroll-text',
    exact: true,
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'SippScore',
    to: '/score',
    icon: 'i-lucide-star',
    exact: true,
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Insights',
    to: '/insights',
    icon: 'i-lucide-line-chart',
    exact: true,
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Wanna Sipp',
    to: '/wanna-sipp',
    icon: 'i-lucide-list-todo',
    onSelect: () => {
      open.value = false
    }
  }]
}], [{
  label: 'Feedback',
  icon: 'i-lucide-message-circle',
  to: 'https://github.com/nuxt-ui-templates/dashboard',
  target: '_blank'
}, {
  label: 'Help & Support',
  icon: 'i-lucide-info',
  to: 'https://github.com/nuxt-ui-templates/dashboard',
  target: '_blank'
}]] satisfies NavigationMenuItem[][]

const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: links.flat()
}, {
  id: 'settings',
  label: 'Settings',
  items: [{
    id: 'settings-overview',
    label: 'Open settings',
    icon: 'i-lucide-settings-2',
    to: '/settings'
  }, {
    id: 'settings-profile',
    label: 'Jump to profile',
    icon: 'i-lucide-user-round',
    to: '/settings#profile'
  }, {
    id: 'settings-preferences',
    label: 'Jump to preferences',
    icon: 'i-lucide-sliders-horizontal',
    to: '/settings#preferences'
  }, {
    id: 'settings-taste',
    label: 'Jump to taste profile',
    icon: 'i-lucide-sparkles',
    to: '/settings#taste'
  }]
}, {
  id: 'code',
  label: 'Code',
  items: [{
    id: 'source',
    label: 'View page source',
    icon: 'i-simple-icons-github',
    to: `https://github.com/nuxt-ui-templates/dashboard/blob/main/app/pages${route.path === '/' ? '/index' : route.path}.vue`,
    target: '_blank'
  }]
}])
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      :collapsible="!isMobileSidebar"
      :resizable="!isMobileSidebar"
      class="bg-muted border-r border-default max-lg:w-[min(18.5rem,calc(100vw-1rem))] max-lg:rounded-r-2xl max-lg:border-y max-lg:shadow-2xl"
      :ui="{ footer: 'lg:border-t lg:border-default', header: 'max-lg:pt-[max(env(safe-area-inset-top),0.75rem)]', body: 'max-lg:pb-[max(env(safe-area-inset-bottom),0.75rem)]' }"
    >
      <template #header="{ collapsed }">
        <AppBrand :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton
          :collapsed="collapsed"
          class="bg-transparent ring-default hover:ring-warning"
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />
  </UDashboardGroup>
</template>
