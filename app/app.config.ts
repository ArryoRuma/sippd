export default defineAppConfig({
  ui: {
    colors: {
      primary: 'chestnut',
      info: 'cinnamon-wood',
      success: 'lime',
      warning: 'almond-cream',
      error: 'mahogany-red',
      neutral: 'zinc'
    },
    button: {
      slots: {
        base: 'font-semibold rounded-xl transition-all duration-200'
      },
      variants: {
        size: {
          xs: {
            base: 'px-3'
          },
          sm: {
            base: 'px-4'
          },
          md: {
            base: 'px-4'
          },
          lg: {
            base: 'px-5'
          },
          xl: {
            base: 'px-6'
          }
        },
        variant: {
          ghost: {
            base: 'hover:bg-elevated'
          }
        }
      },
      compoundVariants: [
        {
          color: 'primary' as const,
          variant: 'solid' as const,
          class: 'hover:bg-primary active:bg-primary shadow-[0_0_20px_var(--btn-glow)] hover:shadow-[0_0_30px_var(--btn-glow-hover)] hover:-translate-y-px active:translate-y-0 ring-1 ring-primary/18 [--btn-glow:color-mix(in_oklch,var(--ui-primary)_24%,transparent)] [--btn-glow-hover:color-mix(in_oklch,var(--ui-primary)_34%,transparent)]'
        },
        {
          color: 'success' as const,
          variant: 'soft' as const,
          class: 'ring-1 ring-success/25 text-success hover:bg-success/18'
        }
      ]
    },
    card: {
      slots: {
        root: 'rounded-2xl border border-default/80 bg-elevated/70 backdrop-blur-sm shadow-[0_12px_30px_-20px_color-mix(in_oklch,var(--ui-primary)_26%,transparent)]'
      }
    },
    badge: {
      slots: {
        base: 'font-mono uppercase tracking-[0.08em] rounded-full'
      }
    }
  }
})
