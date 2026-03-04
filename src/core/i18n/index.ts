import { createI18n } from 'vue-i18n'
import en from './locales/en'
import zh from './locales/zh'

export type AppLocale = 'en' | 'zh'
export const defaultLocale: AppLocale = 'en'

export interface LocaleMeta {
  code: AppLocale
  label: string
  region: 'americas' | 'europe' | 'mena' | 'apac'
  rtl: boolean
  defaultCurrency: string
  defaultUnit: 'metric' | 'imperial'
  defaultTimezone: string
}

export const localeMetaMap: Record<AppLocale, LocaleMeta> = {
  en: {
    code: 'en',
    label: 'English',
    region: 'americas',
    rtl: false,
    defaultCurrency: 'USD',
    defaultUnit: 'imperial',
    defaultTimezone: 'America/New_York'
  },
  zh: {
    code: 'zh',
    label: '中文',
    region: 'apac',
    rtl: false,
    defaultCurrency: 'CNY',
    defaultUnit: 'metric',
    defaultTimezone: 'Asia/Shanghai'
  }
}

const localeStorageKey = 'moyu-locale'

const localeLoaders: Record<AppLocale, () => Promise<{ default: Record<string, unknown> }>> = {
  en: async () => ({ default: en }),
  zh: async () => ({ default: zh })
}

const loadedLocales = new Set<AppLocale>()

export const i18n = createI18n({
  legacy: false,
  locale: defaultLocale,
  fallbackLocale: defaultLocale,
  messages: {
    // 初始不预设 messages，强制走 loadLocaleMessages
  } as any
}) as any

export function getStoredLocale(): AppLocale {
  const stored = localStorage.getItem(localeStorageKey) as AppLocale | null
  if (stored && stored in localeMetaMap) {
    return stored
  }
  return defaultLocale
}

export function getLocaleFromPathname(pathname: string): AppLocale | null {
  const base = (import.meta.env.BASE_URL as string).replace(/\/+$/, '')
  let normalized = pathname
  if (base && base !== '/' && normalized.startsWith(base)) {
    normalized = normalized.slice(base.length)
  }
  const parts = normalized.split('/').filter(Boolean)
  if (parts.length > 0) {
    const segment = parts[0]
    if (segment === 'en' || segment === 'zh') {
      return segment
    }
  }
  return null
}

export async function loadLocaleMessages(locale: AppLocale): Promise<void> {
  // 增加调试日志
  console.log(`[i18n] Loading locale: ${locale}`)
  
  if (loadedLocales.has(locale)) {
    console.log(`[i18n] Locale ${locale} already loaded`)
    return
  }
  
  try {
    const loader = localeLoaders[locale]
    if (!loader) {
      console.error(`[i18n] No loader found for locale: ${locale}`)
      return
    }
    
    const localeModule = await loader()
    const messages = localeModule.default || localeModule
    
    console.log(`[i18n] Loaded messages for ${locale}:`, Object.keys(messages))
    
    ;(i18n.global as any).setLocaleMessage(locale, messages)
    loadedLocales.add(locale)
  } catch (e) {
    console.error(`[i18n] Failed to load locale ${locale}:`, e)
  }
}

export function applyDocumentLocale(locale: AppLocale): void {
  const meta = localeMetaMap[locale]
  const root = document.documentElement
  root.lang = locale
  root.dir = meta.rtl ? 'rtl' : 'ltr'
}

export async function setLocale(locale: AppLocale): Promise<void> {
  await loadLocaleMessages(locale)
  ;(i18n.global.locale as any).value = locale
  localStorage.setItem(localeStorageKey, locale)
  applyDocumentLocale(locale)
}

export async function initializeI18n(): Promise<void> {
  const locale = getLocaleFromPathname(window.location.pathname) || getStoredLocale()
  await setLocale(locale)
}

export const availableLocales: AppLocale[] = ['en', 'zh']
