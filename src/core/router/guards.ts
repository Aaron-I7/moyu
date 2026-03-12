import type { Router } from 'vue-router'
import { applyRouteSeo } from '@/core/seo'
import { i18n, setLocale, defaultLocale, type AppLocale } from '@/core/i18n'
import { useTracking } from '@/composables/useTracking'
import { supabase } from '@/core/supabase/client'

const localeRegex = /^\/(en|zh)(?=\/|$)/

export function setupRouterGuards(router: Router): void {
  const { track } = useTracking()

  router.beforeEach(async to => {
    // 检查管理员权限
    if (to.meta.requiresAdmin) {
      if (!supabase) return { path: '/' }
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return { path: '/', query: { login: 'true', redirect: to.fullPath } }
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
        
      if (profile?.role !== 'admin') {
        // Logged in but not admin
        // Ideally show an error message, but for now redirect home
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
