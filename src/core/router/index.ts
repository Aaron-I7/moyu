import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import moduleRegistry from '../module/registry'

function generateModuleRoutes(): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []
  const modules = moduleRegistry.getAll()

  routes.push({
    path: '/games',
    name: 'Games',
    component: () => import('@/views/GamesView.vue'),
    meta: { title: '游戏' }
  })

  routes.push({
    path: '/relax',
    name: 'Relax',
    component: () => import('@/views/RelaxView.vue'),
    meta: { title: '休闲' }
  })

  routes.push({
    path: '/tools',
    name: 'Tools',
    component: () => import('@/views/ToolsView.vue'),
    meta: { title: '工具' }
  })

  modules.forEach(module => {
    routes.push({
      path: module.route,
      name: module.id,
      component: module.component,
      meta: {
        title: module.name,
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
    meta: { title: '首页' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: '页面未找到' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes: [...generateModuleRoutes(), ...baseRoutes]
})

export default router
