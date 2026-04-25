type CurtainPhase = 'idle' | 'covering' | 'exiting'

export function useCurtain() {
  const curtainPhase = useState<CurtainPhase>('curtain-phase', () => 'idle')

  function triggerCurtain(callback: () => void) {
    if (import.meta.server) {
      callback()
      return
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      callback()
      return
    }

    curtainPhase.value = 'covering'

    setTimeout(() => {
      callback()
      curtainPhase.value = 'exiting'

      setTimeout(() => {
        curtainPhase.value = 'idle'
      }, 650)
    }, 600)
  }

  return { curtainPhase: readonly(curtainPhase), triggerCurtain }
}
