// Enhanced Google Analytics 4 utilities with PWA support
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Initialize Google Analytics
export const initGA = (measurementId: string) => {
  // Create gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    page_title: document.title,
    page_location: window.location.href,
    // PWA-specific configuration
    custom_map: {
      custom_parameter_1: 'pwa_mode',
      custom_parameter_2: 'installation_source'
    }
  });
};

// Enhanced page view tracking with PWA context
export const trackPageView = (path: string, additionalData?: Record<string, any>) => {
  if (typeof window.gtag !== 'undefined') {
    // Get PWA context
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    const isInstalled = isPWA || (window.navigator as any)?.standalone || 
                       document.referrer.includes('android-app://');
    
    window.gtag('config', 'G-X6GWD0Y9Y4', {
      page_path: path,
      page_title: document.title,
      pwa_mode: isPWA,
      app_installed: isInstalled,
      ...additionalData
    });

    // Send enhanced page view event
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: document.title,
      pwa_mode: isPWA,
      app_installed: isInstalled,
      connection_type: (navigator as any)?.connection?.effectiveType || 'unknown',
      ...additionalData
    });
  }
};

// Track custom events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Game-specific event tracking with expanded action types
export const trackGameEvent = (
  gameId: string,
  action: 'start' | 'complete' | 'pause' | 'resume' | 'restart' | 'settings_change' | 'view' | 'achievement_unlocked' | 'fact_memorized' | 'fact_unmemorized' | 'reset_progress',
  details?: Record<string, any>
) => {
  trackEvent(action, 'Games', gameId, details?.score);
  
  // Additional detailed tracking with PWA context
  if (typeof window.gtag !== 'undefined') {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    
    window.gtag('event', 'game_interaction', {
      game_id: gameId,
      game_action: action,
      pwa_mode: isPWA,
      ...details,
    });
  }
};

// Track settings changes
export const trackSettingsChange = (
  setting: string,
  value: any,
  gameId?: string
) => {
  trackEvent('settings_change', 'User_Preferences', setting);
  
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'user_preference', {
      preference_type: setting,
      preference_value: value,
      game_context: gameId,
    });
  }
};

// Enhanced button click tracking with PWA context
export const trackButtonClick = (
  buttonName: string,
  location: string,
  additionalData?: Record<string, any>
) => {
  trackEvent('click', 'Button', `${location}-${buttonName}`);
  
  // Enhanced tracking for PWA-specific buttons
  if (typeof window.gtag !== 'undefined') {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    
    window.gtag('event', 'button_interaction', {
      button_name: buttonName,
      button_location: location,
      pwa_mode: isPWA,
      ...additionalData
    });
  }
};

// Track donation button clicks
export const trackDonationClick = (platform: 'saweria' | 'kofi') => {
  trackEvent('donate_click', 'Conversion', platform);
  
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'donation_intent', {
      platform: platform,
      currency: platform === 'saweria' ? 'IDR' : 'USD',
    });
  }
};

// Track game completion
export const trackGameCompletion = (
  gameId: string,
  score?: number,
  duration?: number,
  difficulty?: string | number
) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'level_end', {
      level_name: gameId,
      score: score,
      duration: duration,
      difficulty: difficulty,
    });
  }
};

// Track errors
export const trackError = (
  error: string,
  location: string,
  fatal = false
) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'exception', {
      description: `${location}: ${error}`,
      fatal: fatal,
    });
  }
};

// PWA-specific tracking functions
export const trackPWAInstallation = (source?: string) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'pwa_installed', {
      event_category: 'PWA',
      event_label: 'App Installed',
      installation_source: source || 'unknown',
      value: 1
    });
  }
};

export const trackPWALaunch = () => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'pwa_launch', {
      event_category: 'PWA',
      event_label: 'Launched as PWA',
      value: 1
    });
  }
};

export const trackConnectionChange = (isOnline: boolean) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'connection_change', {
      event_category: 'PWA',
      event_label: isOnline ? 'Online' : 'Offline',
      connection_status: isOnline ? 'online' : 'offline',
      value: isOnline ? 1 : 0
    });
  }
};

export const trackServiceWorkerUpdate = (action: 'available' | 'installed' | 'activated') => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'sw_update', {
      event_category: 'PWA',
      event_label: `Service Worker ${action}`,
      update_action: action,
      value: 1
    });
  }
};

// PWA Event Handlers (for use in App.tsx)
export const setupPWAAnalytics = () => {
  // Track PWA installation events
  const handleAppInstalled = () => {
    trackPWAInstallation();
  };

  // Track PWA launch method
  const isPWA = window.matchMedia('(display-mode: standalone)').matches;
  if (isPWA) {
    trackPWALaunch();
  }

  // Track connection status for analytics
  const handleConnectionChange = () => {
    trackConnectionChange(navigator.onLine);
  };

  // Add PWA event listeners
  window.addEventListener('appinstalled', handleAppInstalled);
  window.addEventListener('online', handleConnectionChange);
  window.addEventListener('offline', handleConnectionChange);

  // Return cleanup function
  return () => {
    window.removeEventListener('appinstalled', handleAppInstalled);
    window.removeEventListener('online', handleConnectionChange);
    window.removeEventListener('offline', handleConnectionChange);
  };
};