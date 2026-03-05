import { createI18n } from 'vue-i18n'

import enCommon from './locales/en/common.json'
import enModules from './locales/en/modules.json'
import enWhiteNoise from './locales/en/whiteNoise.json'
import enPixelFishing from './locales/en/pixelFishing.json'
import enPomodoro from './locales/en/pomodoro.json'

import zhCommon from './locales/zh/common.json'
import zhModules from './locales/zh/modules.json'
import zhWhiteNoise from './locales/zh/whiteNoise.json'
import zhPixelFishing from './locales/zh/pixelFishing.json'
import zhPomodoro from './locales/zh/pomodoro.json'

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

const localeMessages: Record<AppLocale, Record<string, unknown>> = {
  en: {
    ...enCommon,
    modules: enModules,
    whiteNoise: enWhiteNoise,
    pixelFishing: enPixelFishing,
    pomodoro: enPomodoro
  },
  zh: {
    ...zhCommon,
    modules: zhModules,
    whiteNoise: zhWhiteNoise,
    pixelFishing: zhPixelFishing,
    pomodoro: zhPomodoro
  }
}

export const i18n = createI18n({
  legacy: false,
  locale: defaultLocale,
  fallbackLocale: defaultLocale,
  messages: localeMessages as any
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
  ;(i18n.global as any).setLocaleMessage(locale, localeMessages[locale] || localeMessages[defaultLocale])
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
