<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import { usePomodoro } from '../composables/usePomodoro'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { settings, saveSettings } = usePomodoro()
const { t } = useI18n({ useScope: 'global' })

// 本地状态
const localSettings = ref({ ...settings.value })

function save() {
  settings.value = { ...localSettings.value }
  saveSettings()
  emit('close')
}
</script>

<template>
  <div v-if="show" class="modal-overlay" @click="emit('close')">
    <div class="modal-content" @click.stop>
      <header>
        <h3>{{ t('pomodoro.settings.title', 'Timer Settings') }}</h3>
        <button class="close-btn" @click="emit('close')">
          <Icon icon="mdi:close" width="24" />
        </button>
      </header>

      <div class="settings-body">
        <div class="setting-group">
          <label>{{ t('pomodoro.settings.workDuration', 'Work Duration (min)') }}</label>
          <input type="number" v-model="localSettings.workDuration" min="1" max="60" />
        </div>

        <div class="setting-group">
          <label>{{ t('pomodoro.settings.shortBreak', 'Short Break (min)') }}</label>
          <input type="number" v-model="localSettings.shortBreakDuration" min="1" max="30" />
        </div>

        <div class="setting-group">
          <label>{{ t('pomodoro.settings.longBreak', 'Long Break (min)') }}</label>
          <input type="number" v-model="localSettings.longBreakDuration" min="1" max="45" />
        </div>

        <div class="setting-group">
          <label>{{ t('pomodoro.settings.longBreakInterval', 'Long Break Interval') }}</label>
          <input type="number" v-model="localSettings.longBreakInterval" min="1" max="10" />
        </div>

        <div class="toggle-group">
          <label>
            <span>{{ t('pomodoro.settings.autoStartBreaks', 'Auto-start Breaks') }}</span>
            <input type="checkbox" v-model="localSettings.autoStartBreaks" />
          </label>
        </div>

        <div class="toggle-group">
          <label>
            <span>{{ t('pomodoro.settings.autoStartPomodoros', 'Auto-start Pomodoros') }}</span>
            <input type="checkbox" v-model="localSettings.autoStartPomodoros" />
          </label>
        </div>
      </div>

      <footer>
        <button class="save-btn" @click="save">{{ t('pomodoro.settings.save', 'Save Changes') }}</button>
      </footer>
    </div>
  </div>
</template>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--color-surface);
  width: 90%;
  max-width: 400px;
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  animation: modal-in 0.3s ease;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border);
  
  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 4px;
  border-radius: 4px;
  
  &:hover {
    background: var(--color-background);
  }
}

.settings-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  label {
    font-size: 14px;
    color: var(--color-text-secondary);
  }
  
  input[type="number"] {
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid var(--color-border);
    background: var(--color-background);
    color: var(--color-text);
    font-size: 16px;
    
    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }
  }
}

.toggle-group {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .hint {
      margin: 0;
      font-size: 12px;
      color: var(--color-text-secondary);
      opacity: 0.7;
    }
    
    label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    
    span {
      font-size: 14px;
      color: var(--color-text);
    }
  }
}

footer {
  padding: 16px 24px;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
}

.save-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 0.9;
  }
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
