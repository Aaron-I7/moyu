import { ref, computed } from 'vue'
import { supabase } from '@/core/supabase/client'
import { useCloudSync } from './useCloudSync'
import type { User } from '@supabase/supabase-js'

const user = ref<User | null>(null)
const profile = ref<{ nickname: string } | null>(null)
const loading = ref(false)
const error = ref(null)

export function useAuth() {
  const { pullData } = useCloudSync()

  const isAuthenticated = computed(() => !!user.value)
  const nickname = computed(() => profile.value?.nickname || user.value?.email?.split('@')[0])

  // Initialize session
  const initAuth = async () => {
    if (!supabase) return

    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      user.value = session.user
      await fetchProfile()
      await pullData() // Sync data on load
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      user.value = session?.user || null
      if (session?.user) {
        await fetchProfile()
        await pullData()
      } else {
        profile.value = null
      }
    })
  }

  const fetchProfile = async () => {
    if (!user.value || !supabase) return
    
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.value.id)
        .single()
      
      if (err) {
        // If profile not found (PGRST116), try to create it
        if (err.code === 'PGRST116') {
          console.log('Profile not found, attempting to create one...')
          const nickname = user.value.user_metadata?.nickname || user.value.email?.split('@')[0] || 'User'
          
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{
              id: user.value.id,
              nickname: nickname,
              settings: {}
            }])
            .select()
            .single()
            
          if (createError) {
            // If creation fails (e.g. nickname taken), just log it
            console.error('Failed to create profile:', createError)
            return
          }
          
          profile.value = newProfile
          return
        }
        throw err
      }
      profile.value = data
    } catch (e: any) {
      console.error('Error fetching profile:', e)
    }
  }

  const register = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    loading.value = true
    error.value = null
    
    try {
      const nicknameInput = email.split('@')[0]

      // 1. Sign up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nickname: nicknameInput
          }
        }
      })
      
      if (authError) throw authError
      
      // If email confirmation is enabled, user might be null or have a fake session
      // But typically we just return here and let UI show "Check email"
      
      return { user: authData.user, session: authData.session }
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  const login = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    loading.value = true
    error.value = null
    
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (err) throw err
      
      user.value = data.user
      await fetchProfile()
      await pullData() // Sync data on login
      
      return { user: data.user }
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    if (!supabase) return
    
    const { clearLocalData } = useCloudSync()
    
    loading.value = true
    try {
      await supabase.auth.signOut()
      user.value = null
      profile.value = null
      
      // Clear local storage data on logout
      clearLocalData()
    } catch (e: any) {
      error.value = e.message
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
    login,
    logout
  }
}
