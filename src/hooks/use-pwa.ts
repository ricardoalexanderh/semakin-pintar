import { useState, useEffect, useCallback } from 'react'
// @ts-expect-error - Virtual module from vite-plugin-pwa
import { useRegisterSW } from 'virtual:pwa-register/react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface PWAInstallPrompt {
  prompt: () => Promise<void>
  platforms: string[]
}

export const usePWA = () => {
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [installSource, setInstallSource] = useState<string>('')

  // Service worker registration with explicit typing
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration?: ServiceWorkerRegistration) {
      console.log('SW Registered:', registration)
      if (registration) {
        setInterval(() => {
          registration.update()
        }, 60000)
      }
    },
    onRegisterError(error: any) {
      console.error('SW registration error:', error)
    },
    onNeedRefresh() {
      console.log('SW needs refresh')
    },
    onOfflineReady() {
      console.log('App ready to work offline')
    }
  })

  // Installation detection
  const checkInstallation = useCallback(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    const fullscreen = window.matchMedia('(display-mode: fullscreen)').matches
    const minimalUi = window.matchMedia('(display-mode: minimal-ui)').matches
    const navigatorStandalone = (window.navigator as any)?.standalone
    const isAndroidApp = document.referrer.includes('android-app://')
    
    return standalone || fullscreen || minimalUi || navigatorStandalone || isAndroidApp
  }, [])

  useEffect(() => {
    setIsInstalled(checkInstallation())

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const event = e as BeforeInstallPromptEvent
      
      setInstallPrompt({
        prompt: () => event.prompt(),
        platforms: event.platforms || []
      })
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setInstallPrompt(null)
      
      const urlParams = new URLSearchParams(window.location.search)
      setInstallSource(urlParams.get('utm_source') || 'unknown')
    }

    const handleDisplayModeChange = () => {
      setIsInstalled(checkInstallation())
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    mediaQuery.addEventListener('change', handleDisplayModeChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      mediaQuery.removeEventListener('change', handleDisplayModeChange)
    }
  }, [checkInstallation])

  const installApp = useCallback(async () => {
    if (!installPrompt) return false

    try {
      await installPrompt.prompt()
      setIsInstallable(false)
      setInstallPrompt(null)
      return true
    } catch (error) {
      console.error('Installation failed:', error)
      return false
    }
  }, [installPrompt])

  const updateApp = useCallback(() => {
    updateServiceWorker(true)
  }, [updateServiceWorker])

  const dismissUpdate = useCallback(() => {
    setNeedRefresh(false)
  }, [setNeedRefresh])

  return {
    isInstallable,
    isInstalled,
    needRefresh,
    offlineReady,
    installSource,
    platforms: installPrompt?.platforms || [],
    installApp,
    updateApp,
    dismissUpdate
  }
}