<!-- index.vue
     Public landing page. Content is driven by the Nuxt Content collection at
     content/index.yml, so copy and structure can be updated without touching
     Vue code. Motion primitives add staggered entrance and scroll-triggered
     reveal animations to reinforce the brand's purposeful-motion principle. -->
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

// useAsyncData fetches the CMS page record during SSR and caches it.
// Falling back to queryCollection().first() handles the case where a root
// path entry does not exist yet.
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
    secondary: secondaryParts.join(' ').trim(),
    words: primary.split(' ').filter(Boolean)
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

// enterMotion and scrollMotion produce @nuxt/motion props for entrance
// and viewport-triggered animations respectively. Keeping them as helpers
// prevents duplicating the same transition object across every element.
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

// staggerMotion offsets each item in a list by (index * 0.08s) so grid
// children fade in sequentially rather than all at once.
function staggerMotion(index: number = 0) {
  return {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    inViewOptions: { once: true, amount: 1 },
    transition: { duration: 0.6, delay: index * 0.08 }
  }
}

function scrollMotionX(delay: number = 0, fromLeft: boolean = true) {
  return {
    initial: { opacity: 0, x: fromLeft ? -24 : 24 },
    whileInView: { opacity: 1, x: 0 },
    inViewOptions: { once: true, amount: 0.3 },
    transition: { duration: 0.6, delay }
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

// triggerCurtain plays the page-transition curtain animation before
// navigating, keeping route changes visually smooth.
const { triggerCurtain } = useCurtain()

// ctaLinkProps strips `to` from a link object so it can be spread onto
// UButton without UButton trying to render as a NuxtLink when we are
// handling navigation manually via handleCtaClick.
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

const { y: scrollY } = useWindowScroll()
const scrolledPastHero = computed(() => scrollY.value > 100)
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

const buttonStyles = reactive<Record<string, { transform: string }>>({})

function onButtonMouseMove(event: MouseEvent, key: string) {
  if (prefersReducedMotion.value) return
  const el = event.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const dx = Math.max(-6, Math.min(6, (event.clientX - (rect.left + rect.width / 2)) * 0.18))
  const dy = Math.max(-6, Math.min(6, (event.clientY - (rect.top + rect.height / 2)) * 0.18))
  buttonStyles[key] = { transform: `translate3d(${dx}px, ${dy}px, 0) scale(1.02)` }
}

function onButtonMouseLeave(key: string) {
  buttonStyles[key] = { transform: '' }
}

const featureTints = [
  'bg-warning/8',
  'bg-primary/6',
  'bg-success/6',
  'bg-warning/8',
  'bg-primary/6',
  'bg-success/6'
] as const

// SplashScreen is shown only once per browser session using sessionStorage
// as a lightweight, non-persistent flag.
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

    <GradientGlow variant="hero" />

    <!-- Oversize background word -->
    <span
      aria-hidden="true"
      class="pointer-events-none select-none absolute top-[10%] inset-x-0 flex items-center justify-center overflow-hidden z-0"
    >
      <span class="font-display font-black leading-none tracking-tight uppercase whitespace-nowrap opacity-[0.06] text-[clamp(8rem,25vw,22rem)]">
        TASTE
      </span>
    </span>

    <AppHeader />

    <div
      v-if="page"
      class="relative z-10"
    >
      <!-- Hero -->
      <div class="relative min-h-[100dvh] flex flex-col justify-center">
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
            <span class="inline-flex flex-wrap justify-center gap-x-[0.3em]">
              <Motion
                v-for="(word, i) in heroTitle.words"
                :key="word + i"
                as="span"
                v-bind="enterMotion(0.3 + i * 0.12)"
                class="inline-block text-primary"
              >
                {{ word }}
              </Motion>
            </span>
            <br>
            <Motion
              as="span"
              v-bind="enterMotion(0.55)"
              class="inline-block"
            >
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
              <span
                v-for="link in page.hero.links"
                :key="link.label"
                class="inline-block transition-transform duration-150 ease-out"
                :style="buttonStyles[link.label]"
                @mousemove="(e: MouseEvent) => onButtonMouseMove(e, link.label)"
                @mouseleave="onButtonMouseLeave(link.label)"
              >
                <UButton
                  v-bind="ctaLinkProps(link)"
                  size="lg"
                  class="min-w-40 rounded-xl"
                  @click="handleCtaClick(link, 'hero')"
                />
              </span>
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

        <!-- Scroll indicator -->
        <Motion
          class="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center gap-1 text-cinnamon-wood-400"
          :animate="{ opacity: scrolledPastHero ? 0 : 0.7 }"
          :transition="{ duration: 0.5 }"
        >
          <Motion
            :animate="{ y: [0, 8, 0] }"
            :transition="{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }"
          >
            <UIcon
              name="i-lucide-chevrons-down"
              class="size-5"
            />
          </Motion>
        </Motion>
      </div>

      <!-- App Preview section -->
      <section
        v-if="page.appPreview"
        class="py-16 sm:py-24 px-4 sm:px-6"
      >
        <div class="max-w-5xl mx-auto">
          <div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <!-- Phone mockup -->
            <Motion
              v-bind="{ initial: { opacity: 0, y: 32 }, whileInView: { opacity: 1, y: 0 }, inViewOptions: { once: true, amount: 0.2 }, transition: { duration: 0.7, delay: 0.1 } }"
              class="flex justify-center order-2 lg:order-1"
            >
              <AppPreview />
            </Motion>

            <!-- Text content -->
            <div class="flex flex-col gap-6 order-1 lg:order-2">
              <Motion
                v-bind="scrollMotion(0)"
                class="flex flex-col gap-3"
              >
                <span
                  v-if="page.appPreview.headline"
                  class="font-mono font-medium text-xs text-primary uppercase tracking-[0.12em]"
                >
                  {{ page.appPreview.headline }}
                </span>
                <h2 class="font-display text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-cinnamon-wood-900">
                  {{ page.appPreview.title }}
                </h2>
                <p class="text-base leading-relaxed text-cinnamon-wood-600">
                  {{ page.appPreview.description }}
                </p>
              </Motion>

              <div class="flex flex-col gap-2.5">
                <Motion
                  v-for="(feature, i) in page.appPreview.features"
                  :key="feature.title"
                  v-bind="scrollMotion(0.1 + i * 0.1)"
                  class="flex items-start gap-3 p-3.5 rounded-xl vibe-surface"
                >
                  <div class="size-8 shrink-0 rounded-lg bg-primary/14 ring-1 ring-primary/20 flex items-center justify-center">
                    <UIcon
                      :name="feature.icon"
                      class="size-4 text-primary"
                    />
                  </div>
                  <div>
                    <div class="font-semibold text-sm text-cinnamon-wood-900 leading-tight">
                      {{ feature.title }}
                    </div>
                    <div class="text-sm text-cinnamon-wood-600 mt-0.5 leading-relaxed">
                      {{ feature.description }}
                    </div>
                  </div>
                </Motion>
              </div>
            </div>
          </div>
        </div>
      </section>

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
          <!-- Features: alternating full-width rows -->
          <template v-if="section.kind === 'features'">
            <div class="flex flex-col gap-3 p-3">
              <Motion
                v-for="(item, index) in section.items"
                :key="isFeatureItem(item) ? (item as FeatureItem).title : String(index)"
                v-bind="scrollMotionX(index * 0.08, index % 2 === 0)"
                class="flex flex-col sm:flex-row items-start gap-5 p-5 rounded-xl"
                :class="[featureTints[index % featureTints.length], index % 2 !== 0 ? 'sm:flex-row-reverse' : '']"
              >
                <!-- Icon with halo -->
                <div class="relative shrink-0 mt-0.5">
                  <div
                    class="absolute inset-0 -m-2 rounded-full blur-xl opacity-50"
                    :class="index % 3 === 0 ? 'bg-warning/50' : index % 3 === 1 ? 'bg-primary/40' : 'bg-success/40'"
                  />
                  <div
                    class="relative size-12 rounded-xl flex items-center justify-center ring-1"
                    :class="index % 3 === 0 ? 'bg-warning/16 ring-warning/25' : index % 3 === 1 ? 'bg-primary/14 ring-primary/25' : 'bg-success/12 ring-success/25'"
                  >
                    <UIcon
                      v-if="isFeatureItem(item)"
                      :name="(item as FeatureItem).icon"
                      class="size-6"
                      :class="index % 3 === 0 ? 'text-warning' : index % 3 === 1 ? 'text-primary' : 'text-success'"
                    />
                  </div>
                </div>

                <!-- Text -->
                <div
                  v-if="isFeatureItem(item)"
                  class="flex flex-col gap-1"
                  :class="index % 2 !== 0 ? 'sm:text-right' : ''"
                >
                  <h3 class="font-display font-bold text-lg text-cinnamon-wood-900 leading-tight">
                    {{ (item as FeatureItem).title }}
                  </h3>
                  <p class="text-sm leading-relaxed text-cinnamon-wood-600 max-w-md">
                    {{ (item as FeatureItem).description }}
                  </p>
                </div>
              </Motion>
            </div>
          </template>

          <!-- Metrics: big numbers with animated counters -->
          <template v-else>
            <div class="grid sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/50">
              <Motion
                v-for="(item, index) in section.items"
                :key="(item as MetricItem).label"
                v-bind="staggerMotion(index)"
                class="flex flex-col items-center justify-center gap-2 py-10 px-6 text-center"
              >
                <MetricCounter
                  :value="(item as MetricItem).value"
                  :color-class="(item as MetricItem).class"
                  class="font-display font-bold leading-none tracking-tight"
                  style="font-size: clamp(2.6rem, 5.5vw, 4rem);"
                />
                <span class="font-mono text-xs uppercase tracking-[0.08em] text-cinnamon-wood-500 leading-tight max-w-28">
                  {{ (item as MetricItem).label }}
                </span>
              </Motion>
            </div>
          </template>
        </div>
      </UPageSection>

      <!-- CTA — dark section -->
      <section class="relative bg-cinnamon-wood-950 overflow-hidden">
        <GradientGlow variant="section" />
        <div class="relative z-10 py-20 sm:py-28 px-4 sm:px-6 max-w-3xl mx-auto text-center">
          <!-- Command line display -->
          <Motion
            v-bind="scrollMotion()"
            class="inline-block mb-8"
          >
            <code class="font-mono text-xs text-almond-cream-300/80 bg-almond-cream-50/8 border border-almond-cream-50/12 rounded-xl px-4 py-2.5 tracking-wide">
              <span class="opacity-50">$ </span>{{ page.cta.command }}
            </code>
          </Motion>

          <!-- Title -->
          <Motion
            as="div"
            v-bind="scrollMotion(0.1)"
          >
            <h2 class="font-display font-bold text-4xl sm:text-5xl lg:text-[3.5rem] tracking-tight leading-tight text-almond-cream-50 whitespace-pre-line mb-5">
              {{ page.cta.title }}
            </h2>
          </Motion>

          <!-- Description -->
          <Motion
            as="div"
            v-bind="scrollMotion(0.2)"
          >
            <p class="text-base sm:text-lg leading-relaxed text-almond-cream-200/70 max-w-xl mx-auto mb-10">
              {{ page.cta.description }}
            </p>
          </Motion>

          <!-- Links -->
          <Motion
            class="flex flex-col items-center justify-center gap-3"
            v-bind="scrollMotion(0.3)"
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
        </div>
      </section>
    </div>
  </div>
</template>
