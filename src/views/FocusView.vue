<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { usePomodoro } from '@/modules/tools/pomodoro/composables/usePomodoro'
import { useSoundEngine } from '@/modules/tools/pomodoro/composables/useSoundEngine'
import { useRealtimeDanmaku } from '@/composables/useRealtimeDanmaku'
import AmbienceModal from '@/modules/tools/pomodoro/components/AmbienceModal.vue'

const router = useRouter()
const { t } = useI18n({ useScope: 'global' })
const pomodoro = usePomodoro()
const soundEngine = useSoundEngine()
const { danmakuEnabled } = useRealtimeDanmaku()

let wakeLock: any = null

const requestWakeLock = async () => {
  if ('wakeLock' in navigator) {
    try {
      wakeLock = await (navigator as any).wakeLock.request('screen')
    } catch (err) {
      console.error('Wake Lock failed:', err)
    }
  }
}

const releaseWakeLock = async () => {
  if (wakeLock) {
    try {
      await wakeLock.release()
      wakeLock = null
    } catch (err) {
      console.error('Wake Lock release failed:', err)
    }
  }
}

const progress = computed(() => {
  const value = pomodoro.progress.value
  return Number.isFinite(value) ? value : 0
})

const showNoiseSettings = ref(false)
const isNoiseMuted = ref(false)
const activeSoundsCount = computed(() => soundEngine.sounds.filter(s => s.active).length)
const isWaveActive = computed(() => activeSoundsCount.value > 0 && !isNoiseMuted.value && pomodoro.status.value !== 'paused')

const handleExit = () => {
  if (originalDanmakuState !== null) {
    danmakuEnabled.value = originalDanmakuState
  }
  router.back()
}

const showControls = ref(true)
let hideTimer: number | null = null

const resetHideTimer = () => {
  showControls.value = true
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = window.setTimeout(() => {
    if (pomodoro.status.value === 'running') {
      showControls.value = false
    }
  }, 3000)
}

let originalDanmakuState: boolean | null = null

onMounted(() => {
  originalDanmakuState = danmakuEnabled.value
  danmakuEnabled.value = false
  
  pomodoro.init()
  requestWakeLock()
  document.addEventListener('mousemove', resetHideTimer)
  document.addEventListener('touchstart', resetHideTimer)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  releaseWakeLock()
  document.removeEventListener('mousemove', resetHideTimer)
  document.removeEventListener('touchstart', resetHideTimer)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  if (hideTimer) clearTimeout(hideTimer)
  
  if (originalDanmakuState !== null) {
    danmakuEnabled.value = originalDanmakuState
  }
})

const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    requestWakeLock()
  }
}

const togglePlay = () => {
  if (pomodoro.status.value === 'running') {
    pomodoro.pause()
  } else {
    pomodoro.start()
  }
}

const toggleMute = () => {
  if (!isNoiseMuted.value) {
    soundEngine.fadeOutAll()
    isNoiseMuted.value = true
    return
  }

  soundEngine.fadeInAll()
  isNoiseMuted.value = false
}
</script>

<template>
  <div class="focus-mode">
    <div class="focus-bg" :class="{ active: isWaveActive }">
      <div class="aurora" />
      <div v-if="isWaveActive" class="sound-wave">
        <span v-for="i in 18" :key="i" class="bar" :style="{ '--d': `${i * 0.08}s` }" />
      </div>
    </div>

    <div class="focus-content" :class="{ 'controls-hidden': !showControls }">
      <div class="timer-display">
        <div class="timer-circle">
          <svg viewBox="0 0 100 100" class="progress-ring">
            <circle class="ring-bg" cx="50" cy="50" r="48" />
            <circle 
              class="ring-progress" 
              cx="50" 
              cy="50" 
              r="48"
              :stroke-dasharray="301.59"
              :stroke-dashoffset="301.59 * (1 - progress / 100)"
            />
          </svg>
          <div class="time-text">{{ pomodoro.formattedTime.value }}</div>
        </div>
        
        <div class="task-info">
          <h2 v-if="pomodoro.settings.value.customTaskName">
            {{ pomodoro.settings.value.customTaskName }}
          </h2>
          <span class="mode-badge">{{ t(`pomodoro.mode.${pomodoro.mode.value}`) }}</span>
        </div>
      </div>

      <div class="controls-bar">
        <button class="control-btn secondary" @click="showNoiseSettings = true" :title="t('whiteNoise.title')">
          <Icon icon="mdi:tune-variant" width="24" />
        </button>

        <button class="control-btn secondary" @click="toggleMute" :title="isNoiseMuted ? 'Unmute' : 'Mute'">
          <Icon :icon="isNoiseMuted ? 'mdi:volume-off' : 'mdi:volume-high'" width="24" />
        </button>
        
        <button class="control-btn primary" @click="togglePlay">
          <Icon :icon="pomodoro.status.value === 'running' ? 'mdi:pause' : 'mdi:play'" width="32" />
        </button>
        
        <button class="control-btn secondary" @click="handleExit" title="Exit Focus">
          <Icon icon="mdi:fullscreen-exit" width="24" />
        </button>
      </div>
    </div>

    <AmbienceModal :show="showNoiseSettings" @close="showNoiseSettings = false" />
  </div>
