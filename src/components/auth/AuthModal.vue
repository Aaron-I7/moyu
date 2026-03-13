<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useAuth } from '@/composables/useAuth'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { t } = useI18n({ useScope: 'global' })
const { login, register, sendLoginOtp, loginWithOtp, sendRegisterOtp, registerWithOtp, loading, error: authError, capabilities } = useAuth()

const mode = ref<'login' | 'register'>('login')
const authMethod = ref<'password' | 'otp'>('password')
const username = ref('')
const email = ref('')
const password = ref('')
const otpCode = ref('')
const otpSent = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const isEmailSupported = computed(() => capabilities.email)
const isAnonymousSupported = computed(() => capabilities.anonymous)
const isOtpSupported = computed(() => capabilities.otp)
const accountLabel = computed(() => t('auth.email'))
const accountPlaceholder = computed(() => t('auth.emailPlaceholder'))
const accountType = computed(() => 'email')

const toggleMode = () => {
  mode.value = mode.value === 'login' ? 'register' : 'login'
  authMethod.value = 'password'
  username.value = ''
  otpSent.value = false
  otpCode.value = ''
  error.value = null
  authError.value = null
  successMessage.value = null
}

const switchAuthMethod = (method: 'password' | 'otp') => {
  authMethod.value = method
  otpSent.value = false
  otpCode.value = ''
  error.value = null
  authError.value = null
}

const handleSubmit = async () => {
  if (isEmailSupported.value && !email.value) {
    error.value = t('auth.fillAll', 'Please fill in all fields')
    return
  }
  if (mode.value === 'login' && authMethod.value === 'password' && !password.value) {
    error.value = t('auth.fillAll', 'Please fill in all fields')
    return
  }
  if ((mode.value === 'login' || mode.value === 'register') && authMethod.value === 'otp' && !otpCode.value) {
    error.value = t('auth.enterOtpCode')
    return
  }
  if (mode.value === 'register' && !password.value) {
    error.value = t('auth.fillAll', 'Please fill in all fields')
    return
  }
  if (mode.value === 'register' && !username.value) {
    error.value = t('auth.fillAll', 'Please fill in all fields')
    return
  }
  
  error.value = null
  successMessage.value = null
  
  try {
    if (!isEmailSupported.value) {
      // Anonymous Login
      await login()
      emit('close')
      return
    }

    if (mode.value === 'login' && authMethod.value === 'password') {
      await login(email.value, password.value)
      emit('close')
    } else if (mode.value === 'login' && authMethod.value === 'otp') {
      await loginWithOtp(email.value, otpCode.value)
      emit('close')
    } else if (mode.value === 'register' && authMethod.value === 'password') {
      const result = await register(email.value, password.value, username.value)
      // If no error thrown (handled by catch), check if user is fully logged in
      // If user is null or still anonymous, it means email confirmation is required
      if (!result.user || result.user.isAnonymous) {
        successMessage.value = t('auth.checkEmail', 'Registration successful! Please check your email to confirm your account.')
      } else {
        emit('close')
      }
    } else {
      await registerWithOtp(email.value, otpCode.value)
      emit('close')
    }
  } catch (e: any) {
    // Error is already handled in composable but we can show specific UI feedback here if needed
    console.error(e)
  }
}

const handleSendOtp = async () => {
  if (!email.value) {
    error.value = t('auth.fillAll', 'Please fill in all fields')
    return
  }
  error.value = null
  successMessage.value = null
  const ok = await sendLoginOtp(email.value)
  if (ok) {
    otpSent.value = true
  }
}

const handleSendRegisterOtp = async () => {
  if (!email.value || !password.value || !username.value) {
    error.value = t('auth.fillAll', 'Please fill in all fields')
    return
  }
  error.value = null
  successMessage.value = null
  const ok = await sendRegisterOtp(email.value, password.value, username.value)
  if (ok) {
    otpSent.value = true
  }
}

const handleGuestLogin = async () => {
  error.value = null
  successMessage.value = null
  try {
    await login()
    emit('close')
  } catch (e: any) {
    console.error(e)
  }
}

const title = computed(() => {
  if (!isEmailSupported.value) return t('auth.guestLogin')
  return mode.value === 'login' ? t('auth.login', 'Welcome Back') : t('auth.createAccount', 'Join Moyu')
})

const submitText = computed(() => {
  if (!isEmailSupported.value) return t('auth.enterAsGuest')
  if (mode.value === 'login' && authMethod.value === 'otp') return t('auth.verifyAndLogin')
  if (mode.value === 'register' && authMethod.value === 'otp') return t('auth.verifyAndRegister')
  return mode.value === 'login' ? t('auth.login', 'Login') : t('auth.createAccount', 'Create Account')
})

