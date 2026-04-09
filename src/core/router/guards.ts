import type { Router } from 'vue-router'
import { applyRouteSeo } from '@/core/seo'
import { i18n, setLocale, defaultLocale, type AppLocale } from '@/core/i18n'
import { supabase } from '@/core/supabase/client'
import { authAdapter, authReady } from '@/core/adapter'

const localeRegex = /^\/(en|zh)(?=\/|$)/
const childPortalRegex = /^\/child(?:\/|$)/

export function setupRouterGuards(router: Router): void {
  router.beforeEach(async to => {
    if (to.meta.requiresAdmin) {
      await authReady
      let userId = authAdapter.user.value?.id || ''
      if (!userId && supabase) {
        const {
          data: { session }
        } = await supabase.auth.getSession()
        userId = session?.user?.id || ''
      }

      if (!userId) {
        return { path: '/', query: { login: 'true', redirect: to.fullPath } }
      }
    }

    // 忽略 404 路由
    if (to.name === 'NotFound') {
      return
    }

    if (childPortalRegex.test(to.path)) {
      applyRouteSeo(to)
      return
    }

    if (!localeRegex.test(to.path)) {
      return {
        path: `/${defaultLocale}${to.path === '/' ? '' : to.path}`,
        query: to.query,
        hash: to.hash,
        replace: true
      }
    }
    const routeLocale = to.params.locale as AppLocale
    if (routeLocale && (i18n.global.locale as any).value !== routeLocale) {
      await setLocale(routeLocale)
    }
    applyRouteSeo(to)
  })
}
