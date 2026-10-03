import { ref, computed } from 'vue'

export interface UseBottomSheetDragOptions {
  threshold?: number
  onClose: () => void
}

/**
 * Composable pour permettre la fermeture par glissement vers le bas (swipe/drag to dismiss)
 * d'une bottom sheet sur mobile depuis la poignée (handle).
 *
 * - Si le glissement dépasse le seuil (ou flick rapide) : animation fluide vers le bas et appel de onClose.
 * - Si le glissement est insuffisant : animation de retour élastique (snap back) à l'état initial d'ouverture.
 */
export function useBottomSheetDrag(options: UseBottomSheetDragOptions | (() => void)) {
  const onClose = typeof options === 'function' ? options : options.onClose
  const threshold = typeof options === 'object' && options.threshold ? options.threshold : 85

  const sheetRef = ref<HTMLElement | null>(null)
  const isDragging = ref(false)
  const isResetting = ref(false)
  const isClosing = ref(false)
  const isDragClosed = ref(false)
  const translateY = ref(0)

  let startY = 0
  let currentY = 0
  let startTime = 0

  const onPointerDown = (e: PointerEvent) => {
    // Actif uniquement sur mobile (< 640px)
    if (typeof window !== 'undefined' && window.innerWidth >= 640) return
    if (e.button !== 0) return // Clic gauche ou contact tactile principal

    startY = e.clientY
    currentY = e.clientY
    startTime = Date.now()
    isDragging.value = true
    isResetting.value = false
    isClosing.value = false
    isDragClosed.value = false

    try {
      ;(e.currentTarget as HTMLElement)?.setPointerCapture?.(e.pointerId)
    } catch {}
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!isDragging.value) return
    currentY = e.clientY
    const delta = currentY - startY

    if (delta > 0) {
      // Déplacement 1:1 vers le bas
      translateY.value = delta
    } else {
      // Légère résistance élastique vers le haut
      translateY.value = delta * 0.12
    }
  }

  const finishDrag = (e?: PointerEvent) => {
    if (!isDragging.value) return
    isDragging.value = false

    if (e) {
      try {
        ;(e.currentTarget as HTMLElement)?.releasePointerCapture?.(e.pointerId)
      } catch {}
    }

    const delta = currentY - startY
    const elapsed = Date.now() - startTime
    const velocity = delta / Math.max(elapsed, 1)

    // Seuil de fermeture : dépassement du seuil en pixels OU flick rapide vers le bas
    const shouldClose = delta >= threshold || (velocity > 0.45 && delta > 30)

    if (shouldClose) {
      isClosing.value = true
      isDragClosed.value = true
      const height = sheetRef.value?.offsetHeight || (typeof window !== 'undefined' ? window.innerHeight : 500)
      translateY.value = height + 40

      setTimeout(() => {
        onClose()
        setTimeout(() => {
          translateY.value = 0
          isClosing.value = false
          isDragClosed.value = false
        }, 150)
      }, 220)
    } else {
      // Pas assez scrollé : animation pour revenir à l'état initial
      isResetting.value = true
      translateY.value = 0

      setTimeout(() => {
        isResetting.value = false
      }, 320)
    }
  }

  const onPointerUp = (e: PointerEvent) => {
    finishDrag(e)
  }

  const onPointerCancel = (e: PointerEvent) => {
    finishDrag(e)
  }

  // Styles de translation de la carte modale
  const sheetStyle = computed(() => {
    if (!isDragging.value && !isResetting.value && !isClosing.value && translateY.value === 0) {
      return {}
    }

    const transition = isDragging.value
      ? 'none'
      : (isClosing.value
          ? 'transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)'
          : 'transform 0.32s cubic-bezier(0.2, 0.9, 0.3, 1)')

    return {
      transform: `translate3d(0, ${Math.max(0, translateY.value)}px, 0)`,
      transition
    }
  })

  // Styles d'opacité du backdrop
  const backdropStyle = computed(() => {
    if (!isDragging.value && !isResetting.value && !isClosing.value && translateY.value === 0) {
      return {}
    }

    if (isClosing.value) {
      return {
        opacity: 0,
        transition: 'opacity 0.22s ease'
      }
    }

    if (isResetting.value) {
      return {
        opacity: 1,
        transition: 'opacity 0.32s ease'
      }
    }

    if (isDragging.value) {
      const opacity = Math.max(0.15, 1 - translateY.value / 350)
      return {
        opacity,
        transition: 'none'
      }
    }

    return {}
  })

  // Props à binder sur l'élément poignée (handle)
  const dragHandleProps = computed(() => ({
    onPointerdown: onPointerDown,
    onPointermove: onPointerMove,
    onPointerup: onPointerUp,
    onPointercancel: onPointerCancel,
    style: {
      touchAction: 'none'
    }
  }))

  return {
    sheetRef,
    isDragging,
    isResetting,
    isClosing,
    isDragClosed,
    translateY,
    sheetStyle,
    backdropStyle,
    dragHandleProps
  }
}
