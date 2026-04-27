<script setup lang="ts">
const props = defineProps<{
  value: string
  colorClass: string
}>()

const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

// Parse numeric value and optional suffix/prefix from strings like "5+", "9.1", "< 10s"
const parsed = computed(() => {
  const m = props.value.match(/^([\d.]+)(.*)$/)
  if (m?.[1]) return { num: parseFloat(m[1]), suffix: m[2] ?? '', prefix: '' }
  return null
})

const displayed = ref(0)
const animated = ref(false)
const el = ref<HTMLElement | null>(null)

useIntersectionObserver(
  el,
  ([entry]) => {
    if (!entry?.isIntersecting || animated.value) return
    animated.value = true
    if (!parsed.value || prefersReducedMotion.value) return

    const target = parsed.value.num
    const duration = 900
    const startTime = performance.now()

    function tick(now: number) {
      const t = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      displayed.value = target * eased
      if (t < 1) requestAnimationFrame(tick)
      else displayed.value = target
    }

    requestAnimationFrame(tick)
  },
  { threshold: 0.5 }
)

const displayText = computed(() => {
  if (!parsed.value || !animated.value || prefersReducedMotion.value) return props.value
  const { num, suffix, prefix } = parsed.value
  const d = displayed.value
  const rounded = Number.isInteger(num) ? Math.round(d) : Math.round(d * 10) / 10
  return `${prefix}${rounded}${suffix}`
})
</script>

<template>
  <span
    ref="el"
    :class="colorClass"
  >{{ displayText }}</span>
</template>
