import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import moduleRegistry from '../module/registry'
import { defaultLocale } from '@/core/i18n'

const localePath = '/:locale(en|zh)'

function generateModuleRoutes(): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []
  const modules = moduleRegistry.getAll()

  routes.push({
    path: `${localePath}/about`,
    name: 'About',
    component: () => import('@/views/AboutView.vue'),
    meta: { title: 'About Us', titleKey: 'routeTitle.about', descriptionKey: 'seo.routes.about.description' }
  })

  routes.push({
    path: `${localePath}/games`,
    name: 'Games',
    component: () => import('@/views/GamesView.vue'),
    meta: { title: 'Games', titleKey: 'routeTitle.games', descriptionKey: 'seo.routes.games.description' }
  })

  routes.push({
    path: `${localePath}/relax`,
    name: 'Relax',
    component: () => import('@/views/RelaxView.vue'),
    meta: { title: 'Recharge', titleKey: 'routeTitle.relax', descriptionKey: 'seo.routes.relax.description' }
  })

  routes.push({
    path: `${localePath}/tools`,
    name: 'Tools',
    component: () => import('@/views/ToolsView.vue'),
    meta: { title: 'Tools', titleKey: 'routeTitle.tools', descriptionKey: 'seo.routes.tools.description' }
  })

  routes.push({
    path: `${localePath}/tools/focus`,
    name: 'Focus',
    component: () => import('@/views/FocusView.vue'),
    meta: { 
      title: 'Focus Mode', 
      titleKey: 'routeTitle.focus', 
      descriptionKey: 'seo.routes.focus.description',
      layout: 'blank'
    }
  })

  modules.forEach(module => {
    routes.push({
      path: `${localePath}${module.route}`,
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
    redirect: `/${defaultLocale}`
  },
  {
    path: `${localePath}`,
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: 'Home', titleKey: 'routeTitle.home', descriptionKey: 'seo.routes.home.description' }
  },
  {
    path: `${localePath}/:pathMatch(.*)*`,
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'Page Not Found', titleKey: 'routeTitle.notFound', descriptionKey: 'seo.routes.notFound.description' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'LegacyPath',
    component: () => import('@/views/NotFoundView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...generateModuleRoutes(), ...baseRoutes]
})

export default router