</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="modal-overlay" @click="emit('close')">
        <div class="modal-container" @click.stop>
          <button class="close-btn" @click="emit('close')">
            <Icon icon="mdi:close" width="20" />
          </button>
          
          <div class="modal-header">
            <div class="icon-wrapper">
              <Icon :icon="isEmailSupported ? (mode === 'login' ? 'mdi:login-variant' : 'mdi:account-plus') : 'mdi:account-outline'" width="28" />
            </div>
            <h3>{{ title }}</h3>
          </div>
          
          <div v-if="successMessage && mode === 'register'" class="success-content">
            <div class="icon-wrapper success">
              <Icon icon="mdi:email-check" width="48" />
            </div>
            <h3>{{ t('auth.checkEmailTitle', 'Check your email') }}</h3>
            <p>{{ successMessage }}</p>
            <button @click="emit('close')" class="submit-btn">{{ t('common.close', 'Close') }}</button>
          </div>
          
          <form v-else @submit.prevent="handleSubmit" class="auth-form">
            <template v-if="isEmailSupported">
              <div v-if="isOtpSupported" class="method-switch">
                <button
                  type="button"
                  class="method-btn"
                  :class="{ active: authMethod === 'password' }"
                  :disabled="loading"
                  @click="switchAuthMethod('password')"
                >
                  {{ t('auth.passwordLogin') }}
                </button>
                <button
                  type="button"
                  class="method-btn"
                  :class="{ active: authMethod === 'otp' }"
                  :disabled="loading"
                  @click="switchAuthMethod('otp')"
                >
                  {{ t('auth.otpLogin') }}
                </button>
              </div>

              <div v-if="mode === 'register'" class="form-group">
                <label>{{ t('auth.username') }}</label>
                <div class="input-wrapper" :class="{ 'has-error': error }">
                  <Icon icon="mdi:account-outline" class="input-icon" />
                  <input
                    v-model="username"
                    type="text"
                    :placeholder="t('auth.usernamePlaceholder')"
                    required
                    :disabled="loading"
                    autocomplete="username"
                  />
                </div>
              </div>

              <div class="form-group">
                <label>{{ accountLabel }}</label>
                <div class="input-wrapper" :class="{ 'has-error': error }">
                  <Icon icon="mdi:email" class="input-icon" />
                  <input 
                    v-model="email" 
                    :type="accountType" 
                    :placeholder="accountPlaceholder"
                    required
                    :disabled="loading"
                    autofocus
                    autocomplete="username"
                  />
                </div>
              </div>
              
              <div v-if="mode === 'register' || authMethod === 'password'" class="form-group">
                <label>{{ t('auth.password', 'Password') }}</label>
                <div class="input-wrapper" :class="{ 'has-error': error }">
                  <Icon icon="mdi:lock" class="input-icon" />
                  <input 
                    v-model="password" 
                    type="password" 
                    :placeholder="t('auth.passwordPlaceholder', 'Enter your password')"
                    required
                    :disabled="loading"
                    autocomplete="current-password"
                  />
                </div>
              </div>

              <template v-if="authMethod === 'otp'">
                <div class="form-group">
                  <label>{{ t('auth.otpCode') }}</label>
                  <div class="otp-row">
                    <div class="input-wrapper" :class="{ 'has-error': error }">
                      <Icon icon="mdi:shield-key-outline" class="input-icon" />
                      <input
                        v-model="otpCode"
                        type="text"
                        maxlength="8"
                        :placeholder="t('auth.otpPlaceholder')"
                        :disabled="loading"
                        autocomplete="one-time-code"
                      />
                    </div>
                    <button type="button" class="otp-btn" :disabled="loading" @click="mode === 'login' ? handleSendOtp() : handleSendRegisterOtp()">
                      {{ otpSent ? t('auth.resendOtp') : t('auth.sendOtp') }}
                    </button>
                  </div>
                  <p v-if="otpSent" class="otp-tip">{{ mode === 'login' ? t('auth.otpSent') : t('auth.registerOtpSent') }}</p>
                </div>
              </template>
            </template>
            
            <div v-if="error || authError" class="error-banner">
              <Icon icon="mdi:alert-circle-outline" width="16" />
              <span>{{ error || authError }}</span>
            </div>
            
            <button type="submit" class="submit-btn" :disabled="loading">
              <span v-if="!loading">{{ submitText }}</span>
              <Icon v-else icon="mdi:loading" class="spin" />
            </button>

            <template v-if="isAnonymousSupported && isEmailSupported">
              <div class="or-divider">
                <span>{{ t('auth.or') }}</span>
              </div>
              <button type="button" class="ghost-btn" :disabled="loading" @click="handleGuestLogin">
                <Icon icon="mdi:account-outline" width="16" />
                <span>{{ t('auth.enterAsGuest') }}</span>
              </button>
            </template>
          </form>
          
          <div class="modal-footer" v-if="isEmailSupported">
            <p class="switch-text">
              {{ mode === 'login' ? t('auth.noAccount', 'New here?') : t('auth.hasAccount', 'Already have an account?') }}
              <button class="switch-btn" @click="toggleMode" :disabled="loading">
                {{ mode === 'login' ? t('auth.createAccount', 'Create an account') : t('auth.login', 'Login') }}
              </button>
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-container {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 24px;
  padding: 40px;
  width: 100%;
  max-width: 380px;
  position: relative;
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  transform-origin: center center;
  animation: modal-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--color-background);
    color: var(--color-text);
    transform: rotate(90deg);
  }
}

