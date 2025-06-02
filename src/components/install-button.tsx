import React, { useState } from 'react'
import { Download, Smartphone, Monitor, X } from 'lucide-react'
import { usePWA } from '../hooks/use-pwa'
import { trackButtonClick } from '../utils/analytics'

const InstallButton: React.FC = () => {
  const { isInstallable, isInstalled, platforms, installApp } = usePWA()
  const [isInstalling, setIsInstalling] = useState(false)
  const [showPrompt, setShowPrompt] = useState(true)

  if (isInstalled || !isInstallable || !showPrompt) return null

  const handleInstall = async () => {
    if (isInstalling) return
    
    setIsInstalling(true)
    trackButtonClick('install-pwa', 'install-prompt')
    
    const success = await installApp()
    if (!success) {
      setIsInstalling(false)
    }
  }

  const handleDismiss = () => {
    trackButtonClick('dismiss-install', 'install-prompt')
    setShowPrompt(false)
  }

  // Determine icon and text based on platform
  const getIcon = () => {
    if (platforms.includes('mobile')) return <Smartphone className="w-5 h-5" />
    if (platforms.includes('desktop')) return <Monitor className="w-5 h-5" />
    return <Download className="w-5 h-5" />
  }

  const getButtonText = () => {
    if (isInstalling) return 'Installing...'
    if (platforms.includes('mobile')) return 'Add to Home Screen'
    return 'Install App'
  }

  const getDescription = () => {
    if (platforms.includes('mobile')) {
      return 'Add Semakin Pintar to your home screen for quick access to educational games!'
    }
    return 'Install Semakin Pintar for offline access to educational games!'
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />
      
      {/* Install Prompt Modal */}
      <div className="fixed inset-4 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border-2 border-purple-200">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                {getIcon()}
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Install App</h3>
                <p className="text-sm text-gray-600">Semakin Pintar</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-6 leading-relaxed">
            {getDescription()}
          </p>

          {/* Features */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Works offline</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>Fast loading</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span>No app store needed</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Not Now
            </button>
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className={`flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                isInstalling ? 'opacity-75 cursor-not-allowed' : 'hover:from-purple-600 hover:to-indigo-600 hover:shadow-lg'
              }`}
            >
              {isInstalling ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Installing...
                </>
              ) : (
                <>
                  {getIcon()}
                  Install
                </>
              )}
            </button>
          </div>

          {/* Platform info */}
          {platforms.length > 0 && (
            <p className="text-xs text-gray-500 text-center mt-3">
              Available for: {platforms.join(', ')}
            </p>
          )}
        </div>
      </div>
    </>
  )
}

export default InstallButton;