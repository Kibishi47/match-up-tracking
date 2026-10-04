// Module-level global state shared across all components and pages
let globalDeferredPrompt: any = null
let hasAttachedWindowListeners = false

export function usePwaInstall() {
  const { $pwa } = useNuxtApp()

  const isStandalone = useState<boolean>('pwa_is_standalone', () => false)
  const isMobile = useState<boolean>('pwa_is_mobile', () => false)
  const canInstall = useState<boolean>('pwa_can_install', () => false)
  const isIos = useState<boolean>('pwa_is_ios', () => false)
  const showGuide = useState<boolean>('pwa_show_guide', () => false)
  const isDismissed = useState<boolean>('pwa_is_dismissed', () => false)

  const DISMISS_KEY = 'metadex_pwa_dismissed_at'

  const checkIsStandalone = (): boolean => {
    if (typeof window === 'undefined') return false
    return (
      Boolean($pwa?.isPWAInstalled) ||
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    )
  }

  const checkIsMobile = (): boolean => {
    if (typeof window === 'undefined') return false
    const ua = window.navigator.userAgent
    const isTouchMac = ua.includes('Macintosh') && navigator.maxTouchPoints > 1
    const isMobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
    return isMobileUa || isTouchMac || window.innerWidth < 768
  }

  const checkIsIos = (): boolean => {
    if (typeof window === 'undefined') return false
    const ua = window.navigator.userAgent
    const isIpad = ua.includes('Macintosh') && navigator.maxTouchPoints > 1
    return /iPad|iPhone|iPod/.test(ua) || isIpad
  }

  const init = () => {
    if (typeof window === 'undefined') return

    isStandalone.value = checkIsStandalone()
    isMobile.value = checkIsMobile()
    isIos.value = checkIsIos()

    try {
      const dismissedTime = localStorage.getItem(DISMISS_KEY)
      if (dismissedTime && Date.now() - parseInt(dismissedTime, 10) < 7 * 24 * 60 * 60 * 1000) {
        isDismissed.value = true
      }
    } catch {}

    if (globalDeferredPrompt) {
      canInstall.value = true
    }

    if (!hasAttachedWindowListeners) {
      hasAttachedWindowListeners = true

      window.addEventListener('beforeinstallprompt', (e: Event) => {
        e.preventDefault()
        globalDeferredPrompt = e
        canInstall.value = true
      })

      window.addEventListener('appinstalled', () => {
        canInstall.value = false
        isStandalone.value = true
        globalDeferredPrompt = null
        showGuide.value = false
      })

      window.addEventListener('resize', () => {
        isMobile.value = checkIsMobile()
      })
    }
  }

  const install = async () => {
    init()

    // 1. Si on a l'événement natif avant prompt (Chromium / Android)
    if (globalDeferredPrompt) {
      try {
        globalDeferredPrompt.prompt()
        const choice = await globalDeferredPrompt.userChoice
        if (choice?.outcome === 'accepted') {
          canInstall.value = false
          isStandalone.value = true
          globalDeferredPrompt = null
          return
        }
      } catch (e) {
        console.warn('Native prompt failed:', e)
      }
    }

    // 2. Si le module Vite PWA a son prompt actif
    if ($pwa?.showInstallPrompt && typeof $pwa.install === 'function') {
      try {
        const choice = await $pwa.install()
        if (choice?.outcome === 'accepted') {
          isStandalone.value = true
          return
        }
      } catch (e) {
        console.warn('$pwa.install failed:', e)
      }
    }

    // 3. Fallback immédiat : si le navigateur ne supporte pas le prompt automatique (ex: iOS Safari, Firefox Mobile, ou HTTP local)
    // Ouvre la boîte de dialogue avec les instructions pas à pas
    showGuide.value = true
  }

  const dismiss = () => {
    isDismissed.value = true
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString())
    } catch {}
  }

  return {
    isStandalone,
    isMobile,
    canInstall,
    isIos,
    showGuide,
    isDismissed,
    init,
    install,
    dismiss
  }
}
