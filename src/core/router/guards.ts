import type { Router } from 'vue-router'
import { applyRouteSeo } from '@/core/seo'
import { i18n, setLocale, defaultLocale, type AppLocale } from '@/core/i18n'
import { useTracking } from '@/composables/useTracking'
import { supabase } from '@/core/supabase/client'
import { authAdapter, provider } from '@/core/adapter'

const localeRegex = /^\/(en|zh)(?=\/|$)/
const dashboardAdminEmail = String(import.meta.env.VITE_DASHBOARD_ADMIN_EMAIL || 'admin@moyu.com').toLowerCase()
const dashboardAdminId = String(import.meta.env.VITE_DASHBOARD_ADMIN_ID || '')

export function setupRouterGuards(router: Router): void {
  const { track } = useTracking()

  router.beforeEach(async to => {
    if (to.meta.requiresAdmin) {
      let userId = authAdapter.user.value?.id || ''
      let userEmail = String(authAdapter.user.value?.email || '').toLowerCase()
      if (!userId && provider === 'supabase' && supabase) {
        const {
          data: { session }
        } = await supabase.auth.getSession()
        userId = session?.user?.id || ''
        userEmail = String(session?.user?.email || '').toLowerCase()
      }

      if (!userId) {
        return { path: '/', query: { login: 'true', redirect: to.fullPath } }
      }

      const isMatchedAdmin = dashboardAdminId ? userId === dashboardAdminId : userEmail === dashboardAdminEmail
      if (!isMatchedAdmin) {
        return { path: '/' }
      }

      if (provider !== 'supabase' || !supabase) {
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (profile?.role !== 'admin') {
        return { path: '/' }
      }
    }

    // 忽略 404 路由
    if (to.name === 'NotFound') {
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

  router.afterEach((to, from) => {
    // 记录工具使用结束
    if (from.path && from.path !== '/') {
      const cleanFromUrl = from.path.replace(/^\/(en|zh)/, '')
      if (cleanFromUrl.startsWith('/tools/') || cleanFromUrl.startsWith('/games/') || cleanFromUrl.startsWith('/relax/')) {
        track('tool_end', {
          path: from.path,
          duration: Date.now() - (window as any)._lastPageTime
        })
      }
    }
    
    // 记录页面开始时间
    ;(window as any)._lastPageTime = Date.now()

    // 记录工具使用开始
    const cleanToUrl = to.path.replace(/^\/(en|zh)/, '')
    if (cleanToUrl.startsWith('/tools/') || cleanToUrl.startsWith('/games/') || cleanToUrl.startsWith('/relax/')) {
      track('tool_start', {
        path: to.path,
        name: String(to.name || 'unknown')
      })
    } else if (cleanToUrl.includes('auth')) {
      track('auth_view', { path: to.path })
    }

    track('page_view', {
      path: to.path,
      name: String(to.name || 'unknown'),
      params: to.params,
      query: to.query
    })
  })
}
