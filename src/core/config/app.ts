/**
 * Application-level configuration
 */

// Default locale from environment variable
export const DEFAULT_LOCALE = (import.meta.env.VITE_DEFAULT_LOCALE || 'en') as 'en' | 'zh'

// Site URL
export const SITE_URL = import.meta.env.VITE_SITE_URL || ''
