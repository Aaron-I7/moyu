<script setup lang="ts">
import { ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { t } = useI18n({ useScope: 'global' })
const { user, profile, nickname, provider, loading, error, updateNickname, startPasswordReset, confirmPasswordReset } = useAuth()

const nicknameInput = ref('')
const resetCode = ref('')
const newPassword = ref('')
const localMessage = ref<string | null>(null)

watch(
  () => props.show,
  (visible) => {
    if (!visible) return
    nicknameInput.value = profile.value?.nickname || nickname.value || ''
    resetCode.value = ''
    newPassword.value = ''
    localMessage.value = null
  },
  { immediate: true }
)

const handleSaveNickname = async () => {
  localMessage.value = null
  const ok = await updateNickname(nicknameInput.value)
  if (ok) {
    localMessage.value = t('profile.nicknameSaved')
  }
}

const handleSendReset = async () => {
  localMessage.value = null
  const ok = await startPasswordReset()
  if (ok) {
    localMessage.value = provider === 'cloudbase' ? t('profile.resetCodeSent') : t('profile.resetLinkSent')
  }
}

const handleConfirmReset = async () => {
  localMessage.value = null
  if (!resetCode.value || !newPassword.value) {
    localMessage.value = t('profile.fillResetFields')
    return
  }
  const ok = await confirmPasswordReset(resetCode.value, newPassword.value)
  if (ok) {
    localMessage.value = t('profile.resetDone')
    resetCode.value = ''
    newPassword.value = ''
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="modal-overlay" @click="emit('close')">
        <div class="modal-container" @click.stop>
          <button class="close-btn" @click="emit('close')">
            <Icon icon="mdi:close" width="18" />
          </button>

          <div class="modal-header">
            <div class="icon-wrapper">
              <Icon icon="mdi:account-cog-outline" width="24" />
            </div>
            <h3>{{ t('profile.title') }}</h3>
            <p class="subtitle">{{ t('profile.subtitle') }}</p>
          </div>

          <div class="panel">
            <label class="label">{{ t('profile.nickname') }}</label>
            <div class="input-row">
              <input v-model="nicknameInput" class="input" :placeholder="t('profile.nicknamePlaceholder')" maxlength="20" />
              <button class="action-btn" :disabled="loading" @click="handleSaveNickname">
                {{ t('profile.saveNickname') }}
              </button>
            </div>
          </div>

          <div class="panel">
            <label class="label">{{ t('profile.emailReadonly') }}</label>
            <input class="input readonly" :value="user?.email || '-'" readonly />
          </div>

          <div class="panel">
            <label class="label">{{ t('profile.passwordReset') }}</label>
            <div class="input-row">
              <button class="action-btn secondary" :disabled="loading || !user?.email" @click="handleSendReset">
                {{ t('profile.sendResetCode') }}
              </button>
            </div>

            <template v-if="provider === 'cloudbase'">
              <div class="input-stack">
                <input
                  v-model="resetCode"
                  class="input"
                  :placeholder="t('profile.resetCodePlaceholder')"
                  maxlength="8"
                />
                <input
                  v-model="newPassword"
                  class="input"
                  type="password"
                  :placeholder="t('profile.newPasswordPlaceholder')"
                />
                <button class="action-btn" :disabled="loading" @click="handleConfirmReset">
                  {{ t('profile.confirmReset') }}
                </button>
              </div>
            </template>
          </div>

          <div v-if="localMessage || error" class="message">
            {{ localMessage || error }}
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-container {
  width: 100%;
  max-width: 460px;
  border-radius: 20px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: var(--shadow);
  padding: 24px;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.modal-header {
  text-align: center;
  margin-bottom: 18px;
}

.icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  margin: 0 auto 10px;
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

h3 {
  margin: 0;
  font-size: 20px;
}

.subtitle {
  margin: 6px 0 0;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.panel {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
}

.label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.input-row {
  display: flex;
  gap: 8px;
}

.input-stack {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input {
  width: 100%;
  height: 40px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  padding: 0 12px;
}

.readonly {
  opacity: 0.8;
}

.action-btn {
  height: 40px;
  border-radius: 10px;
  border: none;
  background: var(--color-primary);
  color: #fff;
  padding: 0 12px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

.action-btn.secondary {
  background: color-mix(in srgb, var(--color-primary) 18%, transparent);
  color: var(--color-primary);
  border: 1px solid color-mix(in srgb, var(--color-primary) 35%, transparent);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.message {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
