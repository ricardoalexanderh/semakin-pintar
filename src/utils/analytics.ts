// Google Analytics 4 utilities
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
    });
  };
  
  // Track page views for SPA routing
  export const trackPageView = (path: string, title?: string) => {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: path,
        page_title: title || document.title,
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
    
    // Additional detailed tracking
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'game_interaction', {
        game_id: gameId,
        game_action: action,
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
  
  // Track button clicks
  export const trackButtonClick = (
    buttonName: string,
    location: string
  ) => {
    trackEvent('click', 'Button', `${location}-${buttonName}`);
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