<template>
  <div class="relative mx-auto w-fit">
    <!-- Atmospheric glow behind phone -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
    >
      <div class="size-72 rounded-full bg-primary/20 blur-3xl" />
      <div class="absolute size-52 rounded-full bg-warning/20 blur-2xl" />
    </div>

    <!-- Phone frame -->
    <div class="relative w-[248px] rounded-[2.25rem] bg-cinnamon-wood-950 p-[3px] shadow-[0_48px_88px_-16px_color-mix(in_oklch,var(--color-cinnamon-wood-950)_50%,transparent)]">
      <!-- Screen -->
      <div
        class="overflow-hidden rounded-[2rem] bg-almond-cream-50"
        style="aspect-ratio:9/19.5;"
      >
        <!-- Dynamic island -->
        <div class="mx-auto mt-2 h-5 w-20 rounded-full bg-cinnamon-wood-950" />

        <!-- App content -->
        <div class="px-3 pt-3 pb-4 space-y-2">
          <!-- Header -->
          <div class="flex items-center justify-between">
            <span class="font-display font-bold text-[11px] text-cinnamon-wood-900 leading-none">Sip Log</span>
            <div class="size-5 rounded-full bg-primary/18 flex items-center justify-center">
              <span class="text-primary text-[10px] font-bold leading-none">+</span>
            </div>
          </div>

          <!-- Score summary card -->
          <div class="rounded-xl bg-primary/8 border border-primary/20 p-2.5 flex items-center gap-2">
            <div class="size-9 shrink-0 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <span class="font-display font-bold text-xs text-primary leading-none">9.1</span>
            </div>
            <div>
              <div class="font-semibold text-[10px] text-cinnamon-wood-900 leading-tight">
                Avg Sip Score
              </div>
              <div class="font-mono text-[9px] text-cinnamon-wood-500 leading-tight mt-0.5">
                14 sips this month
              </div>
            </div>
          </div>

          <!-- Coffee entry 1 -->
          <div class="rounded-xl bg-white/80 border border-cinnamon-wood-100 p-2.5">
            <div class="flex items-start justify-between mb-1.5">
              <div>
                <div class="font-semibold text-[10px] text-cinnamon-wood-900 leading-tight">
                  Ethiopia Guji
                </div>
                <div class="font-mono text-[9px] text-cinnamon-wood-500 leading-tight mt-0.5">
                  Sey · V60
                </div>
              </div>
              <div class="bg-primary/14 text-primary rounded-lg px-1.5 py-0.5 shrink-0 ml-2">
                <span class="text-[10px] font-bold leading-none">9.2</span>
              </div>
            </div>
            <div class="flex flex-wrap gap-1">
              <span class="text-[8px] bg-warning/20 text-almond-cream-700 rounded px-1.5 py-0.5 font-mono">jasmine</span>
              <span class="text-[8px] bg-warning/20 text-almond-cream-700 rounded px-1.5 py-0.5 font-mono">peach</span>
              <span class="text-[8px] bg-warning/20 text-almond-cream-700 rounded px-1.5 py-0.5 font-mono">bergamot</span>
            </div>
          </div>

          <!-- Coffee entry 2 -->
          <div class="rounded-xl bg-white/80 border border-cinnamon-wood-100 p-2.5">
            <div class="flex items-start justify-between mb-1.5">
              <div>
                <div class="font-semibold text-[10px] text-cinnamon-wood-900 leading-tight">
                  Kenya AA
                </div>
                <div class="font-mono text-[9px] text-cinnamon-wood-500 leading-tight mt-0.5">
                  Intelligentsia · Chemex
                </div>
              </div>
              <div class="bg-primary/14 text-primary rounded-lg px-1.5 py-0.5 shrink-0 ml-2">
                <span class="text-[10px] font-bold leading-none">8.7</span>
              </div>
            </div>
            <div class="flex flex-wrap gap-1">
              <span class="text-[8px] bg-warning/20 text-almond-cream-700 rounded px-1.5 py-0.5 font-mono">blackcurrant</span>
              <span class="text-[8px] bg-warning/20 text-almond-cream-700 rounded px-1.5 py-0.5 font-mono">tomato</span>
            </div>
          </div>

          <!-- Wanna Sip entry -->
          <div class="rounded-xl bg-success/8 border border-success/20 p-2.5 flex items-center gap-2">
            <div class="size-7 shrink-0 rounded-full bg-success/18 flex items-center justify-center">
              <span class="text-[10px] text-success">★</span>
            </div>
            <div>
              <div class="font-semibold text-[10px] text-cinnamon-wood-900 leading-tight">
                Colombia Huila
              </div>
              <div class="font-mono text-[9px] text-cinnamon-wood-500 leading-tight mt-0.5">
                Want to try · George Howell
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Home indicator bar -->
      <div class="flex justify-center py-1.5">
        <div class="h-1 w-16 rounded-full bg-almond-cream-200/60" />
      </div>
    </div>
  </div>
</template>
