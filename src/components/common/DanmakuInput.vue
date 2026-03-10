<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRealtimeDanmaku } from '@/composables/useRealtimeDanmaku'

const emit = defineEmits<{
  close: []
}>()
const { t, locale } = useI18n({ useScope: 'global' })
const isEn = computed(() => locale.value === 'en')

const {
  isConnected,
  isConnecting,
  onlineCount,
  danmakuHistory,
  connect,
  sendDanmaku,
  setSessionDanmakuProfile,
  loadHistory,
  clearHistory
} = useRealtimeDanmaku()

const inputText = ref('')
const selectedEmoji = ref('💬')
const showEmojiPicker = ref(false)
const showSettings = ref(false)
const showHistory = ref(false)
const tempUserName = ref('')
const useCustomStyle = ref(false)
const tempTextColor = ref('#FFD700')
const tempBackgroundColor = ref('#000000')

const emojis = ['💬', '😄', '🎉', '💡', '🐟', '☕', '🎮', '📚', '🎵', '🌟', '💪', '🎯', '🔥', '✨', '🌈']

const canSend = computed(() => {
  return isConnected.value && inputText.value.trim().length > 0
})

const connectionStatus = computed(() => {
  if (isConnecting.value) return { text: t('danmakuPanel.connecting'), color: '#FFA500' }
  if (isConnected.value) return { text: t('danmakuPanel.online', { count: onlineCount.value }), color: '#10B981' }
  return { text: t('danmakuPanel.offline'), color: '#EF4444' }
})

const sortedHistory = computed(() => {
  return [...danmakuHistory.value].reverse().slice(0, 10)
})

function handleConnect() {
  const name = tempUserName.value.trim()
  setSessionDanmakuProfile({
    userName: name || undefined,
    textColor: useCustomStyle.value ? tempTextColor.value : null,
    backgroundColor: useCustomStyle.value ? tempBackgroundColor.value : null
  })
  showSettings.value = false
  connect(name || undefined)
}

async function handleSend() {
  if (!canSend.value) return

  const name = tempUserName.value.trim()
  setSessionDanmakuProfile({
    userName: name || undefined,
    textColor: useCustomStyle.value ? tempTextColor.value : null,
    backgroundColor: useCustomStyle.value ? tempBackgroundColor.value : null
  })
  
  const success = await sendDanmaku(inputText.value.trim(), selectedEmoji.value)
  
  if (success) {
    inputText.value = ''
  }
}

function selectEmoji(emoji: string) {
  selectedEmoji.value = emoji
  showEmojiPicker.value = false
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
  if (e.key === 'Escape') {
    emit('close')
  }
}

