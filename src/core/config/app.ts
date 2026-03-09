const envDefaultLocale = import.meta.env.VITE_DEFAULT_LOCALE

export const DEFAULT_LOCALE: 'en' | 'zh' = envDefaultLocale === 'zh' ? 'zh' : 'en'

export const SITE_URL = import.meta.env.VITE_SITE_URL || ''
