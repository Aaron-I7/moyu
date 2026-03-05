<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="settings-overlay" @click.self="$emit('close')">
        <div class="settings-modal">
          <header class="modal-header">
            <h3 class="modal-title">⚙️ {{ t('settings.title') }}</h3>
            <button class="close-btn" @click="$emit('close')">
              <Icon icon="mdi:close" width="20" />
            </button>
          </header>

          <main class="modal-body">
            <!-- Theme Settings -->
            <div class="setting-section">
              <div class="section-header">
                <span class="section-icon">🎨</span>
                <div class="section-info">
                  <h4 class="section-title">{{ t('settings.theme') }}</h4>
                  <p class="section-desc">{{ t('settings.themeDesc') }}</p>
                </div>
              </div>
              
              <div class="theme-grid">
                <div 
                  v-for="theme in themeList" 
                  :key="theme.id"
                  class="theme-card"
                  :class="{ active: theme.id === themeStore.currentThemeId }"
                  @click="themeStore.setTheme(theme.id)"
                >
                  <Icon :icon="theme.icon" width="24" />
                  <span class="theme-name">{{ t(theme.i18nKey, theme.name) }}</span>
                </div>
              </div>
            </div>

            <!-- Boss Key Settings -->
            <div class="setting-section">
              <div class="section-header">
                <span class="section-icon">🛡️</span>
                <div class="section-info">
                  <h4 class="section-title">{{ t('bossKey.title') }}</h4>
                  <p class="section-desc">{{ t('bossKey.desc') }}</p>
                </div>
              </div>

              <!-- Danmaku Switch -->
              <div class="setting-subsection">
                <div class="toggle-row">
                  <span class="toggle-label">{{ t('bossKey.danmaku') }} ({{ danmakuEnabled ? t('bossKey.danmakuOn') : t('bossKey.danmakuOff') }})</span>
                  <button
                    class="toggle-btn"
                    :class="{ active: danmakuEnabled }"
                    @click="toggleDanmaku"
                  >
                    <span class="toggle-slider" />
                  </button>
                </div>
                <p class="subsection-desc">{{ t('bossKey.danmakuDesc') }}</p>
              </div>

              <!-- Mode Selector -->
              <div class="setting-subsection">
                <h5 class="subsection-title">{{ t('bossKey.camouflage') }}</h5>
                <div class="mode-grid">
                  <div
                    v-for="mode in bossKeyModes"
                    :key="mode.value"
                    class="mode-card"
                    :class="{ active: currentMode === mode.value }"
                    @click="emit('changeBossKeyMode', mode.value)"
                  >
                    <span class="mode-icon">{{ mode.icon }}</span>
                    <span class="mode-name">{{ t(mode.labelKey) }}</span>
                    <span class="mode-desc">{{ t(mode.descKey) }}</span>
                  </div>
                </div>
              </div>

              <!-- Hotkey Hint -->
              <div class="setting-subsection">
                <div class="hotkey-hint">
                  <span class="hint-icon">⌨️</span>
                  <span class="hint-text">{{ t('bossKey.hotkey') }}: <kbd>Esc</kbd></span>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore, themeList } from '@/core/theme'
import type { BossKeyMode } from '@/stores/bossKey'
import { useRealtimeDanmaku } from '@/composables/useRealtimeDanmaku'
import { onMounted } from 'vue'

defineProps<{
  visible: boolean
  currentMode: BossKeyMode
}>()

const emit = defineEmits<{
  close: []
  changeBossKeyMode: [mode: BossKeyMode]
}>()

const { t } = useI18n()
const themeStore = useThemeStore()
const { danmakuEnabled, loadDanmakuEnabled, saveDanmakuEnabled } = useRealtimeDanmaku()

const bossKeyModes: { value: BossKeyMode; icon: string; labelKey: string; descKey: string }[] = [
  { value: 'code', icon: '💻', labelKey: 'bossKey.modes.code', descKey: 'bossKey.modeDesc.code' },
  { value: 'excel', icon: '📊', labelKey: 'bossKey.modes.excel', descKey: 'bossKey.modeDesc.excel' },
  { value: 'forum', icon: '💬', labelKey: 'bossKey.modes.forum', descKey: 'bossKey.modeDesc.forum' },
  { value: 'terminal', icon: '⬛', labelKey: 'bossKey.modes.terminal', descKey: 'bossKey.modeDesc.terminal' }
]

function toggleDanmaku() {
  saveDanmakuEnabled(!danmakuEnabled.value)
}

onMounted(() => {
  loadDanmakuEnabled()
})
</script>

<style scoped lang="scss">
.settings-overlay {
  position: fixed;
  inset: 0;
  z-index: 100000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.settings-modal {
  width: 90%;
  max-width: 480px;
  background: var(--color-surface);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-background);
    color: var(--color-text);
  }
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  max-height: 70vh;
}

.setting-section {
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.section-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 4px;
}

.section-desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.4;
}

/* Theme Grid */
.theme-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.theme-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--color-background);
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--color-text-secondary);

  &:hover {
    background: var(--color-surface);
    border-color: var(--color-border);
    color: var(--color-text);
  }

  &.active {
    background: color-mix(in srgb, var(--color-primary) 5%, transparent);
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .theme-name {
    font-size: 12px;
    font-weight: 500;
  }
}

/* Boss Key Settings */
.setting-subsection {
  margin-top: 16px;
  padding: 12px;
  background: var(--color-background);
  border-radius: 12px;
}

.subsection-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 12px;
}

.subsection-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin: 8px 0 0;
  line-height: 1.4;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toggle-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
}

.toggle-btn {
  position: relative;
  width: 48px;
  height: 26px;
  background: var(--color-border);
  border: none;
  border-radius: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &.active {
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark, #059669) 100%);
  }
}

.toggle-slider {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;
  
  .toggle-btn.active & {
    transform: translateX(22px);
  }
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.mode-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  background: var(--color-surface);
  border: 2px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;

  &:hover {
    border-color: var(--color-border);
  }

  &.active {
    border-color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 5%, transparent);
  }
}

.mode-icon {
  font-size: 24px;
}

.mode-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.mode-desc {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.hotkey-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
  
  kbd {
    display: inline-block;
    padding: 2px 6px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-primary);
    box-shadow: 0 1px 0 var(--color-border);
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>