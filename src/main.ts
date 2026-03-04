import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { setupRouterGuards } from './core/router/guards'
import { useThemeStore } from './core/theme'
import { useAccessibilityStore } from './core/accessibility'
import { i18n, initializeI18n } from './core/i18n'
import App from './App.vue'

import './assets/styles/global.scss'

import '@/modules/games'
import '@/modules/relax'
import '@/modules/tools'
import '@/modules/reading'

import router from './core/router'

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)
  app.use(i18n)

  await initializeI18n()

  const themeStore = useThemeStore()
  themeStore.loadTheme()

  const accessibilityStore = useAccessibilityStore()
  accessibilityStore.loadScale()

  app.use(router)
  setupRouterGuards(router)
  app.mount('#app')
}

bootstrap()
