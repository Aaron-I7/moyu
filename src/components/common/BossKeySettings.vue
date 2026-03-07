<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="settings-overlay" @click.self="$emit('close')">
        <div class="settings-modal">
          <header class="modal-header">
            <h3 class="modal-title">
              <Icon icon="mdi:shield-crown-outline" width="20" />
              <span>{{ t('bossKey.title') }}</span>
            </h3>
            <button class="close-btn" @click="$emit('close')">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </header>

          <main class="modal-body">
            <div class="setting-section">
              <div class="section-header">
                <span class="section-icon">
                  <Icon icon="mdi:message-badge-outline" width="18" />
                </span>
                <div class="section-info">
                  <h4 class="section-title">{{ t('bossKey.danmaku') }}</h4>
                  <p class="section-desc">{{ t('bossKey.danmakuDesc') }}</p>
                </div>
              </div>
              <div class="toggle-row">
                <span class="toggle-label">{{ danmakuEnabled ? t('bossKey.danmakuOn') : t('bossKey.danmakuOff') }}</span>
                <button
                  class="toggle-btn"
                  :class="{ active: danmakuEnabled }"
                  @click="toggleDanmaku"
                >
                  <span class="toggle-slider" />
                </button>
              </div>
            </div>

            <div class="setting-section">
              <div class="section-header">
                <span class="section-icon">
                  <Icon icon="mdi:keyboard-variant" width="18" />
                </span>
                <div class="section-info">
                  <h4 class="section-title">{{ t('bossKey.hotkey') }}</h4>
                  <p class="section-desc">{{ t('bossKey.hotkeyDesc') }}</p>
                </div>
              </div>
            </div>

            <div class="setting-section">
              <div class="section-header">
                <span class="section-icon">
                  <Icon icon="mdi:palette-outline" width="18" />
                </span>
                <div class="section-info">
                  <h4 class="section-title">{{ t('settings.theme') }}</h4>
                  <p class="section-desc">{{ t('settings.themeDesc') }}</p>
                </div>
              </div>

              <div class="theme-grid">
                <button
                  v-for="theme in themeList"
                  :key="theme.id"
                  class="theme-card"
                  :class="{ active: currentThemeId === theme.id }"
                  @click="setTheme(theme.id)"
                >
                  <div class="theme-head">
                    <Icon :icon="theme.icon" width="18" />
                    <span>{{ t(theme.i18nKey) }}</span>
                  </div>
                  <div class="theme-palette">
                    <span :style="{ background: theme.colors.primary }"></span>
                    <span :style="{ background: theme.colors.accent }"></span>
                    <span :style="{ background: theme.colors.surface, border: '1px solid ' + theme.colors.border }"></span>
                  </div>
                </button>
              </div>
            </div>

            <div class="setting-section">
              <div class="section-header">
                <span class="section-icon">
                  <Icon icon="mdi:incognito-circle" width="18" />
                </span>
                <div class="section-info">
                  <h4 class="section-title">{{ t('bossKey.camouflage') }}</h4>
                  <p class="section-desc">{{ t('bossKey.camouflageDesc') }}</p>
                </div>
              </div>

              <div class="mode-grid">
                <button
                  v-for="mode in modes"
                  :key="mode.value"
                  class="mode-card"
                  :class="{ active: currentMode === mode.value }"
                  @click="selectMode(mode.value)"
                >
                  <Icon class="mode-icon" :icon="mode.icon" width="30" />
                  <span class="mode-name">{{ t(mode.labelKey) }}</span>
                  <span class="mode-desc">{{ t(mode.descKey) }}</span>
                </button>
              </div>
            </div>

            <div class="setting-section">
              <div class="section-header">
                <span class="section-icon">
                  <Icon icon="mdi:lightbulb-on-outline" width="18" />
                </span>
                <div class="section-info">
                  <h4 class="section-title">{{ t('bossKey.tips') }}</h4>
                  <p class="section-desc">{{ t('bossKey.tipsDesc') }}</p>
                </div>
              </div>
            </div>
          </main>

          <footer class="modal-footer">
            <button class="btn btn-primary" @click="$emit('close')">{{ t('bossKey.done') }}</button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import type { BossKeyMode } from '@/stores/bossKey'
import { useRealtimeDanmaku } from '@/composables/useRealtimeDanmaku'
import { useThemeStore } from '@/core/theme/store'
import { themeList, type ThemeId } from '@/core/theme/config'

defineProps<{
  visible: boolean
  currentMode: BossKeyMode
}>()

const emit = defineEmits<{
  close: []
  changeMode: [mode: BossKeyMode]
}>()

const { t } = useI18n()
const { danmakuEnabled, loadDanmakuEnabled, saveDanmakuEnabled } = useRealtimeDanmaku()
const themeStore = useThemeStore()
const currentThemeId = themeStore.currentThemeId

const modes: { value: BossKeyMode; icon: string; labelKey: string; descKey: string }[] = [
  { value: 'code', icon: 'mdi:code-braces-box', labelKey: 'bossKey.modes.code', descKey: 'bossKey.modeDesc.code' },
  { value: 'excel', icon: 'mdi:microsoft-excel', labelKey: 'bossKey.modes.excel', descKey: 'bossKey.modeDesc.excel' },
  { value: 'forum', icon: 'mdi:forum-outline', labelKey: 'bossKey.modes.forum', descKey: 'bossKey.modeDesc.forum' },
  { value: 'terminal', icon: 'mdi:console-line', labelKey: 'bossKey.modes.terminal', descKey: 'bossKey.modeDesc.terminal' }
]

function selectMode(mode: BossKeyMode) {
  emit('changeMode', mode)
}

function toggleDanmaku() {
  saveDanmakuEnabled(!danmakuEnabled.value)
}

function setTheme(themeId: ThemeId) {
  themeStore.setTheme(themeId)
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
  max-width: 500px;
  max-height: 85vh;
  background: var(--color-surface);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
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
  flex: 1;
  padding: 20px 24px;
  overflow-y: auto;
}

.setting-section {
  margin-bottom: 24px;

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
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-primary);
  flex-shrink: 0;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.theme-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  transition: var(--transition);

  &:hover {
    border-color: var(--color-primary);
    transform: translateY(-1px);
  }

  &.active {
    border-color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 10%, var(--color-background));
  }
}

.theme-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.theme-palette {
  display: flex;
  gap: 6px;

  span {
    width: 16px;
    height: 16px;
    border-radius: 999px;
    display: inline-block;
  }
}

.section-info {
  flex: 1;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 4px;
}

.section-desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0;

  kbd {
    display: inline-block;
    padding: 2px 6px;
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-primary);
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
  gap: 8px;
  padding: 16px 12px;
  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--color-primary);
    background: var(--color-surface);
  }

  &.active {
    border-color: var(--color-primary);
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);
  }
}

.mode-icon {
  color: var(--color-primary);
  line-height: 1;
}

.mode-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.mode-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--color-background);
  border-radius: 10px;
  margin-top: 8px;
}

.toggle-label {
  font-size: 13px;
  color: var(--color-text-secondary);
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

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--color-border);
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark, #059669) 100%);
  color: white;
  border: none;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .settings-modal {
    transform: scale(0.95);
  }
}
</style>
