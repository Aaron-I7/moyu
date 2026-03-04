import { ref } from 'vue'

export interface ConsentState {
  essential: true
  analytics: boolean
  personalization: boolean
  social: boolean
  updatedAt: number
}

const consentStorageKey = 'moyu-consent-v1'

const defaultConsent: ConsentState = {
  essential: true,
  analytics: false,
  personalization: false,
  social: false,
  updatedAt: Date.now()
}

const consentState = ref<ConsentState>({ ...defaultConsent })
const consentReady = ref(false)

export function loadConsent(): void {
  try {
    const raw = localStorage.getItem(consentStorageKey)
    if (!raw) {
      consentState.value = { ...defaultConsent }
      consentReady.value = false
      return
    }
    const parsed = JSON.parse(raw) as ConsentState
    consentState.value = {
      essential: true,
      analytics: Boolean(parsed.analytics),
      personalization: Boolean(parsed.personalization),
      social: Boolean(parsed.social),
      updatedAt: parsed.updatedAt || Date.now()
    }
    consentReady.value = true
  } catch {
    consentState.value = { ...defaultConsent }
    consentReady.value = false
  }
}

export function saveConsent(next: Omit<ConsentState, 'essential' | 'updatedAt'>): void {
  consentState.value = {
    essential: true,
    analytics: next.analytics,
    personalization: next.personalization,
    social: next.social,
    updatedAt: Date.now()
  }
  localStorage.setItem(consentStorageKey, JSON.stringify(consentState.value))
  consentReady.value = true
}

export function acceptAllConsent(): void {
  saveConsent({
    analytics: true,
    personalization: true,
    social: true
  })
}

export function rejectOptionalConsent(): void {
  saveConsent({
    analytics: false,
    personalization: false,
    social: false
  })
}

export function useConsentState() {
  return {
    consentState,
    consentReady
  }
}
