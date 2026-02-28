import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { setupRouterGuards } from './core/router/guards'
import { useThemeStore } from './core/theme'
import App from './App.vue'

import './assets/styles/global.scss'

import '@/modules/games'
import '@/modules/relax'
import '@/modules/tools'
import '@/modules/reading'

import router from './core/router'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)

const themeStore = useThemeStore()
themeStore.setTheme('default')

app.use(router)

setupRouterGuards(router)

app.mount('#app')
