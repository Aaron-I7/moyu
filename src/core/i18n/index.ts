import { createI18n } from 'vue-i18n'
import en from './locales/en'

export type AppLocale = 'en' | 'zh'

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
  zh: () => import('./locales/zh')
}

const loadedLocales = new Set<AppLocale>(['en'])

export const i18n = createI18n({
  legacy: false,
  locale: 'en' as AppLocale,
  fallbackLocale: 'en' as AppLocale,
  messages: {
    en
  } as any
}) as any

export function getStoredLocale(): AppLocale {
  const stored = localStorage.getItem(localeStorageKey) as AppLocale | null
  if (stored && stored in localeMetaMap) {
    return stored
  }
  return 'en'
}

export async function loadLocaleMessages(locale: AppLocale): Promise<void> {
  if (loadedLocales.has(locale)) {
    return
  }
  const loader = localeLoaders[locale]
  const localeModule = await loader()
  ;(i18n.global as any).setLocaleMessage(locale, localeModule.default)
  loadedLocales.add(locale)
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
  const locale = getStoredLocale()
  await setLocale(locale)
}

export const availableLocales: AppLocale[] = ['en', 'zh']
