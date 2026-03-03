import { ref, onMounted, onUnmounted } from 'vue'
import { supabase, type DanmakuRow } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

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

const isConnected = ref(false)
const isConnecting = ref(false)
const onlineCount = ref(1)
const userName = ref('')
const userId = ref('')
const receivedMessages = ref<DanmakuMessage[]>([])
const danmakuHistory = ref<DanmakuMessage[]>([])
const danmakuEnabled = ref(true)

let channel: RealtimeChannel | null = null

function loadDanmakuEnabled() {
  const stored = localStorage.getItem(ENABLED_KEY)
  if (stored !== null) {
    danmakuEnabled.value = stored === 'true'
  }
}

function saveDanmakuEnabled(enabled: boolean) {
  danmakuEnabled.value = enabled
  localStorage.setItem(ENABLED_KEY, String(enabled))
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

async function connect(customUserName?: string) {
  if (!supabase) {
    console.error('Supabase 未配置，请检查环境变量')
    return
  }

  if (isConnected.value || isConnecting.value) return

  isConnecting.value = true

  const localUser = getLocalUser()
  const name = customUserName || localUser?.userName || `摸鱼者${Math.floor(Math.random() * 1000)}`
  
  if (!localUser) {
    userId.value = generateUserId()
    saveLocalUser(name)
  } else {
    userId.value = localUser.userId || generateUserId()
  }

  try {
    channel = supabase.channel('danmaku-room', {
      config: {
        broadcast: { self: false }
      }
    })

    channel
      .on('broadcast', { event: 'danmaku' }, ({ payload }) => {
        const message: DanmakuMessage = {
          id: payload.id,
          content: payload.content,
          emoji: payload.emoji,
          userId: payload.userId,
          userName: payload.userName,
          timestamp: payload.timestamp,
          type: 'user'
        }
        
        receivedMessages.value.push(message)
        addToHistory(message)
        
        if (receivedMessages.value.length > 100) {
          receivedMessages.value = receivedMessages.value.slice(-50)
        }
      })
      .on('broadcast', { event: 'presence' }, ({ payload }) => {
        if (payload.type === 'join') {
          onlineCount.value = payload.count
        } else if (payload.type === 'leave') {
          onlineCount.value = Math.max(1, payload.count)
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          isConnected.value = true
          isConnecting.value = false
          
          channel?.send({
            type: 'broadcast',
            event: 'presence',
            payload: { type: 'join', count: onlineCount.value + 1 }
          })
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          isConnected.value = false
          isConnecting.value = false
        }
      })

    await loadRecentDanmaku()
    
  } catch (error) {
    console.error('连接 Supabase 失败:', error)
    isConnecting.value = false
    isConnected.value = false
  }
}

async function loadRecentDanmaku() {
  if (!supabase) return
  
  try {
    const { data, error } = await supabase
      .from('danmaku')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (error) {
      console.error('加载历史弹幕失败:', error)
      return
    }
    
    if (data) {
      const messages: DanmakuMessage[] = data.reverse().map((row: DanmakuRow) => ({
        id: row.id,
        content: row.content,
        emoji: row.emoji || undefined,
        userId: row.user_id,
        userName: row.user_name,
        timestamp: new Date(row.created_at).getTime(),
        type: 'user' as const
      }))
      
      receivedMessages.value = messages
    }
  } catch (e) {
    console.error('加载历史弹幕异常:', e)
  }
}

async function sendDanmaku(content: string, emoji?: string) {
  if (!supabase || !isConnected.value || !channel) {
    console.error('未连接到服务器')
    return false
  }

  const message: DanmakuMessage = {
    id: Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6),
    content,
    emoji,
    userId: userId.value,
    userName: userName.value,
    timestamp: Date.now(),
    type: 'user'
  }

  try {
    const { error: dbError } = await supabase
      .from('danmaku')
      .insert({
        content: message.content,
        emoji: message.emoji || null,
        user_id: message.userId,
        user_name: message.userName
      })
    
    if (dbError) {
      console.error('保存弹幕失败:', dbError)
    }

    channel.send({
      type: 'broadcast',
      event: 'danmaku',
      payload: message
    })

    addToHistory(message)
    
    receivedMessages.value.push(message)
    if (receivedMessages.value.length > 100) {
      receivedMessages.value = receivedMessages.value.slice(-50)
    }

    return true
  } catch (error) {
    console.error('发送弹幕失败:', error)
    return false
  }
}

function disconnect() {
  if (channel) {
    channel.send({
      type: 'broadcast',
      event: 'presence',
      payload: { type: 'leave', count: onlineCount.value - 1 }
    })
    
    supabase?.removeChannel(channel)
    channel = null
  }
  
  isConnected.value = false
  onlineCount.value = 1
}

export function useSupabaseDanmaku() {
  onMounted(() => {
    loadDanmakuEnabled()
    loadHistory()
    
    if (danmakuEnabled.value) {
      getLocalUser()
      connect()
    }
  })

  onUnmounted(() => {
    // 保持全局单例，不在这里断开
  })

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
