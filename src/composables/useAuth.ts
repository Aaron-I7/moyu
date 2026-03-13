import { ref, computed, watch } from 'vue'
import { authAdapter, dbAdapter, provider as dbProvider } from '@/core/adapter'
import { useCloudSync } from './useCloudSync'

const user = authAdapter.user
const profile = ref<{ nickname: string } | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const resolveErrorMessage = (e: any) => {
  if (!e) return '未知错误'
  if (typeof e === 'string') return e
  if (e instanceof Error) return e.message
  if (typeof e?.message === 'string') return e.message
  if (typeof e?.error?.message === 'string') return e.error.message
  if (typeof e?.error_description === 'string') return e.error_description
  return JSON.stringify(e)
}

export function useAuth() {
  const { pullData, clearLocalData } = useCloudSync()

  const isAuthenticated = computed(() => !!user.value)
  const nickname = computed(() => {
    const idSegment = String(user.value?.id || '').slice(0, 4) || 'Guest'
    return profile.value?.nickname || (user.value ? `User_${idSegment}` : 'Guest')
  })

  // Initialize session
  const initAuth = async () => {
    // Watch user changes to fetch profile and sync data
    watch(user, async (newUser) => {
      if (newUser) {
        await fetchProfile()
        await pullData()
      } else {
        profile.value = null
        // Do NOT clear local data automatically on logout unless explicit?
        // Actually original code cleared it on logout.
        // But here, if user becomes null (e.g. init failure), maybe we shouldn't wipe data immediately?
        // Let's keep logic consistent with original: clear on logout action, or if session expires?
        // The original code had explicit clearLocalData() in logout().
        // And `onAuthStateChange` set profile to null.
      }
    }, { immediate: true })
  }

  const fetchProfile = async () => {
    if (!user.value?.id) return
    
    try {
      const { data, error: _err } = await dbAdapter.getProfile(user.value.id)
      
      if (!data) {
        console.log('Profile not found, attempting to create one...')
        const defaultName = `User_${String(user.value.id).slice(0, 4)}`
        
        const { data: newProfile, error: createError } = await dbAdapter.updateProfile(user.value.id, {
          nickname: defaultName,
          settings: {}
        })
          
        if (createError) {
          console.error('Failed to create profile:', createError)
          return
        }
        
        profile.value = newProfile
        return
      }
      profile.value = data
    } catch (e: any) {
      console.error('Error fetching profile:', e)
    }
  }

  const register = async (email?: string, password?: string, username?: string) => {
    loading.value = true
    error.value = null
    
    try {
      const { user: newUser, error: authError } = await authAdapter.register(email, password, username)
      
      if (authError) throw authError
      
      return { user: newUser }
    } catch (e: any) {
      error.value = resolveErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  const sendRegisterOtp = async (email: string, password: string, username?: string) => {
    loading.value = true
    error.value = null
    try {
      const { error: otpError } = await authAdapter.sendRegisterOtp(email, password, username)
      if (otpError) throw otpError
      return true
    } catch (e: any) {
      error.value = resolveErrorMessage(e)
      return false
    } finally {
      loading.value = false
    }
  }

  const registerWithOtp = async (email: string, code: string) => {
    loading.value = true
    error.value = null
    try {
      const { user: newUser, error: otpError } = await authAdapter.registerWithOtp(email, code)
      if (otpError) throw otpError
      return { user: newUser }
    } catch (e: any) {
      error.value = resolveErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  const sendLoginOtp = async (email: string) => {
    loading.value = true
    error.value = null
    try {
      const { error: otpError } = await authAdapter.sendLoginOtp(email)
      if (otpError) throw otpError
      return true
    } catch (e: any) {
      error.value = resolveErrorMessage(e)
      return false
    } finally {
      loading.value = false
    }
  }

  const loginWithOtp = async (email: string, code: string) => {
    loading.value = true
    error.value = null
    try {
      const { user: loggedUser, error: otpError } = await authAdapter.loginWithOtp(email, code)
      if (otpError) throw otpError
      return { user: loggedUser }
    } catch (e: any) {
      error.value = resolveErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  const login = async (email?: string, password?: string) => {
    loading.value = true
    error.value = null
    
    try {
      const { user: loggedUser, error: err } = await authAdapter.login(email, password)
      
      if (err) throw err
      
      // Profile fetch triggered by watch(user)
      
      return { user: loggedUser }
    } catch (e: any) {
      error.value = resolveErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    loading.value = true
    try {
      await authAdapter.logout()
    } catch (e: any) {
      console.error('Logout error:', e)
      error.value = resolveErrorMessage(e)
    } finally {
      profile.value = null
      await clearLocalData()
      loading.value = false
    }
  }

  const updateNickname = async (newNickname: string) => {
    if (!user.value?.id) return false
    loading.value = true
    error.value = null
    try {
      const trimmed = newNickname.trim()
      if (!trimmed) throw new Error('昵称不能为空')
      const { error: dbError } = await dbAdapter.updateProfile(user.value.id, { nickname: trimmed })
      if (dbError) throw dbError
      const { error: authError } = await authAdapter.updateNickname(trimmed)
      if (authError) throw authError
      profile.value = { ...(profile.value || { nickname: trimmed }), nickname: trimmed }
      return true
    } catch (e: any) {
      error.value = resolveErrorMessage(e)
      return false
    } finally {
      loading.value = false
    }
  }

  const startPasswordReset = async () => {
    if (!user.value?.email) return false
    loading.value = true
    error.value = null
    try {
      const { error: resetError } = await authAdapter.startPasswordReset(user.value.email)
      if (resetError) throw resetError
      return true
    } catch (e: any) {
      error.value = resolveErrorMessage(e)
      return false
    } finally {
      loading.value = false
    }
  }

  const confirmPasswordReset = async (code: string, newPassword: string) => {
    if (!user.value?.email) return false
    loading.value = true
    error.value = null
    try {
      const { error: confirmError } = await authAdapter.confirmPasswordReset(user.value.email, code, newPassword)
      if (confirmError) throw confirmError
      return true
    } catch (e: any) {
      error.value = resolveErrorMessage(e)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    profile,
    isAuthenticated,
    nickname,
    loading,
    error,
    initAuth,
    register,
    sendRegisterOtp,
    registerWithOtp,
    login,
    sendLoginOtp,
    loginWithOtp,
    logout,
    updateNickname,
    startPasswordReset,
    confirmPasswordReset,
    capabilities: authAdapter.capabilities,
    provider: dbProvider
  }
}
