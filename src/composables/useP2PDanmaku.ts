import { ref, onUnmounted } from 'vue'
import Peer, { type DataConnection } from 'peerjs'
import { i18n } from '@/core/i18n'

export interface DanmakuMessage {
  id: string
  content: string
  emoji?: string
  userId: string
  userName: string
  timestamp: number
  type: 'user' | 'system'
}

export interface PeerUser {
  id: string
  name: string
  connected: boolean
}

const STORAGE_KEY = 'moyu-danmaku-user'
const HISTORY_KEY = 'moyu-danmaku-history'
const ENABLED_KEY = 'moyu-danmaku-enabled'
const MAX_HISTORY = 100

const peer = ref<Peer | null>(null)
const connections = ref<Map<string, DataConnection>>(new Map())
const isConnected = ref(false)
const isConnecting = ref(false)
const peerId = ref('')
const userName = ref('')
const onlineUsers = ref<PeerUser[]>([])
const receivedMessages = ref<DanmakuMessage[]>([])
const danmakuHistory = ref<DanmakuMessage[]>([])
const danmakuEnabled = ref(true)

function fallbackName() {
  return (i18n.global.locale as any).value === 'en' ? 'Guest Angler' : '匿名摸鱼者'
}

function roomName() {
  return (i18n.global.locale as any).value === 'en' ? 'Angler' : '摸鱼者'
}

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
    console.error('Failed to load danmaku history:', e)
    danmakuHistory.value = []
  }
}

function saveHistory() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(danmakuHistory.value))
  } catch (e) {
    console.error('Failed to save danmaku history:', e)
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
    return data
  }
  return null
}

function saveLocalUser(name: string) {
  userName.value = name
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    userName: name,
    createdAt: Date.now()
  }))
}

function generateUserId() {
  return 'user_' + Math.random().toString(36).substring(2, 9)
}

function connect(customUserName?: string) {
  if (peer.value || isConnecting.value) return

  isConnecting.value = true

  const localUser = getLocalUser()
  const name = customUserName || localUser?.userName || `${roomName()}${Math.floor(Math.random() * 1000)}`
  
  if (!localUser && !customUserName) {
    saveLocalUser(name)
  }

  const userId = generateUserId()
  const peerInstance = new Peer(userId, {
    debug: 0
  })

  peerInstance.on('open', (id) => {
    peerId.value = id
    isConnected.value = true
    isConnecting.value = false
    
    joinRoom(peerInstance)
  })

  peerInstance.on('connection', (conn) => {
    handleConnection(conn)
  })

  peerInstance.on('error', (err) => {
    console.error('PeerJS error:', err)
    isConnecting.value = false
    isConnected.value = false
  })

  peerInstance.on('disconnected', () => {
    isConnected.value = false
  })

  peer.value = peerInstance
}

function joinRoom(peerInstance: Peer) {
  const existingPeers = getExistingPeers()
  
  existingPeers.forEach(pid => {
    if (pid !== peerInstance.id) {
      const conn = peerInstance.connect(pid, {
        reliable: true
      })
      handleConnection(conn)
    }
  })

  broadcastPeerId(peerInstance.id)
}

function getExistingPeers(): string[] {
  try {
    const stored = localStorage.getItem('moyu-known-peers')
    if (stored) {
      const peers = JSON.parse(stored)
      return peers.filter((id: string) => Date.now() - parseInt(id.split('_')[1] || '0') < 3600000)
    }
  } catch (e) {
    console.error('Failed to get existing peers:', e)
  }
  return []
}

function broadcastPeerId(id: string) {
  try {
    const peers = getExistingPeers()
    if (!peers.includes(id)) {
      peers.push(id)
      localStorage.setItem('moyu-known-peers', JSON.stringify(peers.slice(-50)))
    }
  } catch (e) {
    console.error('Failed to broadcast peer ID:', e)
  }
}

function handleConnection(conn: DataConnection) {
  conn.on('open', () => {
    connections.value.set(conn.peer, conn)
    
    updateOnlineUsers()
    
    conn.send({
      type: 'handshake',
      userName: userName.value,
      peerId: peerId.value
    })
  })

  conn.on('data', (data: any) => {
    handleMessage(data, conn.peer)
  })

  conn.on('close', () => {
    connections.value.delete(conn.peer)
    updateOnlineUsers()
  })

  conn.on('error', (err) => {
    console.error('Connection error:', err)
    connections.value.delete(conn.peer)
  })
}

function handleMessage(data: any, fromPeer: string) {
  if (data.type === 'handshake') {
    const existingUser = onlineUsers.value.find(u => u.id === fromPeer)
    if (!existingUser) {
      onlineUsers.value.push({
        id: fromPeer,
        name: data.userName || fallbackName(),
        connected: true
      })
    }
  } else if (data.type === 'danmaku') {
    const message: DanmakuMessage = {
      id: data.id || Date.now().toString(),
      content: data.content,
      emoji: data.emoji,
      userId: fromPeer,
      userName: data.userName || fallbackName(),
      timestamp: data.timestamp || Date.now(),
      type: 'user'
    }
    
    receivedMessages.value.push(message)
    addToHistory(message)
    
    if (receivedMessages.value.length > 100) {
      receivedMessages.value = receivedMessages.value.slice(-50)
    }
  }
}

function updateOnlineUsers() {
  onlineUsers.value = Array.from(connections.value.keys()).map(pid => ({
    id: pid,
    name: roomName(),
    connected: connections.value.has(pid)
  }))
}

function sendDanmaku(content: string, emoji?: string) {
  const message: DanmakuMessage = {
    id: Date.now().toString(),
    content,
    emoji,
    userId: peerId.value,
    userName: userName.value,
    timestamp: Date.now(),
    type: 'user'
  }

  if (isConnected.value && peer.value) {
    connections.value.forEach((conn) => {
      if (conn.open) {
        conn.send({
          ...message,
          type: 'danmaku'
        })
      }
    })
  }

  addToHistory(message)

  receivedMessages.value.push(message)
  if (receivedMessages.value.length > 100) {
    receivedMessages.value = receivedMessages.value.slice(-50)
  }

  return true
}

function disconnect() {
  if (peer.value) {
    connections.value.forEach((conn) => {
      conn.close()
    })
    peer.value.destroy()
    peer.value = null
    connections.value.clear()
    isConnected.value = false
    peerId.value = ''
    onlineUsers.value = []
  }
}

export function useP2PDanmaku() {
  onUnmounted(() => {
    // 不在这里断开连接，保持全局单例
  })

  return {
    peer,
    connections,
    isConnected,
    isConnecting,
    peerId,
    userName,
    onlineUsers,
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
