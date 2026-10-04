export function usePwaInstall() {
  const { $pwa } = useNuxtApp()

  const isStandalone = useState<boolean>('pwa_is_standalone', () => false)
  const isMobile = useState<boolean>('pwa_is_mobile', () => false)
  const canInstall = useState<boolean>('pwa_can_install', () => false)
  const isIos = useState<boolean>('pwa_is_ios', () => false)
  const showIosGuide = useState<boolean>('pwa_show_ios_guide', () => false)
  const isDismissed = useState<boolean>('pwa_is_dismissed', () => false)
  const isInitialized = useState<boolean>('pwa_is_initialized', () => false)

  const deferredPrompt = ref<any>(null)
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

    if (isInitialized.value) return
    isInitialized.value = true

    try {
      const dismissedTime = localStorage.getItem(DISMISS_KEY)
      if (dismissedTime && Date.now() - parseInt(dismissedTime, 10) < 7 * 24 * 60 * 60 * 1000) {
        isDismissed.value = true
      }
    } catch {}

    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault()
      deferredPrompt.value = e
      canInstall.value = true
    })

    window.addEventListener('appinstalled', () => {
      canInstall.value = false
      isStandalone.value = true
      deferredPrompt.value = null
    })

    window.addEventListener('resize', () => {
      isMobile.value = checkIsMobile()
    })
  }

  const install = async () => {
    if (deferredPrompt.value) {
      deferredPrompt.value.prompt()
      const { outcome } = await deferredPrompt.value.userChoice
      if (outcome === 'accepted') {
        canInstall.value = false
      }
      deferredPrompt.value = null
    } else if ($pwa?.install) {
      await $pwa.install()
    } else if (isIos.value) {
      showIosGuide.value = true
    }
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
    showIosGuide,
    isDismissed,
    init,
    install,
    dismiss
  }
}
