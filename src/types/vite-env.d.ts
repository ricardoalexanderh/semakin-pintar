/// <reference types="vite/client" />

// PWA Virtual Module Declarations
declare module 'virtual:pwa-register/react' {
  import type { Dispatch, SetStateAction } from 'react'

  export interface RegisterSWOptions {
    immediate?: boolean
    onNeedRefresh?: () => void
    onOfflineReady?: () => void
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void
    onRegisterError?: (error: any) => void
  }

  export function useRegisterSW(options?: RegisterSWOptions): {
    needRefresh: [boolean, Dispatch<SetStateAction<boolean>>]
    offlineReady: [boolean, Dispatch<SetStateAction<boolean>>]
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>
  }
}

declare module 'virtual:pwa-register' {
  export function registerSW(options?: {
    immediate?: boolean
    onNeedRefresh?: (updateSW: (reloadPage?: boolean) => Promise<void>) => void
    onOfflineReady?: () => void
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void
    onRegisterError?: (error: any) => void
  }): (reloadPage?: boolean) => Promise<void>
}

// PWA Installation Event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

// Global declarations
declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
    appinstalled: Event
  }

  interface Navigator {
    standalone?: boolean
    connection?: {
      effectiveType?: string
      type?: string
      addEventListener?: (type: string, listener: () => void) => void
      removeEventListener?: (type: string, listener: () => void) => void
    }
    mozConnection?: any
    webkitConnection?: any
  }

  interface ServiceWorkerRegistration {
    update(): Promise<void>
    unregister(): Promise<boolean>
    addEventListener(type: string, listener: EventListenerOrEventListenerObject): void
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void
  }
}

// Ensure this file is treated as a module
export { }