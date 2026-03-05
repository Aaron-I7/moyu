<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  progress: number
  timeLeft: string
  mode: 'work' | 'short-break' | 'long-break'
}>()

const { t } = useI18n({ useScope: 'global' })
const radius = 135
const circumference = 2 * Math.PI * radius
const dashOffset = computed(() => {
  return circumference * (1 - props.progress / 100)
})

const modeColor = computed(() => {
  switch (props.mode) {
    case 'work': return 'var(--color-primary)'
    case 'short-break': return 'var(--color-success)'
    case 'long-break': return 'var(--color-warning)'
    default: return 'var(--color-primary)'
  }
})
</script>

<template>
  <div class="timer-display">
    <svg class="progress-ring" width="300" height="300" viewBox="0 0 300 300">
      <!-- 背景轨道 -->
      <circle
        class="progress-ring__bg"
        stroke="var(--color-border)"
        stroke-width="8"
        fill="transparent"
        :r="radius"
        cx="150"
        cy="150"
      />
      <!-- 进度条 -->
      <circle
        class="progress-ring__circle"
        :stroke="modeColor"
        stroke-width="8"
        stroke-linecap="round"
        fill="transparent"
        :r="radius"
        cx="150"
        cy="150"
        :style="{ 
          strokeDasharray: `${circumference} ${circumference}`, 
          strokeDashoffset: dashOffset 
        }"
      />
    </svg>
    
    <div class="time-content">
      <div class="time-text" :style="{ color: modeColor }">
        {{ timeLeft }}
      </div>
      <div class="mode-label">
        {{ t('pomodoro.mode.' + mode, mode.replace('-', ' ').toUpperCase()) }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.timer-display {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 300px;
  height: 300px;
  margin: 0 auto;
}

.progress-ring {
  transform: rotate(-90deg);
  overflow: visible;
  
  &__bg {
    transition: stroke 0.3s ease;
  }
  
  &__circle {
    transition: stroke-dashoffset 0.5s linear, stroke 0.3s ease;
    filter: drop-shadow(0 0 4px var(--color-primary-light));
  }
}

.time-content {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.time-text {
  font-size: 64px;
  font-weight: 700;
  font-family: 'Monaco', 'Consolas', monospace;
  line-height: 1;
  letter-spacing: -2px;
  user-select: none;
  transition: color 0.3s ease;
}

.mode-label {
  margin-top: 8px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 2px;
  color: var(--color-text-secondary);
  opacity: 0.8;
}
</style>
