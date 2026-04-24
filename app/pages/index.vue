<script setup lang="ts">
const { data: page } = await useAsyncData('index', async () => {
  const rootPage = await queryCollection('content').path('/').first()

  if (rootPage) {
    return rootPage
  }

  return queryCollection('content').first()
})
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const { trackFunnelEvent } = useFunnelEvents()

const title = page.value?.seo?.title || page.value?.title
const description = page.value?.seo?.description || page.value?.description

useSeoMeta({
  title,
  ogTitle: title,
  description,
  ogDescription: description
})

const heroTitle = computed(() => {
  const [primary = '', ...secondaryParts] = (page.value?.title ?? '').split('\n')

  return {
    primary,
    secondary: secondaryParts.join(' ').trim()
  }
})

function enterMotion(delay: number = 0) {
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay }
  }
}

function scrollMotion(delay: number = 0) {
  return {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    inViewOptions: { once: true, amount: 1 },
    transition: { duration: 0.6, delay }
  }
}

function staggerMotion(index: number = 0) {
  return {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    inViewOptions: { once: true, amount: 1 },
    transition: { duration: 0.6, delay: index * 0.08 }
  }
}

function handleLandingCtaClick(link: { label?: string, to?: string }, placement: 'hero' | 'final-cta') {
  if (link.to !== '/signup') {
    return
  }

  trackFunnelEvent('landing_cta_clicked', {
    placement,
    label: link.label ?? 'Create account'
  })
}
</script>

