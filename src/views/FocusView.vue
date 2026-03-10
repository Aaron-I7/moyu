<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { usePomodoro } from '@/modules/tools/pomodoro/composables/usePomodoro'
import { useSoundEngine } from '@/modules/tools/pomodoro/composables/useSoundEngine'
import { useRealtimeDanmaku } from '@/composables/useRealtimeDanmaku'
import FocusNoiseDrawer from '@/modules/tools/pomodoro/components/FocusNoiseDrawer.vue'

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
const isAudioPaused = ref(true)
const relaxDurationInput = ref('5')
const showDurationPanel = ref(false)
const controlsBarRef = ref<HTMLElement | null>(null)
const controlsBarHeight = ref(96)
const keyboardInset = ref(0)
const activeSoundsCount = computed(() => soundEngine.sounds.filter(s => s.active).length)
const isWaveActive = computed(() => activeSoundsCount.value > 0 && !isNoiseMuted.value && !isAudioPaused.value)
const showTaskInfo = computed(() => pomodoro.status.value !== 'running')

const scene = computed(() => {
  if (activeSoundsCount.value === 0) return 'silent'
  return pomodoro.mode.value === 'work' ? 'focus' : 'relax'
})

const focusStyleVars = computed(() => ({
  '--controls-height': `${controlsBarHeight.value}px`,
  '--keyboard-inset': `${keyboardInset.value}px`,
  '--wave-gap': '16px'
}))

const updateControlsMetrics = () => {
  if (!controlsBarRef.value) return
  const rect = controlsBarRef.value.getBoundingClientRect()
  controlsBarHeight.value = Math.max(72, Math.round(rect.height))
}

const updateKeyboardInset = () => {
  const vv = window.visualViewport
  if (!vv) {
    keyboardInset.value = 0
    return
  }
  const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
  keyboardInset.value = Math.round(inset)
}

watch(activeSoundsCount, (val, oldVal) => {
  if (val === 0) {
    isNoiseMuted.value = false
    isAudioPaused.value = false
  } else if (val > 0 && oldVal === 0) {
    isAudioPaused.value = false
  }
})

