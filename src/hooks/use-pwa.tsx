import { useState, useEffect, useCallback } from 'react'
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

  // Enhanced service worker registration
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      console.log('SW Registered:', registration)
      // Check for updates periodically
      setInterval(() => {
        registration?.update()
      }, 60000) // Check every minute
    },
    onRegisterError(error) {
      console.error('SW registration error:', error)
    },
    onNeedRefresh() {
      console.log('SW needs refresh')
    },
    onOfflineReady() {
      console.log('App ready to work offline')
    }
  })

  // Enhanced installation detection
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

    // Enhanced beforeinstallprompt handler
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const event = e as BeforeInstallPromptEvent
      
      setInstallPrompt({
        prompt: () => event.prompt(),
        platforms: event.platforms || []
      })
      setIsInstallable(true)
      
      console.log('Install prompt available for platforms:', event.platforms)
    }

    // App installed handler
    const handleAppInstalled = (e: Event) => {
      console.log('App installed:', e)
      setIsInstalled(true)
      setIsInstallable(false)
      setInstallPrompt(null)
      
      // Track installation source
      const urlParams = new URLSearchParams(window.location.search)
      setInstallSource(urlParams.get('utm_source') || 'unknown')
    }

    // Listen for display mode changes
    const handleDisplayModeChange = () => {
      setIsInstalled(checkInstallation())
    }

    // Event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    
    // Modern display mode detection
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