<template>
  <div class="relative overflow-hidden">
    <AppHeader />

    <div v-if="page">
      <!-- Hero -->

      <UPageHero
        :ui="{
          root: 'pb-12 sm:pb-12',
          container: 'relative z-10 lg:py-12',
          wrapper: 'flex flex-col items-center',
          title: 'font-display sm:text-6xl lg:text-7xl xl:text-[82px] tracking-[-0.03em] leading-[1.02]',
          description: 'mt-5 max-w-xl mx-auto text-base sm:text-lg leading-relaxed text-default',
          links: 'gap-3'
        }"
      >
        <template #top>
          <Motion v-bind="staggerMotion(0)" />

          <Motion
            as="div"
            v-bind="enterMotion(0.1)"
            class="pt-3 mb-4 flex justify-center"
          >
            <img
              src="/logo.svg"
              alt="Sippd logo"
              class="h-44 sm:h-52 w-auto opacity-95 dark:invert animate-[var(--animate-vibe-float)]"
            >
          </Motion>

        </template>

        <template #headline>
          <Motion v-bind="enterMotion(0.2)">
            <UBadge
              color="neutral"
              variant="soft"
              :label="page.hero.headline"
              class="rounded-full px-4 py-1.5 gap-1.5 vibe-glass vibe-hairline"
            >
              <template #leading>
                <UChip
                  inset
                  standalone
                  :ui="{ base: 'animate-pulse ring-0' }"
                />
              </template>
            </UBadge>
          </Motion>
        </template>

        <template #title>
          <Motion
            as="span"
            v-bind="enterMotion(0.35)"
            class="inline-block"
          >
            {{ heroTitle.primary }}
            <br v-if="heroTitle.secondary">
            <span
              v-if="heroTitle.secondary"
              class="text-primary"
            >
              {{ heroTitle.secondary }}
            </span>
          </Motion>
        </template>

        <template #description>
          <Motion
            as="span"
            v-bind="enterMotion(0.5)"
            class="inline-block"
          >
            {{ page.description }}
          </Motion>
        </template>

        <template #links>
          <Motion
            class="flex flex-wrap justify-center gap-4"
            v-bind="enterMotion(0.65)"
          >
            <UButton
              v-for="link in page.hero.links"
              :key="link.label"
              v-bind="link"
              size="lg"
              class="min-w-40"
              @click="handleLandingCtaClick(link, 'hero')"
            />
          </Motion>
        </template>

        <Motion
          as-child
          v-bind="enterMotion(0.85)"
          class="max-w-2xl mx-auto w-full"
        >
          <HeroTerminal :lines="page.terminal.lines" />
        </Motion>

        <Motion
          class="max-w-lg mx-auto w-full"
          v-bind="scrollMotion(0.95)"
        >
          <UPageLogos
            :title="page.logos.title"
            :items="page.logos.items"
            :ui="{
              title: 'font-mono uppercase text-xs tracking-[0.12em] text-dimmed',
              logos: 'gap-0',
              logo: 'text-muted size-6'
            }"
          />
        </Motion>
      </UPageHero>

      <!-- Features -->
      <UPageSection
        id="features"
        :ui="{
          root: 'py-12 sm:py-12 scroll-mt-(--ui-header-height)',
          container: 'max-w-5xl',
          headline: 'font-mono font-medium text-xs text-primary uppercase tracking-[0.12em] text-center',
          title: 'max-w-lg mx-auto',
          description: 'max-w-md mx-auto text-dimmed'
        }"
      >
        <template #headline>
          <Motion
            as="span"
            v-bind="scrollMotion()"
            class="inline-block"
          >
            {{ page.features.headline }}
          </Motion>
        </template>

        <template #title>
          <Motion
            as="span"
            v-bind="scrollMotion(0.1)"
            class="inline-block"
          >
            {{ page.features.title }}
          </Motion>
        </template>

        <template #description>
          <Motion
            as="span"
            v-bind="scrollMotion(0.2)"
            class="inline-block"
          >
            {{ page.features.description }}
          </Motion>
        </template>

        <div class="vibe-surface rounded-2xl overflow-hidden">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px">
            <Motion
              v-for="(feature, index) in page.features.items"
              :key="feature.title"
              v-bind="staggerMotion(index)"
            >
              <UPageCard
                :icon="feature.icon"
                :title="feature.title"
                :description="feature.description"
                class="group rounded-none duration-300 hover:-translate-y-1 hover:bg-elevated/90"
                to="#"
                :ui="{
                  leading: 'mb-5 flex size-9 justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20 group-hover:bg-success/25 group-hover:ring-success/35 transition-colors',
                  title: 'text-sm tracking-tight',
                  description: 'text-sm leading-relaxed sm:line-clamp-2 lg:line-clamp-3 text-dimmed'
                }"
              />
            </Motion>
          </div>
        </div>
      </UPageSection>

      <!-- Metrics -->
      <UPageSection
        id="metrics"
        :ui="{
          root: 'py-12 sm:py-12 scroll-mt-(--ui-header-height)',
          container: 'max-w-5xl',
          headline: 'font-mono font-medium text-xs text-primary uppercase tracking-[0.12em] text-center',
          title: 'max-w-lg mx-auto',
          description: 'max-w-md mx-auto text-dimmed'
        }"
      >
        <template #headline>
          <Motion
            as="span"
            v-bind="scrollMotion()"
            class="inline-block"
          >
            {{ page.metrics.headline }}
          </Motion>
        </template>

        <template #title>
          <Motion
            as="span"
            v-bind="scrollMotion(0.1)"
            class="inline-block"
          >
            {{ page.metrics.title }}
          </Motion>
        </template>

        <template #description>
          <Motion
            as="span"
            v-bind="scrollMotion(0.2)"
            class="inline-block"
          >
            {{ page.metrics.description }}
          </Motion>
        </template>

        <div class="vibe-surface rounded-2xl overflow-hidden">
          <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-px">
            <Motion
              v-for="(metric, index) in page.metrics.items"
              :key="metric.label"
              v-bind="staggerMotion(index)"
            >
              <UPageCard
                :title="metric.value"
                :description="metric.label"
                class="rounded-none duration-300 hover:-translate-y-0.5 hover:bg-elevated/90"
                to="#"
                :ui="{
                  root: 'text-center',
                  wrapper: 'items-center',
                  title: ['text-4xl font-bold tracking-tight leading-none', metric.class],
                  description: 'font-mono text-xs uppercase tracking-[0.06em] text-dimmed mt-3'
                }"
              />
            </Motion>
          </div>
        </div>
      </UPageSection>

      <!-- CTA -->
      <UPageCTA
        variant="naked"
        :ui="{
          root: 'py-6 sm:py-6 scroll-mt-(--ui-header-height)',
          container: 'max-w-3xl text-center',
          title: 'lg:text-5xl tracking-tighter whitespace-pre-line',
          description: 'mx-auto max-w-lg leading-relaxed text-dimmed'
        }"
      >
        <template #title>
          <Motion
            as="span"
            v-bind="scrollMotion()"
            class="inline-block"
          >
            {{ page.cta.title }}
          </Motion>
        </template>

        <template #description>
          <Motion
            as="span"
            v-bind="scrollMotion(0.1)"
            class="inline-block"
          >
            {{ page.cta.description }}
          </Motion>
        </template>

        <template #links>
          <Motion
            class="flex flex-col items-center justify-center gap-6"
            v-bind="scrollMotion(0.2)"
          >
            <UButton
              v-for="link in page.cta.links"
              :key="link.label"
              v-bind="link"
              size="xl"
              class="min-w-52"
              @click="handleLandingCtaClick(link, 'final-cta')"
            />
          </Motion>
        </template>
      </UPageCTA>

    </div>
  </div>
</template>
