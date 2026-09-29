export interface ToastItem {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

export interface ConfirmDialogOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
}

const toastsState = ref<ToastItem[]>([])

const confirmModalState = ref<{
  isOpen: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
  isDestructive: boolean
  resolve: ((value: boolean) => void) | null
}>({
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Confirmer',
  cancelText: 'Annuler',
  isDestructive: true,
  resolve: null
})

export function useNotify() {
  const showToast = (message: string, type: ToastItem['type'] = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9)
    toastsState.value.push({ id, type, message, duration })

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id)
      }, duration)
    }
  }

  const dismissToast = (id: string) => {
    toastsState.value = toastsState.value.filter(t => t.id !== id)
  }

  const confirmAction = (options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      confirmModalState.value = {
        isOpen: true,
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || 'Confirmer',
        cancelText: options.cancelText || 'Annuler',
        isDestructive: options.isDestructive ?? true,
        resolve
      }
    })
  }

  const resolveConfirm = (confirmed: boolean) => {
    if (confirmModalState.value.resolve) {
      confirmModalState.value.resolve(confirmed)
    }
    confirmModalState.value.isOpen = false
    confirmModalState.value.resolve = null
  }

  return {
    toasts: readonly(toastsState),
    confirmState: readonly(confirmModalState),
    toast: {
      success: (msg: string, dur?: number) => showToast(msg, 'success', dur),
      error: (msg: string, dur?: number) => showToast(msg, 'error', dur),
      warning: (msg: string, dur?: number) => showToast(msg, 'warning', dur),
      info: (msg: string, dur?: number) => showToast(msg, 'info', dur)
    },
    dismissToast,
    confirmAction,
    resolveConfirm
  }
}
