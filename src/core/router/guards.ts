import type { Router } from 'vue-router'
import { applyRouteSeo } from '@/core/seo'
import { i18n, setLocale, type AppLocale } from '@/core/i18n'

const localeRegex = /^\/(en|zh)(?=\/|$)/

export function setupRouterGuards(router: Router): void {
  router.beforeEach(async to => {
    if (!localeRegex.test(to.path)) {
      return {
        path: `/en${to.path === '/' ? '' : to.path}`,
        query: to.query,
        hash: to.hash,
        replace: true
      }
    }
    const routeLocale = to.params.locale as AppLocale
    if ((i18n.global.locale as any).value !== routeLocale) {
      await setLocale(routeLocale)
    }
    applyRouteSeo(to)
  })
}
