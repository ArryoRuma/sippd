<script setup lang="ts">
import { motion } from 'motion-v'
import type { VariantType } from 'motion-v'

const nuxtApp = useNuxtApp()
const user = useSupabaseUser()
const activeSection = ref<string>()

const items = computed(() => [
  {
    label: 'Features',
    to: '#features',
    exactHash: true,
    active: activeSection.value === 'features'
  },
  {
    label: 'Metrics',
    to: '#metrics',
    exactHash: true,
    active: activeSection.value === 'metrics'
  }
])

nuxtApp.hooks.hookOnce('page:loading:end', () => {
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.find(e => e.isIntersecting)
    if (visible) {
      activeSection.value = visible.target.id
    } else if (entries.every(e => !e.isIntersecting)) {
      activeSection.value = undefined
    }
  }, { rootMargin: '-50% 0px -50% 0px' })

  document.querySelectorAll('#features, #metrics').forEach(el => observer.observe(el))
})

const variants: Record<string, VariantType | ((custom: unknown) => VariantType)> = {
  normal: {
    rotate: 0,
    y: 0,
    opacity: 1
  },
  close: (custom: unknown) => {
    const c = custom as number
    return {
      rotate: c === 1 ? 45 : c === 3 ? -45 : 0,
      y: c === 1 ? 6 : c === 3 ? -6 : 0,
      opacity: c === 2 ? 0 : 1,
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 20
      }
    }
  }
}
</script>

<template>
  <UHeader
    class="vibe-glass border-b border-default/70"
    :ui="{ container: 'relative overflow-hidden' }"
  >
    <div class="vibe-orb -left-16 top-[-3rem] size-48 opacity-60" style="background: radial-gradient(circle, color-mix(in oklch, var(--ui-primary) 22%, transparent) 0%, transparent 68%);" />
    <div class="vibe-orb -right-20 top-[-3.5rem] size-56 opacity-60" style="background: radial-gradient(circle, color-mix(in oklch, var(--vibe-accent) 22%, transparent) 0%, transparent 72%); animation-delay: 1.2s;" />

    <template #left>
      <NuxtLink to="/">
        <img
          src="/logo-horiz.svg"
          class="h-16 w-auto shrink-0 transition-transform duration-300 hover:scale-[1.02]"
          alt="Sippd"
        >
      </NuxtLink>

      <!--  <TemplateMenu /> -->
    </template>

    <!-- <UNavigationMenu
      :items="items"
      variant="link"
    /> -->

    <template #right>
      <ClientOnly>
        <UColorModeButton />
      </ClientOnly>
      <template v-if="!user">
        <UButton
          label="Sign in"
          color="neutral"
          variant="ghost"
          class="hidden lg:flex rounded-xl"
          to="/login"
        />
        <UButton
          label="Create account"
          color="primary"
          class="hidden lg:flex"
          to="/signup"
        />
      </template>
      <UButton
        v-if="user"
        label="Dashboard"
        color="primary"
        class="hidden lg:flex"
        to="/dashboard"
      />
    </template>

    <template #toggle="{ open, toggle, ui }">
      <UButton
        size="sm"
        variant="ghost"
        color="neutral"
        square
        :aria-label="open ? 'Close navigation' : 'Open navigation'"
        :aria-expanded="open"
        :class="ui.toggle({ toggleSide: 'right' })"
        @click="toggle"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="size-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <motion.line
            x1="4"
            y1="6"
            x2="20"
            y2="6"
            :variants="variants"
            :animate="open ? 'close' : 'normal'"
            :custom="1"
            class="outline-none"
          />
          <motion.line
            x1="4"
            y1="12"
            x2="20"
            y2="12"
            :variants="variants"
            :animate="open ? 'close' : 'normal'"
            :custom="2"
            class="outline-none"
          />
          <motion.line
            x1="4"
            y1="18"
            x2="20"
            y2="18"
            :variants="variants"
            :animate="open ? 'close' : 'normal'"
            :custom="3"
            class="outline-none"
          />
        </svg>
      </UButton>
    </template>

    <template #body>
      <UNavigationMenu
        :items="items"
        orientation="vertical"
      />

      <div class="mt-4 flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="text-sm text-muted">Color mode</span>
          <ClientOnly>
            <UColorModeButton />
          </ClientOnly>
        </div>
        <UButton
          v-if="!user"
          label="Sign in"
          color="neutral"
          variant="soft"
          class="rounded-xl"
          block
          to="/login"
        />
        <UButton
          v-if="!user"
          label="Create account"
          color="primary"
          block
          to="/signup"
        />
        <UButton
          v-if="user"
          label="Dashboard"
          block
          to="/dashboard"
        />
      </div>
    </template>
  </UHeader>
</template>
