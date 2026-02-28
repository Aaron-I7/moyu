import { defineStore } from 'pinia'

interface AppState {
  theme: 'light' | 'dark'
  sidebarCollapsed: boolean
  currentModule: string | null
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    theme: 'light',
    sidebarCollapsed: false,
    currentModule: null
  }),

  actions: {
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light'
    },
    setTheme(theme: 'light' | 'dark') {
      this.theme = theme
    },
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    setCurrentModule(moduleId: string | null) {
      this.currentModule = moduleId
    }
  }
})
