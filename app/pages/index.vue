<script setup lang="ts">
type FeatureItem = {
  icon: string
  title: string
  description: string
}

type MetricItem = {
  value: string
  label: string
  class: string
}

type SectionKind = 'features' | 'metrics'

type LandingSection = {
  id: string
  kind: SectionKind
  headline?: string
  title: string
  description: string
  items: Array<FeatureItem | MetricItem>
}

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

const heroUi = {
  root: 'pb-4 sm:pb-5',
  container: 'relative z-10 lg:py-6',
  wrapper: 'flex flex-col items-center',
  title: 'font-display sm:text-6xl lg:text-7xl xl:text-[82px] tracking-[-0.03em] leading-[1.02]',
  description: 'mt-2 max-w-2xl mx-auto text-balance text-base sm:text-lg leading-relaxed text-cinnamon-wood-700',
  links: 'gap-2'
} as const

const sectionUi = {
  root: 'py-12 sm:py-12 scroll-mt-(--ui-header-height)',
  container: 'max-w-5xl',
  headline: 'font-mono font-medium text-xs text-primary uppercase tracking-[0.12em] text-center',
  title: 'max-w-lg mx-auto',
  description: 'max-w-md mx-auto text-cinnamon-wood-600'
} as const

const sectionGridClasses: Record<SectionKind, string> = {
  features: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px',
  metrics: 'grid sm:grid-cols-2 lg:grid-cols-4 gap-px'
}

const sectionSurfaceClasses: Record<SectionKind, string> = {
  features: 'vibe-surface rounded-2xl overflow-hidden',
  metrics: 'vibe-surface rounded-2xl overflow-hidden'
}

