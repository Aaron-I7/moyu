import type { Router } from 'vue-router'

export function setupRouterGuards(router: Router): void {
  router.beforeEach((to, _from, next) => {
    const title = to.meta.title as string | undefined
    document.title = `${title || '摸鱼吧'} - 微放松平台`
    next()
  })
}
