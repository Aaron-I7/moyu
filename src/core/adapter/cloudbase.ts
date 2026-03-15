import { ref } from 'vue'
import cloudbase from '@cloudbase/js-sdk'
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

const provider = import.meta.env.VITE_DB_PROVIDER || 'supabase'
const envId = import.meta.env.VITE_CLOUDBASE_ENV_ID
const region = import.meta.env.VITE_CLOUDBASE_REGION || 'ap-shanghai'
const accessKey = import.meta.env.VITE_CLOUDBASE_ACCESS_KEY

let app: any = null
let auth: any = null

function ensureCloudbaseClient() {
  if (app && auth) return
  const initOptions: any = {
    region,
    timeout: 60000,
    auth: {
      detectSessionInUrl: true
    }
  }
  if (envId) {
    initOptions.env = envId
  }
  if (accessKey) {
    initOptions.accessKey = accessKey
  }
  app = cloudbase.init(initOptions)
  auth = app.auth({ persistence: 'local' })
}

if (provider === 'cloudbase' && !envId) {
  console.warn('VITE_CLOUDBASE_ENV_ID is not set')
}

// --- Auth Adapter ---
export class CloudBaseAuthAdapter implements AuthAdapter {
  provider = 'cloudbase' as const
  capabilities = { email: true, anonymous: true, otp: true }
  user = ref<UnifiedUser | null>(null)
  private otpVerifierMap = new Map<string, (params: { token: string; messageId?: string }) => Promise<any>>()
  private registerOtpVerifierMap = new Map<string, (params: { token: string; messageId?: string }) => Promise<any>>()
  private resetPasswordUpdaterMap = new Map<string, (params: { nonce: string; password: string }) => Promise<any>>()

  constructor() {
    ensureCloudbaseClient()
  }

  async init() {
    const loginState = await auth.getLoginState()
    if (loginState) {
      this.updateUser(loginState.user)
    } else {
      this.user.value = null
    }

    auth.onLoginStateChanged((loginState: any) => {
      this.updateUser(loginState?.user)
    })
  }

  private updateUser(cbUser: any) {
    if (!cbUser) {
      this.user.value = null
      return
    }
    const resolvedId = String(
      cbUser.uid ||
      cbUser.id ||
      cbUser.openid ||
      cbUser._openid ||
      cbUser.uuid ||
      cbUser.userId ||
      ''
    )
    if (!resolvedId) {
      this.user.value = null
      return
    }
    this.user.value = {
      id: resolvedId,
      email: cbUser.email,
      isAnonymous: !cbUser.email,
      provider: 'cloudbase'
    }
  }

  async login(email?: string, password?: string) {
    try {
      const authAny = auth as any
      if (email && password) {
        if (typeof authAny.signInWithPassword !== 'function') {
          return { user: null, error: new Error('CloudBase SDK 不支持邮箱登录，请升级依赖版本') }
        }
        let res = await authAny.signInWithPassword({ email, password })
        if (res?.error) {
          res = await authAny.signInWithPassword({ username: email, password })
        }
        if (res?.error) {
          return { user: null, error: this.normalizeAuthError(res.error, 'login', email) }
        }
      } else {
        const authAnyForAnonymous = auth as any
        if (typeof authAnyForAnonymous.signInAnonymously === 'function') {
          const anonymousRes = await authAnyForAnonymous.signInAnonymously()
          if (anonymousRes?.error) {
            return { user: null, error: this.normalizeAuthError(anonymousRes.error, 'login') }
          }
        } else {
          await auth.anonymousAuthProvider().signIn()
        }
      }
      const state = await auth.getLoginState()
      this.updateUser(state?.user)
      return { user: this.user.value, error: null }
    } catch (error) {
      console.error('CloudBase login failed', error)
      return { user: null, error }
    }
  }

  async sendLoginOtp(email: string) {
    return this.beginSmartAuth(email)
  }

  async loginWithOtp(email: string, code: string) {
    return this.verifySmartAuth(email, code)
  }

