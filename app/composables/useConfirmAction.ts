export function useConfirmAction() {
  const isOpen = ref(false)
  const isPending = ref(false)
  const title = ref('')
  const description = ref('')
  const pendingAction = ref<null | (() => Promise<void>)>(null)

  function requestConfirmation(options: {
    title: string
    description: string
    action: () => Promise<void>
  }) {
    title.value = options.title
    description.value = options.description
    pendingAction.value = options.action
    isOpen.value = true
  }

  async function confirmAction() {
    if (!pendingAction.value || isPending.value) return

    isPending.value = true

    try {
      await pendingAction.value()
      isOpen.value = false
      pendingAction.value = null
    } finally {
      isPending.value = false
    }
  }

  function cancelAction() {
    isOpen.value = false
    pendingAction.value = null
  }

  return {
    cancelAction,
    confirmAction,
    description,
    isOpen,
    isPending,
    requestConfirmation,
    title
  }
}
