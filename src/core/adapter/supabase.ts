import { ref } from 'vue'
import { supabase } from '@/core/supabase/client'
import { checkVentContent } from '@/core/contentSafety'
import type { 
  AuthAdapter, 
  DatabaseAdapter, 
  RealtimeAdapter, 
  FunctionAdapter,
  UnifiedUser,
  DanmakuMessage,
  VentPost
} from './types'

// --- Auth Adapter ---
export class SupabaseAuthAdapter implements AuthAdapter {
  provider = 'supabase' as const
  capabilities = { email: true, anonymous: false, otp: true }
  user = ref<UnifiedUser | null>(null)

  async init() {
    if (!supabase) return
    const { data } = await supabase.auth.getSession()
    this.updateUser(data.session?.user || null)

    supabase.auth.onAuthStateChange((_event, session) => {
      this.updateUser(session?.user || null)
    })
  }

  private updateUser(sbUser: any) {
    if (!sbUser) {
      this.user.value = null
      return
    }
    const resolvedId = String(sbUser.id || sbUser.user_id || sbUser.sub || '')
    if (!resolvedId) {
      this.user.value = null
      return
    }
    this.user.value = {
      id: resolvedId,
      email: sbUser.email,
      isAnonymous: false,
      provider: 'supabase'
    }
  }

  async login(email?: string, password?: string) {
    if (!supabase) return { user: null, error: 'Supabase not initialized' }
    if (!email || !password) return { user: null, error: 'Missing credentials' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { user: this.user.value, error }
  }

  async sendLoginOtp(email: string) {
    if (!supabase) return { error: 'Supabase not initialized' }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false
      }
    })
    return { error }
  }

  async loginWithOtp(email: string, code: string) {
    if (!supabase) return { user: null, error: 'Supabase not initialized' }
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email'
    })
    return { user: this.user.value, error }
  }

  async register(email?: string, password?: string, _username?: string) {
    if (!supabase) return { user: null, error: 'Supabase not initialized' }
    if (!email || !password) return { user: null, error: 'Missing credentials' }
    const { error } = await supabase.auth.signUp({ email, password })
    return { user: this.user.value, error }
  }

  async sendRegisterOtp(email: string, _password: string, _username?: string) {
    if (!supabase) return { error: 'Supabase not initialized' }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true
      }
    })
    return { error }
  }

  async registerWithOtp(email: string, code: string) {
    if (!supabase) return { user: null, error: 'Supabase not initialized' }
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email'
    })
    return { user: this.user.value, error }
  }

  async beginSmartAuth(email: string, _password?: string) {
    return this.sendLoginOtp(email)
  }

  async verifySmartAuth(email: string, code: string) {
    return this.loginWithOtp(email, code)
  }

  async updateNickname(_nickname: string) {
    return { error: null }
  }

  async startPasswordReset(email: string) {
    if (!supabase) return { error: 'Supabase not initialized' }
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    return { error }
  }

  async confirmPasswordReset(_email: string, _code: string, _newPassword: string) {
    return { error: new Error('Supabase 密码重置请通过邮件链接完成') }
  }

  async logout() {
    if (!supabase) return
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Logout timeout')), 2000))
      ])
    } catch (e) {
      console.error('Supabase logout error:', e)
    }
  }

  onAuthStateChange(_callback: (user: UnifiedUser | null) => void) {
    // Already handled by internal listener updating this.user
    // But we can expose a way to watch
    // Simplified: caller watches adapter.user
  }
}

// --- Database Adapter ---
export class SupabaseDatabaseAdapter implements DatabaseAdapter {
  async getProfile(userId: string) {
    if (!supabase) return { data: null, error: 'Supabase not initialized' }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  }

