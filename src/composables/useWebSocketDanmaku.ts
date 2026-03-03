import { ref, onMounted, onUnmounted } from 'vue'

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

// WebSocket 服务器地址（部署时修改为实际地址）
const WS_URL = import.meta.env.VITE_DANMAKU_WS_URL || 'ws://119.91.26.159:3001'

const isConnected = ref(false)
const isConnecting = ref(false)
const onlineCount = ref(1)
const userName = ref('')
const userId = ref('')
const receivedMessages = ref<DanmakuMessage[]>([])
const danmakuHistory = ref<DanmakuMessage[]>([])
const danmakuEnabled = ref(true)

let ws: WebSocket | null = null
let reconnectTimer: number | null = null
let heartbeatTimer: number | null = null

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

function startHeartbeat() {
  stopHeartbeat()
  
  heartbeatTimer = window.setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }))
    }
  }, 30000)
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return
  
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null
    if (!isConnected.value && danmakuEnabled.value) {
      connect()
    }
  }, 5000)
}

function connect(customUserName?: string) {
  if (isConnected.value || isConnecting.value) return
  
  const localUser = getLocalUser()
  const name = customUserName || localUser?.userName || `摸鱼者${Math.floor(Math.random() * 1000)}`
  
  if (!localUser) {
    userId.value = generateUserId()
    saveLocalUser(name)
  } else {
    userId.value = localUser.userId || generateUserId()
  }

  isConnecting.value = true

  try {
    ws = new WebSocket(WS_URL)

    ws.onopen = () => {
      console.log('[弹幕] WebSocket 连接成功')
      isConnected.value = true
      isConnecting.value = false
      startHeartbeat()
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        
        switch (message.type) {
          case 'init': {
            // 初始化消息，包含最近弹幕和在线人数
            onlineCount.value = Math.max(1, message.data.onlineCount)
            
            if (message.data.recentDanmaku) {
              receivedMessages.value = message.data.recentDanmaku.map((d: any) => ({
                id: d.id.toString(),
                content: d.content,
                emoji: d.emoji || undefined,
                userId: d.userId,
                userName: d.userName,
                timestamp: d.timestamp,
                type: 'user' as const
              }))
            }
            break
          }
          
          case 'danmaku': {
            // 新弹幕
            const danmaku: DanmakuMessage = {
              id: message.data.id.toString(),
              content: message.data.content,
              emoji: message.data.emoji || undefined,
              userId: message.data.userId,
              userName: message.data.userName,
              timestamp: message.data.timestamp,
              type: 'user'
            }
            
            receivedMessages.value.push(danmaku)
            addToHistory(danmaku)
            
            if (receivedMessages.value.length > 100) {
              receivedMessages.value = receivedMessages.value.slice(-50)
            }
            break
          }
          
          case 'presence': {
            // 在线人数更新
            onlineCount.value = Math.max(1, message.data.onlineCount)
            break
          }
          
          case 'pong': {
            // 心跳响应
            break
          }
          
          case 'shutdown': {
            console.log('[弹幕] 服务器关闭:', message.data.message)
            break
          }
          
          case 'error': {
            console.error('[弹幕] 服务器错误:', message.data.message)
            break
          }
        }
      } catch (e) {
        console.error('[弹幕] 消息解析错误:', e)
      }
    }

    ws.onclose = (event) => {
      console.log('[弹幕] WebSocket 连接关闭:', event.code, event.reason)
      isConnected.value = false
      isConnecting.value = false
      stopHeartbeat()
      
      // 非正常关闭时尝试重连
      if (event.code !== 1000 && danmakuEnabled.value) {
        scheduleReconnect()
      }
    }

    ws.onerror = (error) => {
      console.error('[弹幕] WebSocket 错误:', error)
      isConnected.value = false
      isConnecting.value = false
    }

  } catch (error) {
    console.error('[弹幕] 创建 WebSocket 失败:', error)
    isConnecting.value = false
    isConnected.value = false
    scheduleReconnect()
  }
}

function sendDanmaku(content: string, emoji?: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error('[弹幕] WebSocket 未连接')
      resolve(false)
      return
    }

    if (!content || !content.trim()) {
      resolve(false)
      return
    }

    const message = {
      type: 'danmaku',
      data: {
        content: content.trim().slice(0, 100),
        emoji,
        userId: userId.value,
        userName: userName.value
      }
    }

    try {
      ws.send(JSON.stringify(message))
      
      // 本地也添加到历史（服务器会广播回来，但为了即时反馈先本地处理）
      const localMessage: DanmakuMessage = {
        id: Date.now().toString(),
        content: content.trim().slice(0, 100),
        emoji,
        userId: userId.value,
        userName: userName.value,
        timestamp: Date.now(),
        type: 'user'
      }
      
      addToHistory(localMessage)
      resolve(true)
    } catch (error) {
      console.error('[弹幕] 发送失败:', error)
      resolve(false)
    }
  })
}

function disconnect() {
  stopHeartbeat()
  
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  
  if (ws) {
    ws.close(1000, '用户断开')
    ws = null
  }
  
  isConnected.value = false
  onlineCount.value = 1
}

export function useWebSocketDanmaku() {
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
