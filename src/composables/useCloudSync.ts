import { ref } from 'vue'
import { authAdapter, dbAdapter } from '@/core/adapter'

const isSyncing = ref(false)
const lastSyncTime = ref<number | null>(null)

// Debounce map for push operations
const debounceTimers: Record<string, number> = {}

export function useCloudSync() {
  const normalizeFavoriteSounds = (input: any): any[] => {
    const list = Array.isArray(input) ? input : []
    const normalized = list
      .map((item: any) => {
        const sounds = Array.isArray(item?.sounds) ? item.sounds : []
        if (sounds.length === 0) return null
        const normalizedSounds = sounds
          .map((s: any) => ({ id: String(s.id || ''), volume: Number(s.volume ?? 0.5) }))
          .filter((s: any) => !!s.id)
          .map((s: any) => ({ id: s.id, volume: Math.max(0, Math.min(1, Number(s.volume.toFixed(2)))) }))
          .sort((a: any, b: any) => a.id.localeCompare(b.id))
        if (normalizedSounds.length === 0) return null
        const fingerprint = normalizedSounds.map((s: any) => `${s.id}:${s.volume}`).join('|')
        return {
          id: typeof item?.id === 'string' ? item.id : crypto.randomUUID(),
          name: typeof item?.name === 'string' ? item.name : '',
          sounds: normalizedSounds,
          createdAt: typeof item?.createdAt === 'number' ? item.createdAt : Date.now(),
          fingerprint
        }
      })
      .filter((item: any) => !!item)
      .sort((a: any, b: any) => b.createdAt - a.createdAt)

    const map = new Map<string, any>()
    normalized.forEach((item: any) => {
      if (!map.has(item.fingerprint)) {
        map.set(item.fingerprint, item)
      }
    })
    return Array.from(map.values()).slice(0, 10)
  }

  const mergeFavoriteSounds = (localVal: any, remoteVal: any) => {
    return normalizeFavoriteSounds([...(Array.isArray(localVal) ? localVal : []), ...(Array.isArray(remoteVal) ? remoteVal : [])])
  }

  
  const pullData = async () => {
    const user = authAdapter.user.value
    if (!user) return

    isSyncing.value = true
    try {
      // 1. Pull Game Data
      const { data: gameData, error: gameError } = await dbAdapter.getAllGameData(user.id)

      if (gameError) throw gameError

      // 2. Pull Profile Settings
      const { data: profileData, error: profileError } = await dbAdapter.getProfile(user.id)
      
      if (profileError) throw profileError

      const settings = profileData?.settings || {}

      // Helper to set localStorage safely
      const setLocal = (key: string, val: any) => {
        if (val !== undefined && val !== null) {
          const valueToStore = typeof val === 'string' ? val : JSON.stringify(val)
          localStorage.setItem(key, valueToStore)
        }
      }

      // Apply Profile Settings
      if (settings.theme) setLocal('moyu-theme-id', settings.theme)
      if (settings.locale) setLocal('moyu-locale', settings.locale)
      if (settings.bossKey) setLocal('moyu-boss-key-settings', settings.bossKey)
      if (settings.calendarRegion) setLocal('moyu-calendar-region', settings.calendarRegion)
      if (settings.danmakuEnabled !== undefined) setLocal('moyu-danmaku-enabled', settings.danmakuEnabled)
      // Add other global settings here (e.g. danmaku)

      // Apply Game Data
      if (gameData) {
        for (const record of gameData) {
          let localKey = record.module_key
          
          if (record.module_key === 'pixel-fishing') localKey = 'pixel-fishing-data'
          if (record.module_key === 'virtual-pet') localKey = 'moyu-virtual-pet-v3'
          if (record.module_key === 'pomodoro-settings') localKey = 'moyu-pomodoro-settings'
          if (record.module_key === 'pomodoro-stats') localKey = 'moyu-pomodoro-stats'
          
          // Skip legacy keys that are now in profile settings
          if (['theme', 'locale', 'boss-key', 'calendar-region', 'danmaku-enabled'].includes(record.module_key)) continue

          if (localKey && record.data) {
            if (localKey === 'favoriteSounds') {
              const localRaw = localStorage.getItem('favoriteSounds')
              let localFavorites: any[] = []
              try {
                localFavorites = localRaw ? JSON.parse(localRaw) : []
              } catch {
                localFavorites = []
              }
              const merged = mergeFavoriteSounds(localFavorites, record.data)
              setLocal(localKey, merged)
              await pushData('favoriteSounds', merged)
            } else {
              setLocal(localKey, record.data)
            }
          }
        }
      }
        
      lastSyncTime.value = Date.now()
      window.dispatchEvent(new Event('storage'))
    } catch (e) {
      console.error('Sync pull failed:', e)
    } finally {
      isSyncing.value = false
    }
  }

  const pushData = async (moduleKey: string, data: any) => {
    const user = authAdapter.user.value
    if (!user) return

    // Debounce
    if (debounceTimers[moduleKey]) {
      clearTimeout(debounceTimers[moduleKey])
    }

    const timerId = window.setTimeout(async () => {
      try {
        // Check if this key belongs to Profile Settings
        const profileKeys = ['theme', 'locale', 'boss-key', 'calendar-region', 'danmaku-enabled']
        
        if (profileKeys.includes(moduleKey)) {
          // Update Profile Settings (Merge)
          const propMap: Record<string, string> = {
            'theme': 'theme',
            'locale': 'locale',
            'boss-key': 'bossKey',
            'calendar-region': 'calendarRegion',
            'danmaku-enabled': 'danmakuEnabled'
          }
          const propName = propMap[moduleKey]

          if (propName) {
            // 2. Smart update
            const { data: currentProfile } = await dbAdapter.getProfile(user.id)
              
            const currentSettings = currentProfile?.settings || {}
            const newSettings = { ...currentSettings, [propName]: data }
            
            await dbAdapter.updateProfile(user.id, {
              settings: newSettings,
              updated_at: new Date().toISOString()
            })
          }

        } else {
          // It's Game Data
          await dbAdapter.syncGameData(user.id, moduleKey, data)
        }

        lastSyncTime.value = Date.now()
      } catch (e) {
        console.error(`Sync push failed for ${moduleKey}:`, e)
      } finally {
        delete debounceTimers[moduleKey]
      }
    }, 2000)
    
    debounceTimers[moduleKey] = timerId
  }

  const clearLocalData = () => {
    // Clear all local storage to ensure auth tokens (CloudBase/Supabase) are also removed
    localStorage.clear()
    window.dispatchEvent(new Event('storage'))
    
    // A page reload is the cleanest way to reset app state after logout.
    window.location.reload()
  }

  return {
    pullData,
    pushData,
    clearLocalData,
    isSyncing,
    lastSyncTime
  }
}
