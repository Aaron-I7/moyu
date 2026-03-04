import type { Router } from 'vue-router'
import { applyRouteSeo } from '@/core/seo'

export function setupRouterGuards(router: Router): void {
  router.beforeEach((to, _from, next) => {
    applyRouteSeo(to)
    next()
  })
}