const handleExit = () => {
  pomodoro.pause()
  soundEngine.stopAll(true)
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

const setTimerMode = (nextMode: 'work' | 'short-break') => {
  if (pomodoro.mode.value === nextMode) return
  const wasRunning = pomodoro.status.value === 'running'
  pomodoro.mode.value = nextMode
  pomodoro.resetTimer()
  if (wasRunning) {
    pomodoro.start()
  }
}

const handleRelaxInput = (event: Event) => {
  const element = event.target as HTMLInputElement
  relaxDurationInput.value = element.value.replace(/[^\d]/g, '').slice(0, 3)
}

const applyRelaxDuration = (nextValue: string) => {
  const minutes = Math.max(1, Math.min(180, Number(nextValue) || 5))
  relaxDurationInput.value = String(minutes)
  pomodoro.settings.value.shortBreakDuration = minutes
  pomodoro.saveSettings()

  if (pomodoro.mode.value === 'short-break') {
    const wasRunning = pomodoro.status.value === 'running'
    pomodoro.resetTimer()
    if (wasRunning) {
      pomodoro.start()
    }
  }
}

onMounted(() => {
  originalDanmakuState = danmakuEnabled.value
  danmakuEnabled.value = false
  
  pomodoro.init()
  relaxDurationInput.value = String(pomodoro.settings.value.shortBreakDuration || 5)
  pomodoro.mode.value = 'short-break'
  pomodoro.resetTimer()
  showNoiseSettings.value = true
  requestWakeLock()
  updateControlsMetrics()
  updateKeyboardInset()
  document.addEventListener('mousemove', resetHideTimer)
  document.addEventListener('touchstart', resetHideTimer)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('resize', updateControlsMetrics)
  window.addEventListener('orientationchange', updateControlsMetrics)
  window.visualViewport?.addEventListener('resize', updateKeyboardInset)
  window.visualViewport?.addEventListener('scroll', updateKeyboardInset)
})

onUnmounted(() => {
  releaseWakeLock()
  document.removeEventListener('mousemove', resetHideTimer)
  document.removeEventListener('touchstart', resetHideTimer)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('resize', updateControlsMetrics)
  window.removeEventListener('orientationchange', updateControlsMetrics)
  window.visualViewport?.removeEventListener('resize', updateKeyboardInset)
  window.visualViewport?.removeEventListener('scroll', updateKeyboardInset)
  if (hideTimer) clearTimeout(hideTimer)
  pomodoro.pause()
  soundEngine.stopAll(true)
  
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
    isAudioPaused.value = false
    return
  }

  soundEngine.fadeInAll()
  isNoiseMuted.value = false
  isAudioPaused.value = false
}
</script>

<template>
  <div class="focus-mode" :style="focusStyleVars">
    <div class="focus-bg" :class="[{ active: isWaveActive }, `scene-${scene}`]">
      <div class="aurora" />
      <div class="focus-grid" />
      <div class="focus-glow focus-glow-left" />
      <div class="focus-glow focus-glow-right" />
      <div v-if="isWaveActive" class="sound-wave" :class="[`scene-${scene}`, { muted: isNoiseMuted || isAudioPaused }]">
        <div class="wave-halo halo-a" />
        <div class="wave-halo halo-b" />
        <div class="wave-track" />
        <span v-for="i in 44" :key="i" class="bar" :style="{ '--d': `${i * 0.06}s` }" />
      </div>
    </div>

    <div class="focus-content" :class="{ 'controls-hidden': !showControls, 'timer-hidden': !showDurationPanel }">
      <div v-show="showDurationPanel" class="timer-display">
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
          <div class="timer-center">
            <div class="time-text">{{ pomodoro.formattedTime.value }}</div>
            <button
              class="timer-circle-action"
              @click="togglePlay"
              :title="pomodoro.status.value === 'running' ? t('pomodoro.focus.timerPause') : t('pomodoro.focus.timerStart')"
            >
              <Icon :icon="pomodoro.status.value === 'running' ? 'mdi:pause' : 'mdi:play'" width="36" />
            </button>
          </div>
        </div>
        
        <div v-show="showTaskInfo" class="task-info">
          <h2 v-if="pomodoro.settings.value.customTaskName">
            {{ pomodoro.settings.value.customTaskName }}
          </h2>
          <span class="mode-badge">{{ t(`pomodoro.mode.${pomodoro.mode.value}`) }}</span>
          <div class="relax-duration-control">
            <span>{{ t('pomodoro.focus.relaxDuration') }}</span>
            <div class="duration-input">
              <input
                :value="relaxDurationInput"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                @input="handleRelaxInput"
                @change="applyRelaxDuration(relaxDurationInput)"
              >
              <button @click="applyRelaxDuration(relaxDurationInput)">{{ t('pomodoro.focus.applyDuration') }}</button>
            </div>
          </div>
          <div class="mode-switch">
            <button
              class="mode-switch-btn"
              :class="{ active: pomodoro.mode.value === 'short-break' }"
              @click="setTimerMode('short-break')"
            >
              {{ t('pomodoro.mode.short-break') }}
            </button>
            <button
              class="mode-switch-btn"
              :class="{ active: pomodoro.mode.value === 'work' }"
              @click="setTimerMode('work')"
            >
              {{ t('pomodoro.mode.work') }}
            </button>
          </div>
        </div>
      </div>

      <div ref="controlsBarRef" class="controls-bar">
        <button class="control-btn secondary" @click="showNoiseSettings = !showNoiseSettings" :title="t('whiteNoise.title')">
          <Icon icon="mdi:tune-variant" width="24" />
        </button>

        <button
          class="control-btn secondary"
          :class="{ active: showDurationPanel }"
          @click="showDurationPanel = !showDurationPanel"
          :title="showDurationPanel ? t('pomodoro.focus.hideDuration') : t('pomodoro.focus.showDuration')"
        >
          <Icon icon="mdi:timer-outline" width="24" />
        </button>

        <button class="control-btn secondary" @click="toggleMute" :title="isNoiseMuted ? t('pomodoro.focus.unmute') : t('pomodoro.focus.mute')">
          <Icon :icon="isNoiseMuted ? 'mdi:volume-off' : 'mdi:volume-high'" width="24" />
        </button>
        
        <button class="control-btn secondary" @click="handleExit" :title="t('pomodoro.focus.exit')">
          <Icon icon="mdi:fullscreen-exit" width="24" />
        </button>
      </div>
    </div>

    <FocusNoiseDrawer :show="showNoiseSettings" @close="showNoiseSettings = false" />
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
  opacity: 0.78;
  animation: aurora-spin 14s linear infinite;
}

.focus-bg.scene-silent {
  filter: saturate(96%);
}

.focus-bg.scene-relax {
  filter: saturate(112%);
}

.focus-bg.scene-focus {
  filter: saturate(130%) hue-rotate(18deg);
}

.focus-bg.scene-focus.active .aurora {
  animation-duration: 10.5s;
}

.focus-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(167, 243, 208, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(167, 243, 208, 0.05) 1px, transparent 1px);
  background-size: 64px 64px;
  opacity: 0.18;
  transform: perspective(900px) rotateX(58deg) translateY(38%);
  transform-origin: center bottom;
}

.focus-glow {
  position: absolute;
  width: 48vw;
  max-width: 600px;
  aspect-ratio: 1/1;
  border-radius: 50%;
  filter: blur(48px);
  pointer-events: none;
}

.focus-glow-left {
  left: -12%;
  top: 26%;
  background: radial-gradient(circle, rgba(20, 184, 166, 0.34) 0%, rgba(20, 184, 166, 0.0) 68%);
}

.focus-glow-right {
  right: -10%;
  top: 10%;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.28) 0%, rgba(56, 189, 248, 0.0) 70%);
}

.focus-bg.active .focus-glow-left {
  animation: glow-breathe-a 7.2s ease-in-out infinite;
}