.modal-header {
  text-align: center;
  margin-bottom: 32px;
  
  .icon-wrapper {
    width: 56px;
    height: 56px;
    margin: 0 auto 16px;
    background: color-mix(in srgb, var(--color-primary) 10%, transparent);
    color: var(--color-primary);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
  }
  
  h3 {
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 8px;
    color: var(--color-text);
    letter-spacing: -0.02em;
  }
  
  .subtitle {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 14px;
    line-height: 1.5;
  }

  .provider-tip {
    margin-top: 8px;
    font-size: 12px;
  }
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.method-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.method-btn {
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text-secondary);
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  &.active {
    border-color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 12%, transparent);
    color: var(--color-primary);
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  label {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text);
    margin-left: 4px;
  }
}

.input-wrapper {
  position: relative;
  transition: transform 0.2s ease;
  
  &:focus-within {
    transform: translateY(-1px);
  }
  
  .input-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-secondary);
    font-size: 18px;
    pointer-events: none;
    transition: color 0.2s;
  }
  
  input {
    width: 100%;
    padding: 14px 14px 14px 44px;
    border-radius: 14px;
    border: 2px solid transparent;
    background: var(--color-background);
    color: var(--color-text);
    font-size: 15px;
    font-weight: 500;
    transition: all 0.2s ease;
    
    &::placeholder {
      color: color-mix(in srgb, var(--color-text-secondary) 70%, transparent);
    }
    
    &:focus {
      background: var(--color-surface);
      border-color: var(--color-primary);
      outline: none;
      box-shadow: 0 4px 12px color-mix(in srgb, var(--color-primary) 15%, transparent);
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
  
  &:focus-within .input-icon {
    color: var(--color-primary);
  }
  
  &.has-error input {
    border-color: var(--color-error);
    background: color-mix(in srgb, var(--color-error) 5%, transparent);
    
    &:focus {
      box-shadow: 0 4px 12px color-mix(in srgb, var(--color-error) 15%, transparent);
    }
  }
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--color-error) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-error) 20%, transparent);
  color: var(--color-error);
  font-size: 13px;
  font-weight: 500;
  animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
}

.submit-btn {
  margin-top: 8px;
  padding: 14px;
  border-radius: 14px;
  background: var(--color-primary);
  color: white;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px color-mix(in srgb, var(--color-primary) 40%, transparent);
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px color-mix(in srgb, var(--color-primary) 50%, transparent);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    box-shadow: none;
  }
}

.or-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
  color: var(--color-text-secondary);
  font-size: 12px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--color-border);
  }
}

.ghost-btn {
  padding: 12px;
  border-radius: 14px;
  background: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-border);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover:not(:disabled) {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.otp-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
}

.otp-btn {
  height: 48px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-primary);
  padding: 0 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    border-color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.otp-tip {
  margin: 6px 2px 0;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.modal-footer {
  margin-top: 24px;
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
  
  .switch-text {
    font-size: 14px;
    color: var(--color-text-secondary);
    margin: 0;
  }
}

.switch-btn {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
  
  &:hover:not(:disabled) {
    background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  }
  
  &:disabled {
    opacity: 0.5;
  }
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes modal-pop {
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}

/* Vue Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
  
  .modal-container {
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  
  .modal-container {
    transform: scale(0.95) translateY(10px);
  }
}

.success-content {
  text-align: center;
  padding: 20px 0;
  
  .icon-wrapper {
    margin: 0 auto 24px;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: color-mix(in srgb, #4ade80 10%, transparent);
    color: #4ade80;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  h3 {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 12px;
  }
  
  p {
    color: var(--color-text-secondary);
    line-height: 1.6;
    margin-bottom: 24px;
  }
}
</style>
