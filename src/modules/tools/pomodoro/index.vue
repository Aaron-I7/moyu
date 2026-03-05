<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { usePomodoro } from './composables/usePomodoro'
import TimerDisplay from './components/TimerDisplay.vue'
import Controls from './components/Controls.vue'
import TaskInput from './components/TaskInput.vue'
import SettingsModal from './components/SettingsModal.vue'

const {
  start,
  pause,
  skip,
  resetTimer,
  timeLeft: _timeLeft,
  progress,
  mode,
  status,
  formattedTime,
  init,
  cleanup,
  soundEngine,
  settings
} = usePomodoro()

const showSettings = ref(false)

init()

onUnmounted(() => {
  cleanup()
  if (!settings.value.allowGlobalPlayback) {
    soundEngine.stopAll()
  }
})
</script>

<template>
  <div class="pomodoro-container">
    <div class="top-actions">
      <button class="action-btn" @click="soundEngine.isGlobalMixerOpen.value = true" title="Ambience Mixer">
        <Icon icon="mdi:tune-variant" width="24" />
      </button>
      <button class="action-btn" @click="showSettings = true" title="Settings">
        <Icon icon="mdi:cog" width="24" />
      </button>
    </div>

    <div class="timer-section">
      <TaskInput />
      
      <TimerDisplay 
        :timeLeft="formattedTime"
        :progress="progress"
        :mode="mode"
      />

      <Controls 
        :status="status"
        @start="start"
        @pause="pause"
        @skip="skip"
        @reset="resetTimer"
      />
    </div>

    <SettingsModal 
      :show="showSettings" 
      @close="showSettings = false" 
    />
  </div>
</template>

<style scoped lang="scss">
.pomodoro-container {
  position: fixed;
  inset: 0;
  z-index: 10;
  padding-top: 65px; /* Match App header height + border */
  background: var(--color-background);
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
}

.top-actions {
  width: 100%;
  max-width: 1200px; /* Match header max-width or keep flexible */
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  z-index: 10;
  flex-shrink: 0;
}

.action-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: var(--color-surface);
    color: var(--color-text);
  }
}

.timer-section {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 480px;
  flex: 1;
  padding-bottom: 80px; /* Visual balance */
}
</style>
