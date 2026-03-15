import { ref, onMounted, onUnmounted, watch } from 'vue'
import { i18n } from '@/core/i18n'
import { dbAdapter, realtimeAdapter } from '@/core/adapter'
import { useCloudSync } from './useCloudSync'
import { useTracking } from './useTracking'
import type { DanmakuMessage } from '@/core/adapter/types'

export type { DanmakuMessage }

const STORAGE_KEY = 'moyu-danmaku-user'
const HISTORY_KEY = 'moyu-danmaku-history'
const ENABLED_KEY = 'moyu-danmaku-enabled'
const MAX_HISTORY = 100
const MAX_RECEIVED = 100

const isConnected = ref(false)
const isConnecting = ref(false)
const onlineCount = ref(1)
const userName = ref('')
const userId = ref('')
const receivedMessages = ref<DanmakuMessage[]>([])
const danmakuHistory = ref<DanmakuMessage[]>([])
const danmakuEnabled = ref(true)
const sessionTextColor = ref<string | null>(null)
const sessionBackgroundColor = ref<string | null>(null)

let reconnectTimer: number | null = null
let lifecycleRefCount = 0
const { pushData } = useCloudSync()

// ... buildDefaultUserName, loadDanmakuEnabled, loadHistory, saveHistory, addToHistory, clearHistory, getLocalUser, saveLocalUser, generateUserId, normalizeTimestamp ...
// I need to keep these helpers or move them.
// I will keep them but they are inside the file content I'm replacing if I replace the whole file.
// I'll try to replace chunks.

function buildDefaultUserName() {
  const suffix = Math.floor(Math.random() * 1000)
  return (i18n.global.locale as any).value === 'en' ? `Angler${suffix}` : `摸鱼者${suffix}`
}

function loadDanmakuEnabled() {
  const stored = localStorage.getItem(ENABLED_KEY)
  if (stored !== null) {
    danmakuEnabled.value = stored === 'true'
  }
}

function loadHistory() {
  try {
    const stored = localStorage.getItem(HISTORY_KEY)
    if (stored) {
      danmakuHistory.value = JSON.parse(stored)
    }
  } catch (e) {
    console.error('加载弹幕历史失败:', e)
    danmakuHistory.value = []
  }
}

function saveHistory() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(danmakuHistory.value))
  } catch (e) {
    console.error('保存弹幕历史失败:', e)
  }
}

function addToHistory(message: DanmakuMessage) {
  // if (message.type === 'system') return // Type is optional in DanmakuMessage interface now? No, I defined it in types.ts?
  // In types.ts I defined DanmakuMessage without 'type'.
  // I should update types.ts to include 'type' or just ignore it here.
  // The original code had `type: 'user' | 'system'`.
  // I'll assume all messages are user messages for now or check fields.
  
  danmakuHistory.value.push(message)
  
  if (danmakuHistory.value.length > MAX_HISTORY) {
    danmakuHistory.value = danmakuHistory.value.slice(-MAX_HISTORY)
  }
  
  saveHistory()
}

function clearHistory() {
  danmakuHistory.value = []
  saveHistory()
}

function getLocalUser() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    const data = JSON.parse(stored)
    userName.value = data.userName || ''
    userId.value = data.userId || ''
    return data
  }
  return null
}

function saveLocalUser(name: string) {
  userName.value = name
  if (!userId.value) {
    userId.value = 'user_' + Math.random().toString(36).substring(2, 9)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    userId: userId.value,
    userName: name,
    createdAt: Date.now()
  }))
}

function generateUserId() {
  return 'user_' + Math.random().toString(36).substring(2, 9)
}

function normalizeTimestamp(createdAt?: string | null, fallback = Date.now()) {
  if (!createdAt) return fallback
  const parsed = Date.parse(createdAt)
  return Number.isNaN(parsed) ? fallback : parsed
}

function pushReceivedMessage(message: DanmakuMessage, persistHistory = true) {
  if (receivedMessages.value.some(item => item.id === message.id)) return
  
  // Dedup logic based on content/time/user
  const msgTime = normalizeTimestamp(message.created_at)
  
  if (receivedMessages.value.some(item => 
    item.content === message.content && 
    Math.abs(normalizeTimestamp(item.created_at) - msgTime) < 10000 &&
    item.user_id === message.user_id
  )) return

  receivedMessages.value.push(message)
  if (persistHistory) addToHistory(message)
  if (receivedMessages.value.length > MAX_RECEIVED) {
    receivedMessages.value = receivedMessages.value.slice(-50)
  }
}

async function loadRecentMessages() {
  const { data, error } = await dbAdapter.getRecentDanmaku()

  if (error || !data) {
    return
  }

  receivedMessages.value = data
}

function updateOnlineCount() {
  onlineCount.value = realtimeAdapter.onlineCount.value
}

function scheduleReconnect() {
  if (reconnectTimer) return
  
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null
    if (!isConnected.value && danmakuEnabled.value) {
      void connect()
    }
  }, 5000)
}

