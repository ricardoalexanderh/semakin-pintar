import React, { useState, useEffect } from 'react'
import { RefreshCw, X, Wifi } from 'lucide-react'
import { usePWA } from '../hooks/use-pwa'
import { trackButtonClick } from '../utils/analytics'

const UpdateNotification: React.FC = () => {
  const { needRefresh, offlineReady, updateApp, dismissUpdate } = usePWA()
  const [isUpdating, setIsUpdating] = useState(false)
  const [showOfflineReady, setShowOfflineReady] = useState(false)

  useEffect(() => {
    if (offlineReady) {
      setShowOfflineReady(true)
      const timer = setTimeout(() => setShowOfflineReady(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [offlineReady])

  const handleUpdate = async () => {
    setIsUpdating(true)
    trackButtonClick('update-pwa', 'update-notification')
    
    try {
      await updateApp()
    } catch (error) {
      console.error('Update failed:', error)
      setIsUpdating(false)
    }
  }

  const handleDismiss = () => {
    trackButtonClick('dismiss-update', 'update-notification')
    dismissUpdate()
  }

  // Show offline ready notification
  if (showOfflineReady && !needRefresh) {
    return (
      <div className="fixed top-4 right-4 bg-green-500 text-white rounded-xl p-4 shadow-xl z-50 max-w-sm">
        <div className="flex items-center gap-3">
          <Wifi className="w-5 h-5" />
          <div>
            <h3 className="font-bold text-sm">Ready for Offline!</h3>
            <p className="text-xs opacity-90">App cached and ready to use offline</p>
          </div>
        </div>
      </div>
    )
  }

  // Show update notification
  if (!needRefresh) return null

  return (
    <div className="fixed top-4 right-4 bg-white border-2 border-purple-200 rounded-xl p-4 shadow-xl z-50 max-w-sm">
      <div className="flex items-start gap-3">
        <div className="bg-blue-100 p-2 rounded-lg">
          <RefreshCw className={`w-5 h-5 text-blue-600 ${isUpdating ? 'animate-spin' : ''}`} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-800 text-sm">
            {isUpdating ? 'Updating...' : 'Update Available!'}
          </h3>
          <p className="text-gray-600 text-xs mt-1">
            {isUpdating 
              ? 'Please wait while we update the app' 
              : 'A new version with improvements is ready'
            }
          </p>
          {!isUpdating && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleUpdate}
                className="bg-purple-500 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-purple-600 transition-colors"
              >
                Update Now
              </button>
              <button
                onClick={handleDismiss}
                className="bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-xs hover:bg-gray-300 transition-colors"
              >
                Later
              </button>
            </div>
          )}
        </div>
        {!isUpdating && (
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export default UpdateNotification;