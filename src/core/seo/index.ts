import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { i18n, type AppLocale } from '@/core/i18n'

const siteUrl = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') || window.location.origin

function ensureMeta(key: string, value: string, isProperty = false) {
  const selector = isProperty ? `meta[property="${key}"]` : `meta[name="${key}"]`
  let element = document.head.querySelector(selector) as HTMLMetaElement | null
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(isProperty ? 'property' : 'name', key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', value)
}

function ensureLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]:not([hreflang])`
  let element = document.head.querySelector(selector) as HTMLLinkElement | null
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    if (hreflang) element.setAttribute('hreflang', hreflang)
    document.head.appendChild(element)
  }
  element.setAttribute('href', href)
}

function ensureJsonLd(id: string, payload: Record<string, unknown>) {
  let script = document.head.querySelector(`script[data-seo-id="${id}"]`) as HTMLScriptElement | null
  if (!script) {
    script = document.createElement('script')
    script.type = 'application/ld+json'
    script.dataset.seoId = id
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify(payload)
}

function getLocalizedPath(path: string, locale: AppLocale) {
  const normalized = path.replace(/^\/(en|zh)(?=\/|$)/, '')
  const suffix = normalized || '/'
  return `${siteUrl}/${locale}${suffix === '/' ? '' : suffix}`
}

export function applyRouteSeo(route: RouteLocationNormalizedLoaded) {
  const locale = (i18n.global.locale as any).value as AppLocale
  const titleKey = route.meta.titleKey as string | undefined
  const fallbackTitle = (route.meta.title as string | undefined) || 'Breakflow'
  const routeTitle = titleKey ? i18n.global.t(titleKey, fallbackTitle) : fallbackTitle
  const suffix = i18n.global.t('app.titleSuffix')
  const fullTitle = `${routeTitle} · ${suffix}`
  document.title = fullTitle

  const descriptionKey = route.meta.descriptionKey as string | undefined
  const routeDescription = descriptionKey
    ? i18n.global.t(descriptionKey, i18n.global.t('seo.defaultDescription'))
    : i18n.global.t('seo.defaultDescription')
  const canonical = `${siteUrl}${route.path}`

  ensureMeta('description', routeDescription)
  ensureMeta('og:type', 'website', true)
  ensureMeta('og:title', fullTitle, true)
  ensureMeta('og:description', routeDescription, true)
  ensureMeta('og:url', canonical, true)
  ensureMeta('twitter:card', 'summary_large_image')
  ensureMeta('twitter:title', fullTitle)
  ensureMeta('twitter:description', routeDescription)

  ensureLink('canonical', canonical)
  ensureLink('alternate', getLocalizedPath(route.path, 'en'), 'en')
  ensureLink('alternate', getLocalizedPath(route.path, 'zh'), 'zh-CN')
  ensureLink('alternate', canonical, 'x-default')

  ensureJsonLd('website', {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: i18n.global.t('app.name'),
    url: siteUrl,
    inLanguage: locale,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  })

  ensureJsonLd('webpage', {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: fullTitle,
    description: routeDescription,
    url: canonical,
    isPartOf: {
      '@type': 'WebSite',
      name: i18n.global.t('app.name'),
      url: siteUrl
    },
    inLanguage: locale
  })
}
