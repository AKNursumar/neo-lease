/**
 * Application configuration using environment variables
 */

export const config = {
  // Application metadata
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Neo-Lease',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  },

  // API endpoints
  api: {
    backend: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001',
  },

  // Supabase configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },

  // Payment gateway configuration  
  payments: {
    razorpayKeyId: import.meta.env.VITE_RAZORPAY_KEY_ID,
  },

  // Debug and development flags
  debug: {
    enabled: import.meta.env.VITE_DEBUG_MODE === 'true',
    auth: import.meta.env.VITE_DEBUG_AUTH === 'true',
    supabase: import.meta.env.VITE_DEBUG_SUPABASE === 'true',
    payments: import.meta.env.VITE_DEBUG_PAYMENTS === 'true',
  },

  // Feature flags
  features: {
    checkout: import.meta.env.VITE_FEATURE_CHECKOUT !== 'false', // default enabled
    notifications: import.meta.env.VITE_FEATURE_NOTIFICATIONS !== 'false', // default enabled
    analytics: import.meta.env.VITE_FEATURE_ANALYTICS === 'true', // default disabled
  },

  // UI/UX settings
  ui: {
    defaultTheme: import.meta.env.VITE_DEFAULT_THEME || 'system',
    enableAnimations: import.meta.env.VITE_ENABLE_ANIMATIONS !== 'false', // default enabled
    mobileFirst: import.meta.env.VITE_MOBILE_FIRST !== 'false', // default enabled
  },

  // Validation helpers
  isProduction: () => import.meta.env.PROD,
  isDevelopment: () => import.meta.env.DEV,
  
  // Environment validation
  validate: () => {
    const required = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_RAZORPAY_KEY_ID'
    ];

    const missing = required.filter(key => !import.meta.env[key]);
    
    if (missing.length > 0) {
      console.error('Missing required environment variables:', missing);
      return false;
    }
    
    return true;
  }
} as const;

// Validate configuration on load (in development)
if (import.meta.env.DEV) {
  if (!config.validate()) {
    console.warn('Some environment variables are missing. Check .env file.');
  }
  
  if (config.debug.enabled) {
    console.log('Application Configuration:', {
      app: config.app,
      api: config.api,
      features: config.features,
      debug: config.debug,
      ui: config.ui,
      environment: import.meta.env.MODE
    });
  }
}

export default config;
