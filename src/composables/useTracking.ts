import { onMounted, onUnmounted } from 'vue'
import { dbAdapter, authAdapter } from '@/core/adapter'

export function useTracking() {
  const getSessionId = () => {
    let sid = sessionStorage.getItem('moyu_session_id')
    if (!sid) {
      sid = crypto.randomUUID()
      sessionStorage.setItem('moyu_session_id', sid)
    }
    return sid
  }

  const track = async (event: string, properties?: Record<string, any>) => {
    // In development, log to console
    if (import.meta.env.DEV) {
      console.log('📊 [Tracking]', event, properties)
    }

    try {
      const user = authAdapter.user.value
      await dbAdapter.logEvent(event, properties || {}, {
        url: window.location.pathname,
        sessionId: getSessionId(),
        userId: user?.id || null
      })
    } catch (e) {
      if (import.meta.env.DEV) console.error('Failed to send tracking data:', e)
    }
  }

  const identify = (userId: string, traits?: Record<string, any>) => {
    if (import.meta.env.DEV) {
      console.log('👤 [Identify]', userId, traits)
    }
  }

  return {
    track,
    identify
  }
}

const HEARTBEAT_INTERVAL = 60 * 1000 // 1 minute

export function useHeartbeat() {
  const { track } = useTracking()
  let lastActivity = Date.now()
  let timer: ReturnType<typeof setInterval> | null = null
  let isTabVisible = true

  const updateActivity = () => {
    lastActivity = Date.now()
  }

  const sendHeartbeat = () => {
    if (!isTabVisible) return
    
    const now = Date.now()
    const idleTime = now - lastActivity
    
    // Track if user was active recently (e.g. within last 2 minutes)
    const isActive = idleTime < (HEARTBEAT_INTERVAL * 2)
    
    if (isActive) {
       track('heartbeat', { idleTime, timestamp: now })
    }
  }

  const setup = () => {
    window.addEventListener('mousemove', updateActivity)
    window.addEventListener('click', updateActivity)
    window.addEventListener('keydown', updateActivity)
    window.addEventListener('scroll', updateActivity)
    
    document.addEventListener('visibilitychange', () => {
      isTabVisible = document.visibilityState === 'visible'
      if (isTabVisible) {
        updateActivity()
        track('session_resume')
      } else {
        track('session_pause')
      }
    })

    timer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL)
    track('session_start')
  }

  const cleanup = () => {
    if (timer) clearInterval(timer)
    window.removeEventListener('mousemove', updateActivity)
    window.removeEventListener('click', updateActivity)
    window.removeEventListener('keydown', updateActivity)
    window.removeEventListener('scroll', updateActivity)
  }

  onMounted(setup)
  onUnmounted(cleanup)
}
