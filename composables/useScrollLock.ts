import { ref, watch, onUnmounted, type Ref, type ComputedRef } from 'vue'

const activeLockCount = ref(0)

/**
 * Verrouille le défilement de l'arrière-plan (body & html) lors de l'ouverture d'une modale, popup ou bottom sheet.
 * Gère un compteur de verrous pour supporter l'empilement de plusieurs dialogues sans conflit.
 */
export function useScrollLock(isOpen?: Ref<boolean> | ComputedRef<boolean>) {
  const lock = () => {
    if (typeof document === 'undefined') return
    activeLockCount.value++
    if (activeLockCount.value === 1) {
      document.body.classList.add('overflow-hidden')
      document.documentElement.classList.add('overflow-hidden')
    }
  }

  const unlock = () => {
    if (typeof document === 'undefined') return
    activeLockCount.value = Math.max(0, activeLockCount.value - 1)
    if (activeLockCount.value === 0) {
      document.body.classList.remove('overflow-hidden')
      document.documentElement.classList.remove('overflow-hidden')
    }
  }

  if (isOpen) {
    let wasLocked = false

    watch(
      isOpen,
      (open) => {
        if (open && !wasLocked) {
          lock()
          wasLocked = true
        } else if (!open && wasLocked) {
          unlock()
          wasLocked = false
        }
      },
      { immediate: true }
    )

    onUnmounted(() => {
      if (wasLocked) {
        unlock()
        wasLocked = false
      }
    })
  }

  return { lock, unlock, activeLockCount }
}
