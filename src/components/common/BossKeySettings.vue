<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="settings-overlay" @click.self="$emit('close')">
        <div class="settings-modal">
          <header class="modal-header">
            <h3 class="modal-title">🛡️ 老板键设置</h3>
            <button class="close-btn" @click="$emit('close')">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </header>

          <main class="modal-body">
            <div class="setting-section">
              <div class="section-header">
                <span class="section-icon">⌨️</span>
                <div class="section-info">
                  <h4 class="section-title">快捷键</h4>
                  <p class="section-desc">按 <kbd>Esc</kbd> 键快速切换伪装界面</p>
                </div>
              </div>
            </div>

            <div class="setting-section">
              <div class="section-header">
                <span class="section-icon">🎭</span>
                <div class="section-info">
                  <h4 class="section-title">伪装界面</h4>
                  <p class="section-desc">选择老板键触发时显示的伪装界面</p>
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
                  <span class="mode-icon">{{ mode.icon }}</span>
                  <span class="mode-name">{{ mode.label }}</span>
                  <span class="mode-desc">{{ mode.desc }}</span>
                </button>
              </div>
            </div>

            <div class="setting-section">
              <div class="section-header">
                <span class="section-icon">💡</span>
                <div class="section-info">
                  <h4 class="section-title">使用技巧</h4>
                  <p class="section-desc">当老板走近时，快速按 Esc 键即可切换到工作界面，再次按 Esc 键返回</p>
                </div>
              </div>
            </div>
          </main>

          <footer class="modal-footer">
            <button class="btn btn-primary" @click="$emit('close')">完成</button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { BossKeyMode } from '@/stores/bossKey'

defineProps<{
  visible: boolean
  currentMode: BossKeyMode
}>()

const emit = defineEmits<{
  close: []
  changeMode: [mode: BossKeyMode]
}>()

const modes: { value: BossKeyMode; icon: string; label: string; desc: string }[] = [
  { value: 'code', icon: '💻', label: '代码编辑器', desc: 'VS Code 风格' },
  { value: 'excel', icon: '📊', label: 'Excel 表格', desc: '项目进度表' },
  { value: 'forum', icon: '💬', label: '技术论坛', desc: '技术社区风格' },
  { value: 'terminal', icon: '⬛', label: '终端命令', desc: 'PowerShell 风格' },
]

function selectMode(mode: BossKeyMode) {
  emit('changeMode', mode)
}
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
  font-size: 24px;
  flex-shrink: 0;
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
  font-size: 32px;
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
