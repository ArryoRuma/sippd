<template>
  <UDropdownMenu
    v-slot="{ open }"
    :modal="false"
    :items="[{
      label: 'Starter',
      to: 'https://starter-template.nuxt.dev/'
    }, {
      label: 'Landing',
      to: 'https://landing-template.nuxt.dev/',
      color: 'primary',
      checked: true,
      type: 'checkbox'
    }, {
      label: 'Docs',
      to: 'https://docs-template.nuxt.dev/'
    }, {
      label: 'SaaS',
      to: 'https://saas-template.nuxt.dev/'
    }, {
      label: 'Dashboard',
      to: 'https://dashboard-template.nuxt.dev/'
    }, {
      label: 'Chat',
      to: 'https://chat-template.nuxt.dev/'
    }, {
      label: 'Portfolio',
      to: 'https://portfolio-template.nuxt.dev/'
    }, {
      label: 'Changelog',
      to: 'https://changelog-template.nuxt.dev/'
    }]"
    :content="{ align: 'start' }"
    :ui="{ content: 'min-w-fit' }"
    size="xs"
  >
    <UButton
      label="Landing"
      variant="subtle"
      trailing-icon="i-lucide-chevron-down"
      size="xs"
      class="-mb-[6px] truncate rounded-full font-semibold"
      :class="[open && 'bg-warning/18 ring-1 ring-warning/25 text-[color:var(--vibe-accent-ink)]']"
      :ui="{
        trailingIcon: ['transition-transform duration-200', open ? 'rotate-180' : undefined].filter(Boolean).join(' ')
      }"
    />
  </UDropdownMenu>
</template>