  async register(email?: string, password?: string, username?: string) {
    try {
      const authAny = auth as any
      if (email && password) {
        if (typeof authAny.signUp !== 'function') {
          return { user: null, error: new Error('CloudBase SDK 不支持邮箱注册，请升级依赖版本') }
        }
        const finalUsername = username || email.split('@')[0]
        const signUpRes = await authAny.signUp({ username: finalUsername, email, password })
        if (signUpRes?.error) {
          return { user: null, error: this.normalizeAuthError(signUpRes.error, 'register', email) }
        }
        if (typeof signUpRes?.data?.verifyOtp === 'function') {
          this.registerOtpVerifierMap.set(email, signUpRes.data.verifyOtp)
          return { user: null, error: new Error('当前注册策略需要验证码，请切换到验证码注册并完成验证') }
        }
        return await this.login(email, password)
      }
      await auth.anonymousAuthProvider().signIn()
      const state = await auth.getLoginState()
      this.updateUser(state?.user)
      return { user: this.user.value, error: null }
    } catch (error) {
      return { user: null, error: this.normalizeAuthError(error, 'register', email) }
    }
  }

  async sendRegisterOtp(email: string, password: string, username?: string) {
    try {
      const authAny = auth as any
      if (typeof authAny.signUp !== 'function') {
        return { error: new Error('CloudBase SDK 不支持邮箱注册，请升级依赖版本') }
      }
      const finalUsername = username || email.split('@')[0]
      const signUpRes = await authAny.signUp({ username: finalUsername, email, password })
      if (signUpRes?.error) {
        return { error: this.normalizeAuthError(signUpRes.error, 'register', email) }
      }
      if (typeof signUpRes?.data?.verifyOtp === 'function') {
        this.registerOtpVerifierMap.set(email, signUpRes.data.verifyOtp)
        return { error: null }
      }
      return { error: new Error('当前 CloudBase 注册策略未返回验证码校验器，请检查身份认证配置') }
    } catch (error) {
      return { error: this.normalizeAuthError(error, 'register', email) }
    }
  }

  async registerWithOtp(email: string, code: string) {
    try {
      const verifyOtp = this.registerOtpVerifierMap.get(email)
      if (!verifyOtp) {
        return { user: null, error: new Error('注册验证码会话不存在，请先获取验证码') }
      }
      const verifyRes = await verifyOtp({ token: code })
      if (verifyRes?.error) {
        return { user: null, error: this.normalizeAuthError(verifyRes.error, 'register', email) }
      }
      this.registerOtpVerifierMap.delete(email)
      const state = await auth.getLoginState()
      this.updateUser(state?.user)
      return { user: this.user.value, error: null }
    } catch (error) {
      return { user: null, error: this.normalizeAuthError(error, 'register', email) }
    }
  }

  async beginSmartAuth(email: string, password?: string) {
    try {
      const authAny = auth as any
      if (typeof authAny.signUp !== 'function') {
        return { error: new Error('CloudBase SDK 不支持智能验证码登录，请升级依赖版本') }
      }
      const signUpRes = await authAny.signUp({ email, password })
      if (signUpRes?.error) {
        return { error: this.normalizeAuthError(signUpRes.error, 'login', email) }
      }
      if (typeof signUpRes?.data?.verifyOtp === 'function') {
        this.otpVerifierMap.set(email, signUpRes.data.verifyOtp)
        return { error: null }
      }
      const state = await auth.getLoginState()
      this.updateUser(state?.user)
      return { error: null }
    } catch (error) {
      return { error: this.normalizeAuthError(error, 'login', email) }
    }
  }

  async verifySmartAuth(email: string, code: string) {
    try {
      const verifyOtp = this.otpVerifierMap.get(email)
      if (!verifyOtp) {
        return { user: null, error: new Error('验证码会话不存在，请先获取验证码') }
      }
      const verifyRes = await verifyOtp({ token: code })
      if (verifyRes?.error) {
        return { user: null, error: this.normalizeAuthError(verifyRes.error, 'login', email) }
      }
      this.otpVerifierMap.delete(email)
      const state = await auth.getLoginState()
      this.updateUser(state?.user)
      return { user: this.user.value, error: null }
    } catch (error) {
      return { user: null, error: this.normalizeAuthError(error, 'login', email) }
    }
  }

  async updateNickname(nickname: string) {
    try {
      const authAny = auth as any
      if (typeof authAny.updateUser !== 'function') {
        return { error: null }
      }
      const res = await authAny.updateUser({ nickname })
      if (res?.error) {
        return { error: this.normalizeAuthError(res.error, 'register') }
      }
      return { error: null }
    } catch (error) {
      return { error: this.normalizeAuthError(error, 'register') }
    }
  }