</template>

<style scoped lang="scss">
.focus-mode {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #000;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.focus-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 15% 20%, rgba(13, 148, 136, 0.25) 0%, transparent 45%),
    radial-gradient(circle at 85% 25%, rgba(20, 184, 166, 0.2) 0%, transparent 55%),
    radial-gradient(circle at 55% 80%, rgba(249, 115, 22, 0.12) 0%, transparent 50%),
    linear-gradient(135deg, #07101a 0%, #070a14 100%);
  opacity: 1;
  overflow: hidden;
}

.aurora {
  position: absolute;
  inset: -40%;
  background: conic-gradient(
    from 180deg,
    rgba(20, 184, 166, 0.0),
    rgba(20, 184, 166, 0.35),
    rgba(13, 148, 136, 0.15),
    rgba(249, 115, 22, 0.12),
    rgba(20, 184, 166, 0.0)
  );
  filter: blur(40px) saturate(140%);
  opacity: 0.5;
  transform: translate3d(0, 0, 0);
}

.focus-bg.active .aurora {
  opacity: 0.8;
  animation: aurora-spin 14s linear infinite;
}

.sound-wave {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: min(620px, 90vw);
  height: min(280px, 32vh);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 8px;
  opacity: 0.85;
  pointer-events: none;
  mask-image: radial-gradient(circle at center, #000 42%, transparent 72%);
}

.bar {
  width: 10px;
  height: 40px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(20, 184, 166, 0.95) 0%, rgba(13, 148, 136, 0.4) 60%, rgba(249, 115, 22, 0.0) 100%);
  box-shadow: 0 0 20px rgba(20, 184, 166, 0.25);
  transform-origin: bottom;
  animation: wave-bounce 1.6s ease-in-out infinite;
  animation-delay: var(--d);
}

.focus-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 60px;
  transition: opacity 0.5s ease;
  
  &.controls-hidden {
    .controls-bar {
      opacity: 0;
      pointer-events: none;
    }
    cursor: none;
  }
}

.timer-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.timer-circle {
  position: relative;
  width: 300px;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  @media (min-width: 768px) {
    width: 400px;
    height: 400px;
  }
}

.progress-ring {
  position: absolute;
  inset: 0;
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
  
  .ring-bg {
    fill: none;
    stroke: rgba(255, 255, 255, 0.1);
    stroke-width: 4;
  }
  
  .ring-progress {
    fill: none;
    stroke: var(--color-primary, #4ecdc4);
    stroke-width: 4;
    stroke-linecap: round;
    transition: stroke-dashoffset 1s linear;
  }
}

.time-text {
  font-size: 64px;
  font-weight: 200;
  font-feature-settings: "tnum";
  font-variant-numeric: tabular-nums;
  
  @media (min-width: 768px) {
    font-size: 96px;
  }
}

.task-info {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  
  h2 {
    font-size: 24px;
    font-weight: 500;
    opacity: 0.9;
    margin: 0;
  }
}

.mode-badge {
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 999px;
  font-size: 14px;
  backdrop-filter: blur(4px);
}

.controls-bar {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 20px 40px;
  background: rgba(7, 10, 20, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  backdrop-filter: blur(10px);
  transition: opacity 0.3s ease;
}

@keyframes wave-bounce {
  0%, 100% { transform: scaleY(0.35); opacity: 0.7; }
  50% { transform: scaleY(1.15); opacity: 1; }
}

@keyframes aurora-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .focus-bg.active .aurora {
    animation: none;
  }

  .bar {
    animation: none;
  }
}

.control-btn {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
    background: rgba(255, 255, 255, 0.1);
  }
  
  &.secondary {
    width: 48px;
    height: 48px;
    opacity: 0.8;
    
    &:hover {
      opacity: 1;
    }
  }
  
  &.primary {
    width: 72px;
    height: 72px;
    background: var(--color-primary, #4ecdc4);
    color: #000;
    box-shadow: 0 4px 20px rgba(78, 205, 196, 0.4);
    
    &:hover {
      transform: scale(1.05);
      background: var(--color-primary-light, #7ed6df);
    }
  }
}
</style>
