import { ref } from 'vue'
import { resolvePortalSession } from './client'
import type {
  ChildPortalSessionResponse,
  ChildPortalStoredSession,
  ChildProfile
} from './types'

const STORAGE_KEY = 'moyu-child-portal-session'
const EXPIRY_BUFFER_MS = 30 * 1000

function readStoredSession(): ChildPortalStoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as ChildPortalStoredSession
    if (!parsed?.webSessionToken || !parsed?.childId) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function persistSession(value: ChildPortalStoredSession | null): void {
  if (!value) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
}

function toStoredSession(
  session: ChildPortalSessionResponse,
  accessToken: string
): ChildPortalStoredSession {
  return {
    clientMode: session.client_mode || 'child_web',
    bindMode: session.bind_mode || 'web_portal',
    childId: session.child_id || session.child_profile?.child_id || '',
    childProfile: session.child_profile || {},
    expiresAt: Number(session.expires_at) || 0,
    familyId: session.family_id || '',
    lastPortalToken: accessToken,
    loginState: session.login_state || 'ready',
    webSessionToken: session.web_session_token || ''
  }
}

function isExpired(session: ChildPortalStoredSession | null): boolean {
  if (!session?.webSessionToken) {
    return true
  }

  if (!session.expiresAt) {
    return false
  }

  return session.expiresAt <= Date.now() + EXPIRY_BUFFER_MS
}

const childPortalSession = ref<ChildPortalStoredSession | null>(readStoredSession())

function setChildPortalSession(session: ChildPortalStoredSession | null): void {
  childPortalSession.value = session
  persistSession(session)
}

export function clearChildPortalSession(): void {
  setChildPortalSession(null)
}

export function updateChildPortalProfile(profile: ChildProfile): void {
  if (!childPortalSession.value) {
    return
  }

  setChildPortalSession({
    ...childPortalSession.value,
    childProfile: {
      ...childPortalSession.value.childProfile,
      ...profile
    }
  })
}

export async function establishChildPortalSession(accessToken: string): Promise<ChildPortalStoredSession> {
  const resolved = await resolvePortalSession(accessToken)
  const nextSession = toStoredSession(resolved, accessToken)
  setChildPortalSession(nextSession)
  return nextSession
}

export async function ensureChildPortalSession(): Promise<ChildPortalStoredSession | null> {
  const current = childPortalSession.value
  if (current && !isExpired(current)) {
    return current
  }

  if (!current?.lastPortalToken) {
    clearChildPortalSession()
    return null
  }

  return establishChildPortalSession(current.lastPortalToken)
}

export function useChildPortalSession() {
  return {
    childPortalSession
  }
}