  async startPasswordReset(email: string) {
    try {
      const authAny = auth as any
      if (typeof authAny.resetPasswordForEmail !== 'function') {
        return { error: new Error('CloudBase SDK 不支持密码重置，请升级依赖版本') }
      }
      const res = await authAny.resetPasswordForEmail(email)
      if (res?.error) {
        return { error: this.normalizeAuthError(res.error, 'login', email) }
      }
      const updater = res?.data?.updateUser
      if (typeof updater !== 'function') {
        return { error: new Error('CloudBase 未返回密码重置校验器，请检查身份认证配置') }
      }
      this.resetPasswordUpdaterMap.set(email, updater)
      return { error: null }
    } catch (error) {
      return { error: this.normalizeAuthError(error, 'login', email) }
    }
  }

  async confirmPasswordReset(email: string, code: string, newPassword: string) {
    try {
      const updater = this.resetPasswordUpdaterMap.get(email)
      if (!updater) {
        return { error: new Error('密码重置会话不存在，请先发送重置验证码') }
      }
      const res = await updater({
        nonce: code,
        password: newPassword
      })
      if (res?.error) {
        return { error: this.normalizeAuthError(res.error, 'login', email) }
      }
      this.resetPasswordUpdaterMap.delete(email)
      return { error: null }
    } catch (error) {
      return { error: this.normalizeAuthError(error, 'login', email) }
    }
  }

  private normalizeAuthError(error: any, phase: 'login' | 'register', identifier?: string) {
    const message = String(error?.message || '')
    const status = String(error?.status || '')

    if (phase === 'register' && message.includes('You must provide either an email or phone number')) {
      return new Error('CloudBase 注册接口要求邮箱或手机号。若你要“用户名+密码无验证码注册”，建议改为服务端创建用户方案。')
    }
    if (phase === 'register' && (message.includes('provider email not found') || status === 'not_found')) {
      return new Error('当前 CloudBase 环境未开启邮箱登录/注册，请在控制台「环境 -> 登录授权」启用邮箱登录后重试')
    }
    if (phase === 'login' && (status === 'invalid_username_or_password' || message.includes('用户名或密码不正确'))) {
      return new Error(`账号或密码错误，请检查后重试${identifier ? `（当前输入：${identifier}）` : ''}`)
    }
    if (phase === 'login' && (message.includes('user not found') || status === 'not_found')) {
      return new Error('账号不存在，请先注册或使用验证码智能登录')
    }
    if (message.includes('invalid_argument') || message.includes('验证码不正确') || message.includes('已过期')) {
      return new Error('验证码错误或已过期，请重新获取验证码')
    }
    return error instanceof Error ? error : new Error(message || '认证失败')
  }

  async logout() {
    try {
      await Promise.race([
        auth.signOut(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Logout timeout')), 2000))
      ])
    } catch (error) {
      console.error('CloudBase logout error:', error)
    } finally {
      this.user.value = null
    }
  }

  onAuthStateChange(_callback: (user: UnifiedUser | null) => void) {
    // Handled internally via onLoginStateChanged updating this.user
  }
}

// --- Database Adapter ---
export class CloudBaseDatabaseAdapter implements DatabaseAdapter {
  constructor() {
    ensureCloudbaseClient()
  }

