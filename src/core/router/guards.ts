import type { Router } from 'vue-router'
import { i18n } from '@/core/i18n'

export function setupRouterGuards(router: Router): void {
  router.beforeEach((to, _from, next) => {
    const titleKey = to.meta.titleKey as string | undefined
    const fallbackTitle = to.meta.title as string | undefined
    const title = titleKey ? i18n.global.t(titleKey, fallbackTitle || 'Breakflow') : (fallbackTitle || 'Breakflow')
    const suffix = i18n.global.t('app.titleSuffix')
    document.title = `${title} · ${suffix}`
    next()
  })
}