  async updateProfile(userId: string, data: any) {
    if (!supabase) return { data: null, error: 'Supabase not initialized' }
    const { data: res, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...data })
      .select()
      .single()
    return { data: res, error }
  }

  async getGameData(userId: string, moduleKey: string) {
    if (!supabase) return { data: null, error: 'Supabase not initialized' }
    const { data, error } = await supabase
      .from('user_game_data')
      .select('data')
      .eq('user_id', userId)
      .eq('module_key', moduleKey)
      .single()
    return { data: data?.data, error }
  }

  async getAllGameData(userId: string) {
    if (!supabase) return { data: [], error: 'Supabase not initialized' }
    const { data, error } = await supabase
      .from('user_game_data')
      .select('module_key, data')
      .eq('user_id', userId)
    return { data: data || [], error }
  }

  async syncGameData(userId: string, moduleKey: string, data: any) {
    if (!supabase) return { data: null, error: 'Supabase not initialized' }
    const { data: res, error } = await supabase
      .from('user_game_data')
      .upsert({
        user_id: userId,
        module_key: moduleKey,
        data,
        synced_at: new Date().toISOString()
      })
      .select()
    return { data: res, error }
  }

  async logEvent(event: string, properties: any, meta: any = {}) {
    if (!supabase) return
    // Log to analytics_events
    await supabase.from('analytics_events').insert({
      event_name: event,
      properties,
      user_id: meta.userId,
      session_id: meta.sessionId,
      url: meta.url,
      created_at: new Date().toISOString()
    })
  }

  async getAnalyticsEvents(limit = 2000) {
    if (!supabase) return { data: [], error: 'Supabase not initialized' }
    const { data, error } = await supabase
      .from('analytics_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    return { data: data || [], error }
  }

  async sendFeedback(userId: string | null, content: string, contact?: string) {
    if (!supabase) return false
    const { error } = await supabase.from('feedbacks').insert({
      user_id: userId,
      content,
      contact
    })
    return !error
  }

  async createVent(userId: string | null, userName: string, content: string) {
    if (!supabase) return { ok: false, reason: 'not_initialized' }
    const checked = checkVentContent(content)
    if (!checked.ok) return { ok: false, reason: checked.reason }
    const { error } = await supabase.from('danmaku_messages').insert({
      user_id: userId,
      user_name: userName.trim().slice(0, 24) || 'Guest',
      content: content.trim(),
      emoji: 'vent'
    })
    if (error) return { ok: false, reason: 'db_error' }
    return { ok: true }
  }

  async listVents(limit = 80) {
    if (!supabase) return { data: [], error: 'Supabase not initialized' }
    const { data, error } = await supabase
      .from('danmaku_messages')
      .select('id, content, user_id, user_name, created_at, emoji')
      .eq('emoji', 'vent')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !data) return { data: [], error }
    const vents: VentPost[] = data.map((row: any) => ({
      id: String(row.id),
      content: row.content,
      user_id: row.user_id ? String(row.user_id) : null,
      user_name: String(row.user_name || '') || 'Guest',
      created_at: row.created_at
    }))
    return { data: vents, error: null }
  }

  async getRecentDanmaku() {
    if (!supabase) return { data: [], error: 'Supabase not initialized' }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data, error } = await supabase
      .from('danmaku_messages')
      .select('id, content, emoji, user_id, user_name, created_at')
      .gte('created_at', today.toISOString())
      .or('emoji.is.null,emoji.neq.vent')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error || !data) return { data: [], error }

    const messages = data.reverse().map((row: any) => ({
      id: String(row.id),
      content: row.content,
      emoji: row.emoji,
      user_id: row.user_id,
      user_name: row.user_name,
      created_at: row.created_at
    }))
    
    return { data: messages, error: null }
  }
}

// --- Realtime Adapter ---
export class SupabaseRealtimeAdapter implements RealtimeAdapter {
  isConnected = ref(false)
  onlineCount = ref(0)
  private channel: any = null
  private danmakuCallback: ((msg: DanmakuMessage) => void) | null = null

  async connect() {
    if (!supabase || this.channel) return

    this.channel = supabase.channel('global_danmaku')

    this.channel
      .on('broadcast', { event: 'danmaku' }, (payload: any) => {
        if (this.danmakuCallback && payload.payload) {
          if (payload.payload.emoji === 'vent') return
          this.danmakuCallback(payload.payload)
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'danmaku_messages' }, (payload: any) => {
        if (this.danmakuCallback && payload.new) {
          if (payload.new.emoji === 'vent') return
          // Adapt DB row to message
          const msg = this.mapRowToMessage(payload.new)
          this.danmakuCallback(msg)
        }
      })
      .on('presence', { event: 'sync' }, () => {
        if (!this.channel) return
        const state = this.channel.presenceState()
        this.onlineCount.value = Object.keys(state).length
      })
      .subscribe((status: string) => {
        this.isConnected.value = status === 'SUBSCRIBED'
        if (status === 'SUBSCRIBED' && this.channel) {
          this.channel.track({ online_at: new Date().toISOString() })
        }
      })
  }

  disconnect() {
    if (this.channel && supabase) {
      supabase.removeChannel(this.channel)
      this.channel = null
      this.isConnected.value = false
    }
  }

  async sendDanmaku(message: Omit<DanmakuMessage, 'id' | 'created_at'>) {
    if (!supabase) return false
    // 1. Insert to DB
    const { error } = await supabase
      .from('danmaku_messages')
      .insert({
        content: message.content,
        emoji: message.emoji,
        user_id: message.user_id,
        user_name: message.user_name
      })
      .select()
      .single()

    if (error) return false

    // 2. Broadcast (optional, if using DB changes listener, this might duplicate, but for immediate feedback it's good)
    // Actually, if we listen to Postgres Changes, we don't strictly need broadcast for persistence.
    // But useRealtimeDanmaku currently uses Broadcast for immediate local echo + remote.
    // Let's stick to just DB insert -> Postgres Change will trigger callback.
    // Wait, Supabase Realtime via Postgres Changes is fast.
    
    return true
  }

  subscribeDanmaku(callback: (message: DanmakuMessage) => void) {
    this.danmakuCallback = callback
  }

  private mapRowToMessage(row: any): DanmakuMessage {
    return {
      id: row.id,
      content: row.content,
      emoji: row.emoji,
      user_id: row.user_id,
      user_name: row.user_name,
      created_at: row.created_at
    }
  }
}

// --- Function Adapter ---
export class SupabaseFunctionAdapter implements FunctionAdapter {
  async invoke<T = any>(functionName: string, payload?: any, options?: any) {
    if (!supabase) return { data: null, error: 'Supabase not initialized' }
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload,
      headers: options?.headers
    })
    return { data: data as T, error }
  }
}
