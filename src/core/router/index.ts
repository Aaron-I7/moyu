import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import moduleRegistry from '../module/registry'

function generateModuleRoutes(): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []
  const modules = moduleRegistry.getAll()

  routes.push({
    path: '/games',
    name: 'Games',
    component: () => import('@/views/GamesView.vue'),
    meta: { title: 'Games', titleKey: 'routeTitle.games', descriptionKey: 'seo.routes.games.description' }
  })

  routes.push({
    path: '/relax',
    name: 'Relax',
    component: () => import('@/views/RelaxView.vue'),
    meta: { title: 'Recharge', titleKey: 'routeTitle.relax', descriptionKey: 'seo.routes.relax.description' }
  })

  routes.push({
    path: '/tools',
    name: 'Tools',
    component: () => import('@/views/ToolsView.vue'),
    meta: { title: 'Tools', titleKey: 'routeTitle.tools', descriptionKey: 'seo.routes.tools.description' }
  })

  modules.forEach(module => {
    routes.push({
      path: module.route,
      name: module.id,
      component: module.component,
      meta: {
        title: module.name,
        titleKey: module.meta?.titleKey,
        descriptionKey: module.meta?.descriptionKey || module.i18n?.descriptionKey,
        ...module.meta
      }
    })
  })

  return routes
}

const baseRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: 'Home', titleKey: 'routeTitle.home', descriptionKey: 'seo.routes.home.description' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'Page Not Found', titleKey: 'routeTitle.notFound', descriptionKey: 'seo.routes.notFound.description' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...generateModuleRoutes(), ...baseRoutes]
})

export default router