function formatTime(timestamp: number) {
  const date = new Date(timestamp)
  return date.toLocaleString(locale.value === 'en' ? 'en-US' : 'zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function handleClearHistory() {
  if (confirm(t('danmakuPanel.clearConfirm'))) {
    clearHistory()
  }
}

onMounted(() => {
  loadHistory()
})
</script>

<template>
  <div class="danmaku-panel">
    <div class="panel-header">
      <div class="header-left">
        <span class="panel-icon">💬</span>
        <h3 class="panel-title">{{ t('danmakuPanel.title') }}</h3>
      </div>
      <div class="header-right">
        <button
          class="header-btn"
          :class="{ 'header-btn--active': showHistory }"
          :title="t('danmakuPanel.history')"
          @click="showHistory = !showHistory"
        >
          📋
        </button>
        <button class="header-btn close-btn" @click="emit('close')">
          ✕
        </button>
      </div>
    </div>

    <div class="panel-body">
      <div v-if="showHistory" class="history-section">
        <div class="history-header">
          <span class="history-count">{{ danmakuHistory.length }}/100</span>
          <button
            v-if="danmakuHistory.length > 0"
            class="clear-btn"
            @click="handleClearHistory"
          >
            {{ t('danmakuPanel.clear') }}
          </button>
        </div>
        
        <div v-if="danmakuHistory.length === 0" class="history-empty">
          <span class="empty-icon">📭</span>
          <p class="empty-text">{{ t('danmakuPanel.noRecords') }}</p>
        </div>
        
        <div v-else class="history-list">
          <div
            v-for="item in sortedHistory"
            :key="item.id"
            class="history-item"
          >
            <div class="history-item-header">
              <span v-if="item.emoji" class="history-emoji">{{ item.emoji }}</span>
              <span class="history-user">{{ item.userName }}</span>
              <span class="history-time">{{ formatTime(item.timestamp) }}</span>
            </div>
            <p class="history-content">{{ item.content }}</p>
          </div>
        </div>
      </div>

      <div v-else class="input-section">
        <div class="connection-status">
          <div class="status-dot" :style="{ background: connectionStatus.color }" />
          <span class="status-text">{{ connectionStatus.text }}</span>
        </div>

        <div v-if="!isConnected && !isConnecting" class="connect-section">
          <button class="connect-btn" @click="handleConnect">
            <span>🔗</span>
            <span>{{ t('danmakuPanel.connect') }}</span>
          </button>
        </div>

        <div v-if="isConnecting" class="connecting-section">
          <div class="loading-spinner" />
          <span>{{ t('danmakuPanel.connecting') }}</span>
        </div>

        <div v-if="isConnected" class="input-area">
          <div class="input-row">
            <div class="emoji-selector">
              <button
                class="emoji-btn"
                @click="showEmojiPicker = !showEmojiPicker"
              >
                {{ selectedEmoji }}
              </button>
              
              <Transition name="fade">
                <div v-if="showEmojiPicker" class="emoji-picker">
                  <button
                    v-for="emoji in emojis"
                    :key="emoji"
                    class="emoji-option"
                    @click="selectEmoji(emoji)"
                  >
                    {{ emoji }}
                  </button>
                </div>
              </Transition>
            </div>

            <input
              v-model="inputText"
              type="text"
              class="text-input"
              :placeholder="t('danmakuPanel.placeholder')"
              maxlength="100"
              @keydown="handleKeydown"
            />

            <button
              class="send-btn"
              :class="{ 'send-btn--disabled': !canSend }"
              :disabled="!canSend"
              @click="handleSend"
            >
              {{ t('danmakuPanel.send') }}
            </button>
          </div>
          
          <div class="char-count">{{ inputText.length }}/100</div>
        </div>

        <div class="settings-section">
          <button class="settings-btn" @click="showSettings = !showSettings">
            <span>⚙️</span>
            <span>{{ t('danmakuPanel.settings') }}</span>
          </button>
          
          <Transition name="slide">
            <div v-if="showSettings" class="settings-panel">
              <div class="setting-item">
                <label class="setting-label">{{ t('danmakuPanel.nickname') }}</label>
                <input
                  v-model="tempUserName"
                  type="text"
                  class="setting-input"
                  :placeholder="t('danmakuPanel.nicknamePlaceholder')"
                  maxlength="20"
                />
              </div>

              <div class="setting-item">
                <label class="setting-label">{{ t('danmakuPanel.customStyle') }}</label>
                <label class="setting-toggle">
                  <input v-model="useCustomStyle" type="checkbox" />
                  <span>{{ useCustomStyle ? t('danmakuPanel.on') : t('danmakuPanel.off') }}</span>
                </label>
              </div>

              <div v-if="useCustomStyle" class="setting-item">
                <label class="setting-label">{{ t('danmakuPanel.textColor') }}</label>
                <input v-model="tempTextColor" type="color" class="color-input" />
              </div>

              <div v-if="useCustomStyle" class="setting-item">
                <label class="setting-label">{{ t('danmakuPanel.backgroundColor') }}</label>
                <input v-model="tempBackgroundColor" type="color" class="color-input" />
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.danmaku-panel {
  position: fixed;
  bottom: 100px;
  right: 24px;
  width: 360px;
  max-height: 500px;
  background: linear-gradient(135deg, rgba(30, 20, 50, 0.98) 0%, rgba(20, 15, 40, 0.99) 100%);
  border: 1px solid rgba(138, 43, 226, 0.4);
  border-radius: 16px;
  box-shadow: 
    0 16px 64px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(138, 43, 226, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  animation: panel-slide-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 9999;
  
  @media (max-width: 768px) {
    right: 16px;
    bottom: 88px;
    width: calc(100% - 32px);
    max-width: 360px;
  }
  
  @media (max-width: 480px) {
    right: 8px;
    bottom: 80px;
    width: calc(100% - 16px);
  }
}

@keyframes panel-slide-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(138, 43, 226, 0.2);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-icon {
  font-size: 18px;
}

.panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.header-right {
  display: flex;
  gap: 6px;
}

.header-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.25);
  }
  
  &--active {
    background: rgba(139, 92, 246, 0.3);
    border-color: rgba(139, 92, 246, 0.5);
  }
}

