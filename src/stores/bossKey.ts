import { defineStore } from 'pinia'

const STORAGE_KEY = 'moyu-boss-key-settings'

export type BossKeyMode = 'code' | 'excel' | 'forum' | 'terminal'

export interface BossKeySettings {
  mode: BossKeyMode
}

const DEFAULT_SETTINGS: BossKeySettings = {
  mode: 'code',
}

export const useBossKeyStore = defineStore('boss-key', {
  state: (): BossKeySettings => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
      }
    } catch {
      // ignore
    }
    return { ...DEFAULT_SETTINGS }
  },

  actions: {
    setMode(mode: BossKeyMode) {
      this.mode = mode
      this.save()
    },

    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.$state))
      } catch {
        // ignore
      }
    },
  },
})
