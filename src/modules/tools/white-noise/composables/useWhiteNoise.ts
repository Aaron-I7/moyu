import { reactive, ref, computed } from 'vue'
import type { SoundItem, WhiteNoiseState, TimerPreset } from '../types'

const timerPresets: TimerPreset[] = [
  { label: '关闭', value: 0 },
  { label: '5分钟', value: 5 },
  { label: '15分钟', value: 15 },
  { label: '30分钟', value: 30 },
  { label: '60分钟', value: 60 }
]

const defaultSounds: SoundItem[] = [
  { id: 'rain', name: '雨声', icon: 'mdi:weather-rainy', volume: 0.5, isPlaying: false },
  { id: 'wind', name: '风声', icon: 'mdi:weather-windy', volume: 0.5, isPlaying: false },
  { id: 'thunder', name: '雷声', icon: 'mdi:weather-lightning', volume: 0.5, isPlaying: false },
  { id: 'fire', name: '壁炉', icon: 'mdi:fire', volume: 0.5, isPlaying: false },
  { id: 'cafe', name: '咖啡厅', icon: 'mdi:coffee', volume: 0.5, isPlaying: false },
  { id: 'ocean', name: '海浪', icon: 'mdi:waves', volume: 0.5, isPlaying: false },
  { id: 'birds', name: '鸟鸣', icon: 'mdi:bird', volume: 0.5, isPlaying: false },
  { id: 'night', name: '夜晚', icon: 'mdi:weather-night', volume: 0.5, isPlaying: false }
]

export function useWhiteNoise() {
  const state = reactive<WhiteNoiseState>({
    sounds: defaultSounds.map(s => ({ ...s })),
    masterVolume: 0.7,
    timer: null,
    isPlaying: false
  })

  const timerRemaining = ref(0)
  let timerInterval: number | null = null

  const activeSounds = computed(() => state.sounds.filter(s => s.isPlaying))

  const toggleSound = (soundId: string) => {
    const sound = state.sounds.find(s => s.id === soundId)
    if (sound) {
      sound.isPlaying = !sound.isPlaying
      updatePlayingState()
    }
  }

  const setVolume = (soundId: string, volume: number) => {
    const sound = state.sounds.find(s => s.id === soundId)
    if (sound) {
      sound.volume = Math.max(0, Math.min(1, volume))
    }
  }

  const setMasterVolume = (volume: number) => {
    state.masterVolume = Math.max(0, Math.min(1, volume))
  }

  const updatePlayingState = () => {
    state.isPlaying = state.sounds.some(s => s.isPlaying)
  }

  const stopAll = () => {
    state.sounds.forEach(s => {
      s.isPlaying = false
    })
    state.isPlaying = false
    clearTimer()
  }

  const setTimer = (minutes: number) => {
    clearTimer()
    if (minutes > 0) {
      state.timer = minutes
      timerRemaining.value = minutes * 60
      timerInterval = window.setInterval(() => {
        timerRemaining.value--
        if (timerRemaining.value <= 0) {
          stopAll()
        }
      }, 1000)
    } else {
      state.timer = null
    }
  }

  const clearTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    state.timer = null
    timerRemaining.value = 0
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return {
    state,
    timerRemaining,
    timerPresets,
    activeSounds,
    toggleSound,
    setVolume,
    setMasterVolume,
    stopAll,
    setTimer,
    clearTimer,
    formatTime
  }
}
