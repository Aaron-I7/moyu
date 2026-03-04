import { ref, onMounted, onUnmounted } from 'vue'
import { i18n } from '@/core/i18n'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { hasSupabaseConfig, supabase } from '@/core/supabase/client'

export interface DanmakuMessage {
  id: string
  content: string
  emoji?: string
  userId: string
  userName: string
  timestamp: number
  type: 'user' | 'system'
}

const STORAGE_KEY = 'moyu-danmaku-user'
const HISTORY_KEY = 'moyu-danmaku-history'
const ENABLED_KEY = 'moyu-danmaku-enabled'
const MAX_HISTORY = 100
const MAX_RECEIVED = 100
const DANMAKU_TABLE = import.meta.env.VITE_SUPABASE_DANMAKU_TABLE || 'danmaku_messages'

const isConnected = ref(false)
const isConnecting = ref(false)
const onlineCount = ref(1)
const userName = ref('')
const userId = ref('')
const receivedMessages = ref<DanmakuMessage[]>([])
const danmakuHistory = ref<DanmakuMessage[]>([])
const danmakuEnabled = ref(true)

let reconnectTimer: number | null = null
let realtimeChannel: RealtimeChannel | null = null

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
  if (message.type === 'system') return
  
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

function mapRowToMessage(row: any): DanmakuMessage {
  return {
    id: String(row.id),
    content: row.content,
    emoji: row.emoji || undefined,
    userId: row.user_id,
    userName: row.user_name,
    timestamp: normalizeTimestamp(row.created_at),
    type: 'user'
  }
}

function pushReceivedMessage(message: DanmakuMessage, persistHistory = true) {
  if (receivedMessages.value.some(item => item.id === message.id)) return
  receivedMessages.value.push(message)
  if (persistHistory) addToHistory(message)
  if (receivedMessages.value.length > MAX_RECEIVED) {
    receivedMessages.value = receivedMessages.value.slice(-50)
  }
}

async function loadRecentMessages() {
  if (!supabase) return
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { data, error } = await supabase
    .from(DANMAKU_TABLE)
    .select('id, content, emoji, user_id, user_name, created_at')
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !data) {
    return
  }

  receivedMessages.value = data.reverse().map(mapRowToMessage)
}

function updateOnlineCount() {
  if (!realtimeChannel) {
    onlineCount.value = 1
    return
  }
  const state = realtimeChannel.presenceState()
  onlineCount.value = Math.max(1, Object.keys(state).length)
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
  
  const localUser = getLocalUser()
  const name = customUserName || localUser?.userName || buildDefaultUserName()
  
  if (!localUser) {
    userId.value = generateUserId()
    saveLocalUser(name)
  } else {
    userId.value = localUser.userId || generateUserId()
  }

  if (!hasSupabaseConfig || !supabase) {
    isConnecting.value = false
    isConnected.value = false
    onlineCount.value = 1
    return
  }

  isConnecting.value = true

  try {
    await loadRecentMessages()

    realtimeChannel = supabase
      .channel('moyu-danmaku', {
        config: {
          presence: {
            key: userId.value
          }
        }
      })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: DANMAKU_TABLE },
        payload => {
          pushReceivedMessage(mapRowToMessage(payload.new))
        }
      )
      .on('presence', { event: 'sync' }, () => {
        updateOnlineCount()
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          await realtimeChannel?.track({
            userId: userId.value,
            userName: userName.value,
            onlineAt: Date.now()
          })
          isConnected.value = true
          isConnecting.value = false
          updateOnlineCount()
          return
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          isConnected.value = false
          isConnecting.value = false
          onlineCount.value = 1
          if (danmakuEnabled.value) {
            scheduleReconnect()
          }
        }
      })
  } catch (error) {
    isConnecting.value = false
    isConnected.value = false
    scheduleReconnect()
  }
}

async function sendDanmaku(content: string, emoji?: string): Promise<boolean> {
  if (!supabase || !isConnected.value) {
    return false
  }

  const safeContent = content.trim().slice(0, 100)
  if (!safeContent) {
    return false
  }

  const { data, error } = await supabase
    .from(DANMAKU_TABLE)
    .insert({
      content: safeContent,
      emoji: emoji || null,
      user_id: userId.value,
      user_name: userName.value
    })
    .select('id, content, emoji, user_id, user_name, created_at')
    .single()

  if (error) {
    return false
  }

  if (data) {
    pushReceivedMessage(mapRowToMessage(data))
  }
  return true
}

function disconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  if (realtimeChannel && supabase) {
    void supabase.removeChannel(realtimeChannel)
    realtimeChannel = null
  }

  isConnected.value = false
  isConnecting.value = false
  onlineCount.value = 1
}

function saveDanmakuEnabled(enabled: boolean) {
  danmakuEnabled.value = enabled
  localStorage.setItem(ENABLED_KEY, String(enabled))
  if (enabled) {
    void connect()
  } else {
    disconnect()
  }
}

function useLifecycle() {
  onMounted(() => {
    loadDanmakuEnabled()
    loadHistory()
    
    if (danmakuEnabled.value) {
      getLocalUser()
      void connect()
    }
  })

  onUnmounted(() => {
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
    saveLocalUser,
    loadHistory,
    clearHistory,
    loadDanmakuEnabled,
    saveDanmakuEnabled
  }
}