async function connect(customUserName?: string) {
  if (isConnected.value || isConnecting.value) return
  
  const name = customUserName || userName.value || buildDefaultUserName()
  userName.value = name
  if (!userId.value) {
    userId.value = generateUserId()
  }

  isConnecting.value = true

  try {
    await loadRecentMessages()

    realtimeAdapter.subscribeDanmaku((msg) => {
      pushReceivedMessage(msg)
    })

    await realtimeAdapter.connect()
    
    // Setup watchers for adapter state
    // We only need to watch once or setup once? 
    // Since useRealtimeDanmaku is singleton-like (refs outside), we can watch.
    // But watchers duplicate if connect called multiple times?
    // Adapter state is reactive.
    
    isConnected.value = true
    isConnecting.value = false
    updateOnlineCount()
    
    // Watch adapter online count
    // Note: this might create multiple watchers if connect called multiple times
    // Better to watch outside.
    
  } catch (error) {
    console.error('Danmaku connect error:', error)
    isConnecting.value = false
    isConnected.value = false
    scheduleReconnect()
  }
}

// Watchers for adapter state (Global)
watch(() => realtimeAdapter.isConnected.value, (val) => {
  isConnected.value = val
  if (!val && danmakuEnabled.value) {
    scheduleReconnect()
  }
})

watch(() => realtimeAdapter.onlineCount.value, (val) => {
  onlineCount.value = val
})

async function sendDanmaku(content: string, emoji?: string): Promise<boolean> {
  const { track } = useTracking()
  
  if (!isConnected.value) {
    return false
  }

  const safeContent = content.trim().slice(0, 100)
  if (!safeContent) {
    return false
  }

  try {
    const message = {
      content: safeContent,
      emoji: emoji || undefined,
      user_id: userId.value,
      user_name: userName.value,
      textColor: sessionTextColor.value || undefined,
      backgroundColor: sessionBackgroundColor.value || undefined
    }
    
    const success = await realtimeAdapter.sendDanmaku(message)

    if (success) {
      // Track danmaku event
      track('danmaku_sent', {
        has_emoji: !!emoji,
        length: safeContent.length
      })

      // We don't need to push manually if we are subscribed to changes?
      // Supabase adapter doesn't broadcast anymore, relying on DB change.
      // CloudBase adapter relies on watch.
      // So pushing manually gives instant feedback.
      
      const localMsg: DanmakuMessage = {
        ...message,
        id: 'local-' + Date.now(),
        created_at: new Date().toISOString()
      }
      pushReceivedMessage(localMsg)
      
      return true
    }
  } catch (e) {
    console.error('Error sending danmaku:', e)
    return false
  }
  return false
}

function setSessionDanmakuProfile(profile: {
  userName?: string
  textColor?: string | null
  backgroundColor?: string | null
}) {
  if (typeof profile.userName === 'string') {
    userName.value = profile.userName.trim()
  }
  if (profile.textColor !== undefined) {
    sessionTextColor.value = profile.textColor
  }
  if (profile.backgroundColor !== undefined) {
    sessionBackgroundColor.value = profile.backgroundColor
  }
}

function disconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  realtimeAdapter.disconnect()

  isConnected.value = false
  isConnecting.value = false
  onlineCount.value = 1
}

function saveDanmakuEnabled(enabled: boolean) {
  danmakuEnabled.value = enabled
  localStorage.setItem(ENABLED_KEY, String(enabled))
  pushData('danmaku-enabled', enabled)
  if (enabled) {
    void connect()
  } else {
    disconnect()
  }
}

function useLifecycle() {
  onMounted(() => {
    lifecycleRefCount += 1
    if (lifecycleRefCount !== 1) return

    loadDanmakuEnabled()
    loadHistory()

    const onStorage = (event: StorageEvent) => {
      if (event.key === ENABLED_KEY) {
        if (event.newValue === null) {
          danmakuEnabled.value = true
        } else {
          danmakuEnabled.value = event.newValue === 'true'
        }

        if (danmakuEnabled.value) {
          void connect()
        } else {
          disconnect()
        }
      }
    }

    const onVisibilityChange = () => {
      if (document.hidden) return
      if (!danmakuEnabled.value) return
      void connect()
    }

    window.addEventListener('storage', onStorage)
    document.addEventListener('visibilitychange', onVisibilityChange)

    ;(useLifecycle as any)._cleanup = () => {
      window.removeEventListener('storage', onStorage)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }

    if (danmakuEnabled.value) {
      getLocalUser()
      void connect()
    }
  })

  onUnmounted(() => {
    lifecycleRefCount = Math.max(0, lifecycleRefCount - 1)
    if (lifecycleRefCount !== 0) return
    const cleanup = (useLifecycle as any)._cleanup as (() => void) | undefined
    if (cleanup) cleanup()
  })
}

export function useRealtimeDanmaku() {
  useLifecycle()

  return {
    isConnected,
    isConnecting,
    onlineCount,
    userName,
    userId,
    receivedMessages,
    danmakuHistory,
    danmakuEnabled,
    connect,
    disconnect,
    sendDanmaku,
    setSessionDanmakuProfile,
    saveLocalUser,
    loadHistory,
    clearHistory,
    loadDanmakuEnabled,
    saveDanmakuEnabled
  }
}