.focus-bg.active .focus-glow-right {
  animation: glow-breathe-b 8.6s ease-in-out infinite;
}

.sound-wave {
  position: absolute;
  left: 50%;
  bottom: calc(env(safe-area-inset-bottom, 0px) + var(--keyboard-inset, 0px) + var(--controls-height, 96px) + var(--wave-gap, 12px));
  transform: translateX(-50%);
  width: 70vw;
  max-width: 980px;
  height: clamp(240px, 36vh, 380px);
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0;
  opacity: 0.9;
  pointer-events: none;
  mask-image: radial-gradient(ellipse at center, #000 62%, transparent 96%);
  isolation: isolate;
  --wave-speed: 1.95s;
}

.sound-wave.scene-relax {
  --wave-speed: 2.35s;
}

.sound-wave.scene-focus {
  --wave-speed: 1.55s;
}

.sound-wave.muted {
  opacity: 0.55;
  filter: saturate(70%);
}

.bar {
  width: 8px;
  height: 80px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(186, 250, 231, 0.96) 0%, rgba(20, 184, 166, 0.78) 36%, rgba(13, 148, 136, 0.36) 72%, rgba(13, 148, 136, 0) 100%);
  box-shadow: 0 0 24px rgba(20, 184, 166, 0.34), 0 0 48px rgba(20, 184, 166, 0.2);
  transform-origin: bottom;
  animation: wave-bounce var(--wave-speed) cubic-bezier(0.38, 0, 0.26, 1) infinite;
  animation-delay: var(--d);
  z-index: 3;
}

.wave-track {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 16%;
  height: 2px;
  background: linear-gradient(90deg, rgba(167, 243, 208, 0), rgba(167, 243, 208, 0.72), rgba(167, 243, 208, 0));
  opacity: 0.54;
  box-shadow: 0 0 22px rgba(20, 184, 166, 0.46);
  z-index: 1;
}

.wave-halo {
  position: absolute;
  left: 50%;
  top: 50%;
  border: 1px solid rgba(167, 243, 208, 0.3);
  border-radius: 999px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 0;
}

.halo-a {
  width: min(560px, 84vw);
  height: min(376px, 44vh);
  animation: wave-ring-a 3.8s ease-out infinite;
}

.halo-b {
  width: min(690px, 96vw);
  height: min(464px, 56vh);
  animation: wave-ring-b 4.8s ease-out infinite;
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

.focus-content.timer-hidden {
  gap: 0;
}

.timer-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.timer-circle-action {
  width: clamp(64px, 10vw, 96px);
  height: clamp(64px, 10vw, 96px);
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.92);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.32);
    transform: scale(1.02);
  }
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

.timer-center {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
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

.relax-duration-control {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.86);
  font-size: 13px;
}

.duration-input {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  input {
    width: 62px;
    padding: 4px 8px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(4, 6, 13, 0.5);
    color: #fff;
  }

  button {
    border: none;
    border-radius: 999px;
    padding: 6px 12px;
    background: rgba(20, 184, 166, 0.24);
    color: #a7f3d0;
    font-size: 12px;
    cursor: pointer;
  }
}

.mode-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.mode-switch-btn {
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.84);
  font-size: 12px;
  cursor: pointer;

  &.active {
    background: rgba(20, 184, 166, 0.24);
    border-color: rgba(20, 184, 166, 0.72);
    color: #a7f3d0;
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
  position: fixed;
  left: 50%;
  bottom: calc(env(safe-area-inset-bottom, 0px) + var(--keyboard-inset, 0px) + 8px);
  transform: translateX(-50%);
  z-index: 4;
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
  0%, 100% { transform: scaleY(0.3); opacity: 0.64; }
  25% { transform: scaleY(0.62); opacity: 0.88; }
  50% { transform: scaleY(1.24); opacity: 1; }
  75% { transform: scaleY(0.7); opacity: 0.9; }
}

@keyframes aurora-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes glow-breathe-a {
  0%, 100% { opacity: 0.42; transform: scale(0.92); }
  50% { opacity: 0.66; transform: scale(1.08); }
}

@keyframes glow-breathe-b {
  0%, 100% { opacity: 0.34; transform: scale(0.9); }
  45% { opacity: 0.58; transform: scale(1.06); }
}

@keyframes wave-ring-a {
  0% { opacity: 0.06; transform: translate(-50%, -50%) scale(0.88); }
  40% { opacity: 0.34; }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.16); }
}

@keyframes wave-ring-b {
  0% { opacity: 0.04; transform: translate(-50%, -50%) scale(0.84); }
  44% { opacity: 0.28; }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.12); }
}

@media (prefers-reduced-motion: reduce) {
  .focus-bg.active .aurora {
    animation: none;
  }

  .bar {
    animation: none;
  }

  .focus-glow-left,
  .focus-glow-right,
  .halo-a,
  .halo-b {
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

    &.active {
      opacity: 1;
      background: rgba(20, 184, 166, 0.18);
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