const sections = computed<LandingSection[]>(() => {
  const content = page.value

  if (!content) {
    return []
  }

  return [
    {
      id: 'features',
      kind: 'features',
      headline: content.features.headline,
      title: content.features.title,
      description: content.features.description,
      items: content.features.items
    },
    {
      id: 'metrics',
      kind: 'metrics',
      headline: content.metrics.headline,
      title: content.metrics.title,
      description: content.metrics.description,
      items: content.metrics.items
    }
  ]
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

function isFeatureItem(item: FeatureItem | MetricItem): item is FeatureItem {
  return 'icon' in item
}

const { triggerCurtain } = useCurtain()

function ctaLinkProps(link: Record<string, unknown>) {
  const { to: _to, ...rest } = link
  return rest
}

function handleCtaClick(link: { label?: string, to?: string } & Record<string, unknown>, placement: 'hero' | 'final-cta') {
  handleLandingCtaClick(link, placement)
  if (!link.to) return
  const dest = link.to
  triggerCurtain(() => navigateTo(dest))
}

const showSplash = ref(false)

onMounted(() => {
  if (!sessionStorage.getItem('sippd-splash-seen')) {
    showSplash.value = true
  }
})
</script>

<template>
  <div class="relative overflow-hidden">
    <ClientOnly>
      <SplashScreen
        v-if="showSplash"
        @done="showSplash = false"
      />
    </ClientOnly>

    <!-- Oversize background word -->
    <span
      aria-hidden="true"
      class="pointer-events-none select-none absolute top-[10%] inset-x-0 flex items-center justify-center overflow-hidden z-0"
    >
      <span class="font-display font-black leading-none tracking-tight uppercase whitespace-nowrap opacity-[0.04] text-[clamp(8rem,25vw,22rem)]">
        TASTE
      </span>
    </span>

    <AppHeader />

    <div
      v-if="page"
      class="relative z-10"
    >
      <!-- Hero -->

      <UPageHero
        :ui="heroUi"
      >
        <template #top>
          <Motion v-bind="staggerMotion(0)" />

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
            <span class="text-primary">{{ heroTitle.primary }}</span>
            <br>
            <img
              src="/logo-copy.svg"
              alt="Sippd"
              class="inline-block h-28 sm:h-36 lg:h-44 w-auto dark:invert animate-[var(--animate-vibe-float)]"
            >
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
            class="flex flex-wrap justify-center gap-2 sm:gap-3"
            v-bind="enterMotion(0.65)"
          >
            <UButton
              v-for="link in page.hero.links"
              :key="link.label"
              v-bind="ctaLinkProps(link)"
              size="lg"
              class="min-w-40 rounded-xl"
              @click="handleCtaClick(link, 'hero')"
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
              title: 'font-mono uppercase text-xs tracking-[0.12em] text-cinnamon-wood-500',
              logos: 'gap-0',
              logo: 'text-muted size-6'
            }"
          />
        </Motion>
      </UPageHero>

      <UPageSection
        v-for="(section, sectionIndex) in sections"
        :id="section.id"
        :key="section.id"
        :ui="{
          ...sectionUi,
          root: sectionIndex === 0
            ? 'pt-6 pb-4 sm:pt-7 sm:pb-5 scroll-mt-(--ui-header-height)'
            : 'pt-1 pb-6 sm:pt-1 sm:pb-8 scroll-mt-(--ui-header-height)'
        }"
      >
        <template #headline>
          <Motion
            as="span"
            v-bind="scrollMotion()"
            class="inline-block"
          >
            {{ section.headline }}
          </Motion>
        </template>

        <template #title>
          <Motion
            as="span"
            v-bind="scrollMotion(0.1)"
            class="inline-block"
          >
            {{ section.title }}
          </Motion>
        </template>

        <template #description>
          <Motion
            as="span"
            v-bind="scrollMotion(0.2)"
            class="inline-block"
          >
            {{ section.description }}
          </Motion>
        </template>

        <div :class="sectionSurfaceClasses[section.kind]">
          <div :class="sectionGridClasses[section.kind]">
            <Motion
              v-for="(item, index) in section.items"
              :key="section.kind === 'features' && isFeatureItem(item) ? item.title : (item as MetricItem).label"
              v-bind="staggerMotion(index)"
            >
              <UPageCard
                v-if="section.kind === 'features' && isFeatureItem(item)"
                :icon="item.icon"
                :title="item.title"
                :description="item.description"
                class="group rounded-none px-1 duration-300 hover:-translate-y-1 hover:bg-elevated/95"
                to="#"
                :ui="{
                  root: 'h-full',
                  body: 'h-full',
                  leading: 'mb-5 flex size-10 justify-center rounded-xl bg-warning/16 ring-1 ring-warning/25 group-hover:bg-primary/14 group-hover:ring-primary/30 transition-colors',
                  title: 'text-sm tracking-tight',
                  description: 'text-sm leading-relaxed sm:line-clamp-2 lg:line-clamp-3 text-cinnamon-wood-600'
                }"
              />

              <UPageCard
                v-else
                :title="(item as MetricItem).value"
                :description="(item as MetricItem).label"
                class="rounded-none duration-300 hover:-translate-y-0.5 hover:bg-elevated/95"
                to="#"
                :ui="{
                  root: 'text-center',
                  wrapper: 'items-center',
                  title: ['text-4xl font-bold tracking-tight leading-none', (item as MetricItem).class],
                  description: 'font-mono text-xs uppercase tracking-[0.06em] text-cinnamon-wood-500 mt-3'
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
          root: 'py-2 sm:py-4 scroll-mt-(--ui-header-height)',
          container: 'max-w-3xl text-center',
          title: 'lg:text-5xl tracking-tighter whitespace-pre-line',
          description: 'mx-auto max-w-2xl leading-relaxed text-cinnamon-wood-700 mt-2'
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
            class="flex flex-col items-center justify-center gap-3"
            v-bind="scrollMotion(0.2)"
          >
            <UButton
              v-for="link in page.cta.links"
              :key="link.label"
              v-bind="ctaLinkProps(link)"
              size="xl"
              class="min-w-52 rounded-xl"
              @click="handleCtaClick(link, 'final-cta')"
            />
          </Motion>
        </template>
      </UPageCTA>
    </div>
  </div>
</template>
