import { ref } from 'vue'
import { supabase } from '@/core/supabase/client'

const isSyncing = ref(false)
const lastSyncTime = ref<number | null>(null)

// Debounce map for push operations
const debounceTimers: Record<string, number> = {}

export function useCloudSync() {
  
  const pullData = async () => {
    if (!supabase) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    isSyncing.value = true
    try {
      // 1. Pull Game Data
      const { data: gameData, error: gameError } = await supabase
        .from('user_game_data')
        .select('module_key, data')
        .eq('user_id', session.user.id)

      if (gameError) throw gameError

      // 2. Pull Profile Settings
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('settings')
        .eq('id', session.user.id)
        .single()
      
      if (profileError && profileError.code !== 'PGRST116') throw profileError

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
        gameData.forEach(record => {
          let localKey = record.module_key
          
          if (record.module_key === 'pixel-fishing') localKey = 'pixel-fishing-data'
          if (record.module_key === 'virtual-pet') localKey = 'moyu-virtual-pet-v3'
          if (record.module_key === 'pomodoro-settings') localKey = 'moyu-pomodoro-settings'
          if (record.module_key === 'pomodoro-stats') localKey = 'moyu-pomodoro-stats'
          
          // Skip legacy keys that are now in profile settings
          if (['theme', 'locale', 'boss-key', 'calendar-region', 'danmaku-enabled'].includes(record.module_key)) return

          if (localKey && record.data) {
            setLocal(localKey, record.data)
          }
        })
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
    if (!supabase) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    // Debounce
    if (debounceTimers[moduleKey]) {
      clearTimeout(debounceTimers[moduleKey])
    }

    const timerId = window.setTimeout(async () => {
      try {
        if (!supabase) return 
        
        // Check if this key belongs to Profile Settings
        const profileKeys = ['theme', 'locale', 'boss-key', 'calendar-region', 'danmaku-enabled']
        
        if (profileKeys.includes(moduleKey)) {
          // Update Profile Settings (Merge)
          // First, we need to know the current structure or just update the specific field using JSONB update
          // But Supabase simple update overwrites the column. 
          // Better to fetch current settings or use a stored procedure, 
          // OR, since we are client-side, we assume we want to patch the JSON.
          
          // A simple approach: 
          // 1. Map moduleKey to settings property name
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
            const { data: currentProfile } = await supabase
              .from('profiles')
              .select('settings')
              .eq('id', session.user.id)
              .single()
              
            const currentSettings = currentProfile?.settings || {}
            // Explicitly cast currentSettings to any or defined type to avoid TS issues with index signature
            const newSettings = { ...currentSettings, [propName]: data }
            
            await supabase
              .from('profiles')
              .update({ settings: newSettings, updated_at: new Date().toISOString() })
              .eq('id', session.user.id)
          }

        } else {
          // It's Game Data
          await supabase
            .from('user_game_data')
            .upsert({
              user_id: session.user.id,
              module_key: moduleKey,
              data: data,
              synced_at: new Date().toISOString()
            }, { onConflict: 'user_id, module_key' })
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
    // List of keys managed by CloudSync
    const managedKeys = [
      'pixel-fishing-data',
      'moyu-virtual-pet-v3',
      'moyu-theme-id',
      'moyu-locale',
      'moyu-boss-key-settings',
      'moyu-calendar-region',
      'moyu-danmaku-enabled',
      'moyu-pomodoro-settings',
      'moyu-pomodoro-stats',
      'moyu-pomodoro-mixes'
    ]
    
    managedKeys.forEach(key => localStorage.removeItem(key))
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
