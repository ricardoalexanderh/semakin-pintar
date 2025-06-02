import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface PWARouteHandlerProps {
  defaultRoute: string
  children: React.ReactNode
}

const PWARouteHandler: React.FC<PWARouteHandlerProps> = ({ 
  defaultRoute, 
  children 
}) => {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Enhanced PWA detection
    const isPWA = 
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      (window.navigator as any)?.standalone ||
      document.referrer.includes('android-app://') ||
      new URLSearchParams(window.location.search).get('utm_source') === 'pwa'

    // Handle PWA launch routing
    if (isPWA && location.pathname === '/') {
      // Preserve query parameters for analytics
      const searchParams = new URLSearchParams(window.location.search)
      if (!searchParams.has('utm_source')) {
        searchParams.set('utm_source', 'pwa')
      }
      
      const newUrl = `${defaultRoute}?${searchParams.toString()}`
      navigate(newUrl, { replace: true })
    }

    // Handle deep link protocol
    const handleProtocolLink = (event: CustomEvent) => {
      const { game } = event.detail
      if (game) {
        navigate(`/games/${game}?utm_source=protocol`, { replace: true })
      }
    }

    window.addEventListener('protocolhandler' as any, handleProtocolLink)
    
    return () => {
      window.removeEventListener('protocolhandler' as any, handleProtocolLink)
    }
  }, [navigate, location.pathname, defaultRoute])

  return <>{children}</>
}

export default PWARouteHandler;