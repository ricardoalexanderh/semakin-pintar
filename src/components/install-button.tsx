import React, { useState } from 'react'
import { Download, Smartphone, Monitor } from 'lucide-react'
import { usePWA } from '../hooks/use-pwa'
import { trackButtonClick } from '../utils/analytics'

const InstallButton: React.FC = () => {
  const { isInstallable, isInstalled, platforms, installApp } = usePWA()
  const [isInstalling, setIsInstalling] = useState(false)

  if (isInstalled || !isInstallable) return null

  const handleInstall = async () => {
    if (isInstalling) return
    
    setIsInstalling(true)
    trackButtonClick('install-pwa', 'floating-install-button', { platforms })
    
    const success = await installApp()
    if (!success) {
      setIsInstalling(false)
    }
  }

  // Determine icon based on platform
  const getIcon = () => {
    if (platforms.includes('mobile')) return <Smartphone className="w-5 h-5" />
    if (platforms.includes('desktop')) return <Monitor className="w-5 h-5" />
    return <Download className="w-5 h-5" />
  }

  const getButtonText = () => {
    if (isInstalling) return 'Installing...'
    if (platforms.includes('mobile')) return 'Add to Home'
    return 'Install App'
  }

  return (
    <>
      {/* CSS styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse-install {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          .install-button-pulse {
            animation: pulse-install 2s infinite;
          }
        `
      }} />
      
      <button
        onClick={handleInstall}
        disabled={isInstalling}
        className={`fixed bottom-20 right-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 z-50 flex items-center gap-2 font-bold text-sm ${
          isInstalling ? 'opacity-75 cursor-not-allowed' : 'install-button-pulse'
        }`}
      >
        {getIcon()}
        <span className="hidden sm:inline">{getButtonText()}</span>
      </button>
    </>
  )
}

export default InstallButton;