.close-btn:hover {
  background: rgba(255, 77, 77, 0.2);
  border-color: rgba(255, 77, 77, 0.4);
}

.panel-body {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.3);
    border-radius: 2px;
  }
}

.history-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.history-count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.clear-btn {
  padding: 4px 10px;
  background: rgba(255, 77, 77, 0.15);
  border: 1px solid rgba(255, 77, 77, 0.25);
  border-radius: 6px;
  color: #ff6b6b;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 77, 77, 0.25);
    border-color: rgba(255, 77, 77, 0.4);
  }
}

.history-empty {
  text-align: center;
  padding: 24px 16px;
}

.empty-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 8px;
  opacity: 0.4;
}

.empty-text {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 3px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.03);
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.2);
    border-radius: 2px;
  }
}

.history-item {
  padding: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(139, 92, 246, 0.25);
  }
}

.history-item-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.history-emoji {
  font-size: 12px;
}

.history-user {
  font-size: 11px;
  font-weight: 600;
  color: rgba(139, 92, 246, 1);
}

.history-time {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.35);
  margin-left: auto;
}

.history-content {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.4;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
}

.connect-section {
  text-align: center;
  padding: 12px 0;
}

.connect-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
  }
}

.connecting-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 0;
  
  span {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
  }
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(139, 92, 246, 0.2);
  border-top-color: #8B5CF6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.input-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.emoji-selector {
  position: relative;
}

.emoji-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  
  &:hover {
    background: rgba(255, 255, 255, 0.12);
    transform: scale(1.05);
  }
}

.emoji-picker {
  position: absolute;
  bottom: 48px;
  left: 0;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  padding: 10px;
  background: rgba(30, 20, 50, 0.98);
  border: 1px solid rgba(138, 43, 226, 0.3);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  animation: emoji-pop 0.2s ease;
}

@keyframes emoji-pop {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.emoji-option {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.12);
    transform: scale(1.1);
  }
}

.text-input {
  flex: 1;
  height: 40px;
  padding: 0 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: #fff;
  font-size: 13px;
  font-family: inherit;
  transition: all 0.2s ease;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
  
  &:focus {
    outline: none;
    border-color: rgba(139, 92, 246, 0.5);
    background: rgba(255, 255, 255, 0.08);
  }
}

.send-btn {
  height: 40px;
  padding: 0 16px;
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
  
  &:hover:not(.send-btn--disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
  }
  
  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.char-count {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.35);
  text-align: right;
}

.settings-section {
  border-top: 1px solid rgba(138, 43, 226, 0.15);
  padding-top: 12px;
}

.settings-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.65);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
  }
}

.settings-panel {
  margin-top: 10px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.setting-item + .setting-item {
  margin-top: 10px;
}

.setting-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.65);
}

.setting-input {
  height: 32px;
  padding: 0 10px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
  transition: all 0.2s ease;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.35);
  }
  
  &:focus {
    outline: none;
    border-color: rgba(139, 92, 246, 0.5);
  }
}

.setting-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 10px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 12px;
}

.color-input {
  height: 32px;
  width: 100%;
  padding: 0;
  background: transparent;
  border: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
