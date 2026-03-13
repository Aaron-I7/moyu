import type { Ref } from 'vue'

export interface UnifiedUser {
  id: string
  email?: string
  isAnonymous: boolean
  provider: 'supabase' | 'cloudbase'
}

export interface AuthCapabilities {
  email: boolean
  anonymous: boolean
  otp: boolean
}

export interface AuthAdapter {
  provider: 'supabase' | 'cloudbase'
  capabilities: AuthCapabilities
  user: Ref<UnifiedUser | null>
  
  init(): Promise<void>
  login(email?: string, password?: string): Promise<{ user: UnifiedUser | null; error: any }>
  sendLoginOtp(email: string): Promise<{ error: any }>
  loginWithOtp(email: string, code: string): Promise<{ user: UnifiedUser | null; error: any }>
  register(email?: string, password?: string, username?: string): Promise<{ user: UnifiedUser | null; error: any }>
  sendRegisterOtp(email: string, password: string, username?: string): Promise<{ error: any }>
  registerWithOtp(email: string, code: string): Promise<{ user: UnifiedUser | null; error: any }>
  beginSmartAuth(email: string, password?: string): Promise<{ error: any }>
  verifySmartAuth(email: string, code: string): Promise<{ user: UnifiedUser | null; error: any }>
  updateNickname(nickname: string): Promise<{ error: any }>
  startPasswordReset(email: string): Promise<{ error: any }>
  confirmPasswordReset(email: string, code: string, newPassword: string): Promise<{ error: any }>
  logout(): Promise<void>
  onAuthStateChange(callback: (user: UnifiedUser | null) => void): void
}

export interface DatabaseAdapter {
  getProfile(userId: string): Promise<{ data: any; error: any }>
  updateProfile(userId: string, data: any): Promise<{ data: any; error: any }>
  
  // Game Data
  getGameData(userId: string, moduleKey: string): Promise<{ data: any; error: any }>
  getAllGameData(userId: string): Promise<{ data: any[]; error: any }>
  syncGameData(userId: string, moduleKey: string, data: any): Promise<{ data: any; error: any }>
  
  // Analytics
  logEvent(event: string, properties: any, meta?: { userId?: string | null; sessionId?: string; url?: string }): Promise<void>
  getAnalyticsEvents(limit?: number): Promise<{ data: any[]; error: any }>
  
  // Feedback
  sendFeedback(userId: string | null, content: string, contact?: string): Promise<boolean>
  
  // Danmaku History
  getRecentDanmaku(): Promise<{ data: DanmakuMessage[]; error: any }>
}

export interface DanmakuMessage {
  id: string | number
  content: string
  emoji?: string
  user_id: string
  user_name: string
  created_at: string
  textColor?: string
  backgroundColor?: string
}

export interface RealtimeAdapter {
  isConnected: Ref<boolean>
  onlineCount: Ref<number>
  
  connect(): Promise<void>
  disconnect(): void
  
  sendDanmaku(message: Omit<DanmakuMessage, 'id' | 'created_at'>): Promise<boolean>
  subscribeDanmaku(callback: (message: DanmakuMessage) => void): void
}

export interface FunctionAdapter {
  invoke<T = any>(functionName: string, payload?: any, options?: any): Promise<{ data: T | null; error: any }>
}
