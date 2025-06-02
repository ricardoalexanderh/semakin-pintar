import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff, Globe } from 'lucide-react'

const OfflineStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [connectionType, setConnectionType] = useState<string>('')
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowStatus(true)
      // Auto-hide after 3 seconds
      setTimeout(() => setShowStatus(false), 3000)
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      setShowStatus(true)
    }

    // Enhanced connection detection
    const updateConnectionType = () => {
      const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection

      if (connection) {
        setConnectionType(connection.effectiveType || connection.type || '')
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Listen for connection changes
    const connection = (navigator as any).connection
    if (connection) {
      connection.addEventListener('change', updateConnectionType)
      updateConnectionType()
    }

    // Show offline status immediately if offline
    if (!navigator.onLine) {
      setShowStatus(true)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (connection) {
        connection.removeEventListener('change', updateConnectionType)
      }
    }
  }, [])

  if (!showStatus) return null

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isOnline 
        ? 'bg-green-500 text-white' 
        : 'bg-orange-500 text-white'
    }`}>
      <div className="px-4 py-3 text-center text-sm font-medium flex items-center justify-center gap-2">
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            <span>Back online!</span>
            {connectionType && (
              <span className="text-xs opacity-80">({connectionType})</span>
            )}
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>You're offline</span>
            <Globe className="w-4 h-4 opacity-60" />
            <span className="text-xs opacity-80">Games still work!</span>
          </>
        )}
      </div>
    </div>
  )
}

export default OfflineStatus;