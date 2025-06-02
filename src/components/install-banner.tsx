import React, { useState } from 'react'
import { Download, X } from 'lucide-react'
import { usePWA } from '../hooks/use-pwa'
import { trackButtonClick } from '../utils/analytics'

const InstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, installApp } = usePWA()
  const [isDismissed, setIsDismissed] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  if (isInstalled || !isInstallable || isDismissed) return null

  const handleInstall = async () => {
    setIsInstalling(true)
    trackButtonClick('install-pwa', 'install-banner')
    
    const success = await installApp()
    if (!success) {
      setIsInstalling(false)
    }
  }

  const handleDismiss = () => {
    trackButtonClick('dismiss-install', 'install-banner')
    setIsDismissed(true)
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-40 mx-auto max-w-md">
      <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-4 rounded-xl shadow-lg border border-purple-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">Install Semakin Pintar</p>
              <p className="text-xs opacity-90">Quick access to educational games</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="bg-white text-purple-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {isInstalling ? 'Installing...' : 'Install'}
            </button>
            <button
              onClick={handleDismiss}
              className="text-white/80 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InstallBanner;