  async getProfile(userId: string) {
    try {
      // @ts-ignore
      const { data } = await app.models.profiles.get({
        filter: {
          where: {
            _openid: { $eq: userId }
          }
        }
      })
      return { data: data || null, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async updateProfile(userId: string, data: any) {
    try {
      const record = { ...data, _openid: userId }
      // @ts-ignore
      const { data: res } = await app.models.profiles.upsert({
        create: record,
        update: record,
        filter: {
          where: {
            _openid: { $eq: userId }
          }
        }
      })
      return { data: res, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async getGameData(userId: string, moduleKey: string) {
    try {
      // @ts-ignore
      const { data } = await app.models.user_game_data.list({
        filter: {
          where: {
            _openid: { $eq: userId },
            module_key: { $eq: moduleKey }
          }
        }
      })
      if (data && data.records && data.records.length > 0) {
        return { data: JSON.parse(data.records[0].data), error: null }
      }
      return { data: null, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async getAllGameData(userId: string) {
    try {
      // @ts-ignore
      const { data } = await app.models.user_game_data.list({
        filter: {
          where: {
            _openid: { $eq: userId }
          }
        }
      })
      return { 
        data: (data?.records || []).map((r: any) => ({
          module_key: r.module_key,
          data: JSON.parse(r.data)
        })), 
        error: null 
      }
    } catch (error) {
      return { data: [], error }
    }
  }

  async syncGameData(userId: string, moduleKey: string, data: any) {
    try {
      const payload = {
        _openid: userId, // Mapping userId to _openid
        user_id: userId,
        module_key: moduleKey,
        data: JSON.stringify(data),
        synced_at: new Date().toISOString()
      }

      // @ts-ignore
      const { data: res } = await app.models.user_game_data.upsert({
        create: payload,
        update: payload,
        filter: {
          where: {
            _openid: { $eq: userId },
            module_key: { $eq: moduleKey }
          }
        }
      })
      return { data: payload, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async logEvent(event: string, properties: any, meta: any = {}) {
    try {
      // @ts-ignore
      await app.models.analytics_events.create({
        data: {
          event_name: event,
          properties: JSON.stringify(properties),
          user_id: meta.userId,
          session_id: meta.sessionId,
          url: meta.url,
          _openid: meta.userId // Assuming userId is available
        }
      })
    } catch (e) {
      console.error('Failed to log event to CloudBase', e)
    }
  }

  async getAnalyticsEvents(limit = 2000) {
    try {
      // @ts-ignore
      const { data } = await app.models.analytics_events.list({
        filter: { where: {} },
        orderBy: [{ created_at: 'desc' }],
        pageSize: limit
      })
      
      const events = (data?.records || []).map((r: any) => ({
        ...r,
        properties: r.properties ? JSON.parse(r.properties) : {}
      }))
      
      return { data: events, error: null }
    } catch (error) {
      return { data: [], error }
    }
  }

  async sendFeedback(userId: string | null, content: string, contact?: string) {
    try {
      // @ts-ignore
      await app.models.feedbacks.create({
        data: {
          user_id: userId,
          content,
          contact,
          _openid: userId
        }
      })
      return true
    } catch (e) {
      return false
    }
  }

  async createVent(userId: string | null, userName: string, content: string) {
    const checked = checkVentContent(content)
    if (!checked.ok) return { ok: false, reason: checked.reason }
    const danmakuModel = app.models.danmaku_messages
    if (!danmakuModel) return { ok: false, reason: 'db_error' }
    try {
      await danmakuModel.create({
        data: {
          user_id: userId,
          user_name: userName.trim().slice(0, 24) || 'Guest',
          content: content.trim(),
          emoji: 'vent',
          _openid: userId
        }
      })
      return { ok: true }
    } catch {
      return { ok: false, reason: 'db_error' }
    }
  }

  async listVents(limit = 80) {
    const danmakuModel = app.models.danmaku_messages
    if (!danmakuModel) return { data: [], error: 'danmaku model unavailable' }
    try {
      const { data } = await danmakuModel.list({
        filter: { where: { emoji: { $eq: 'vent' } } },
        orderBy: [{ created_at: 'desc' }],
        pageSize: limit
      })
      const vents: VentPost[] = (data?.records || []).map((row: any) => ({
        id: String(row.id || row._id),
        content: row.content,
        user_id: row.user_id || null,
        user_name: String(row.user_name || '') || 'Guest',
        created_at: row.created_at
      }))
      return { data: vents, error: null }
    } catch (error) {
      return { data: [], error }
    }
  }

  async getRecentDanmaku() {
    // Danmaku on NoSQL for Realtime compatibility
    // BUT user asked for Relational.
    // CloudBase Data Model creates a table in MySQL, but we can access it via app.models
    // Realtime Watch on Data Model is NOT supported in JS SDK yet (only TCB DB).
    // So we MUST use NoSQL collection for realtime.
    // However, the user said "弹幕还是存储到了文档型数据库".
    // This implies they WANT it in Relational (MySQL) via Data Model.
    // If we switch to Data Model for storage, we lose realtime watch on client side easily.
    // But we can poll or just accept NoSQL for now?
    // User complaint: "弹幕还是存储到了文档型数据库" -> They checked console/db and saw it in MongoDB (Doc).
    // They want it in MySQL (Data Model).
    
    // To support Data Model AND Realtime:
    // 1. Write to Data Model (MySQL).
    // 2. Read from Data Model (MySQL).
    // 3. For Realtime: TCB Data Model does not support client-side watch.
    // We would need to poll or use a different mechanism.
    // OR, we can double-write? No, that's bad.
    // OR, we can just use Data Model and sacrifice realtime? No, realtime is key feature.
    
    // Compromise: Write to Data Model (as requested).
    // For Realtime Watch: Since we can't watch Data Model, we might need to rely on
    // polling or just keep using NoSQL for this specific feature and explain to user?
    // User specifically listed it as an issue "2、弹幕还是存储到了文档型数据库".
    // So I MUST switch storage to Data Model.
    
    try {
      // @ts-ignore
      const { data } = await app.models.danmaku_messages.list({
        filter: {
          where: {
            // Get recent
            created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
          }
        },
        orderBy: [{ created_at: 'desc' }],
        pageSize: 50
      })

      const messages = (data?.records || []).reverse().map((row: any) => ({
        id: row.id || row._id,
        content: row.content,
        emoji: row.emoji,
        user_id: row.user_id,
        user_name: row.user_name,
        created_at: row.created_at,
        textColor: row.textColor,
        backgroundColor: row.backgroundColor
      }))

      return { data: messages, error: null }
    } catch (error) {
      return { data: [], error }
    }
  }
}

// --- Realtime Adapter ---
export class CloudBaseRealtimeAdapter implements RealtimeAdapter {
  isConnected = ref(false)
  onlineCount = ref(0)
  private timer: any = null
  private danmakuCallback: ((msg: DanmakuMessage) => void) | null = null

  constructor() {
    ensureCloudbaseClient()
  }

  async connect() {
    if (this.timer) return
    this.isConnected.value = true
    
    // Polling interval 3s
    this.timer = setInterval(async () => {
      await this.pollNewMessages()
    }, 3000)
  }

  async pollNewMessages() {
    if (!this.danmakuCallback) return
    try {
      // 每次获取最新的 30 条弹幕，依赖前端 useRealtimeDanmaku 内部的根据 id 和内容去重机制
      // 这样可以避免各客户端本地时间不一致导致的 created_at 游标失效问题
      // @ts-ignore
      const { data } = await app.models.danmaku_messages.list({
        filter: { where: {} },
        orderBy: [{ created_at: 'desc' }],
        pageSize: 30
      })

      if (data && data.records && data.records.length > 0) {
        // 倒序恢复为时间正序
        const records = [...data.records].reverse()
        records.forEach((row: any) => {
           const msg = this.mapRowToMessage(row)
           if (this.danmakuCallback) {
             this.danmakuCallback(msg)
           }
        })
      }
    } catch (e) {
      console.error('Polling error', e)
    }
  }

  disconnect() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
      this.isConnected.value = false
    }
  }

  async sendDanmaku(message: Omit<DanmakuMessage, 'id' | 'created_at'>) {
    try {
       // @ts-ignore
       await app.models.danmaku_messages.create({
         data: {
           ...message,
           created_at: new Date().toISOString(),
           _openid: message.user_id 
         }
       })
       return true
    } catch (e) {
      return false
    }
  }

  subscribeDanmaku(callback: (message: DanmakuMessage) => void) {
    this.danmakuCallback = callback
  }

  private mapRowToMessage(row: any): DanmakuMessage {
    return {
      id: row.id || row._id,
      content: row.content,
      emoji: row.emoji,
      user_id: row.user_id,
      user_name: row.user_name,
      created_at: row.created_at,
      textColor: row.textColor,
      backgroundColor: row.backgroundColor
    }
  }
}

// --- Function Adapter ---
export class CloudBaseFunctionAdapter implements FunctionAdapter {
  constructor() {
    ensureCloudbaseClient()
  }

  async invoke<T = any>(functionName: string, payload?: any, _options?: any) {
    try {
      const state = await auth.getLoginState()
      if (!state) {
        return { data: null, error: new Error('请先登录后再调用 AI 功能') }
      }
      const res = await app.callFunction(
        {
          name: functionName,
          data: payload
        },
        undefined,
        { timeout: 60000 }
      )
      return { data: res.result as T, error: null }
    } catch (error) {
      const message = String((error as any)?.message || '')
      if (message.includes('PERMISSION_DENIED') || message.includes('Permission denied')) {
        return { data: null, error: new Error('云函数无调用权限：请在 CloudBase 控制台为 ai-divination 配置 invoke 规则（true 或 auth != null），并确认环境已开启对应登录方式') }
      }
      if (message.includes('INVALID_PARAM') || message.includes('Invalid request param')) {
        return { data: null, error: new Error('CloudBase 请求参数无效。请勿直接请求 tcb-api 的 /web 基础地址，需通过 SDK 的 callFunction 调用 ai-divination，并检查 VITE_CLOUDBASE_ENV_ID、VITE_CLOUDBASE_REGION、VITE_CLOUDBASE_ACCESS_KEY 配置') }
      }
      return { data: null, error }
    }
  }
}
