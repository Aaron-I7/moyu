import { reactive, ref, onUnmounted, onMounted } from 'vue'
import type { WoodenFishState, FloatingText } from '../types'
import { meritTexts } from '../types'
import knockSound from '@/assets/media/wooden-fish/sound.mp3'
import { i18n } from '@/core/i18n'

export function useWoodenFish() {
  const state = reactive<WoodenFishState>({
    count: 0,
    merit: 0,
    autoMode: false,
    autoSpeed: 200,
    soundEnabled: true,
    vibrationEnabled: true
  })

  const floatingTexts = ref<FloatingText[]>([])
  let textId = 0
  let autoInterval: number | null = null
  let audioElement: HTMLAudioElement | null = null

  const initAudio = () => {
    if (!audioElement) {
      audioElement = new Audio(knockSound)
      audioElement.volume = 0.8
    }
    return audioElement
  }

  const playKnockSound = () => {
    if (!state.soundEnabled) return

    try {
      const audio = initAudio()
      audio.currentTime = 0
      audio.play().catch(e => {
        console.warn('Audio playback failed:', e)
      })
    } catch (e) {
      console.warn('Audio playback failed:', e)
    }
  }

  const triggerVibration = () => {
    if (!state.vibrationEnabled) return
    if (navigator.vibrate) {
      navigator.vibrate(30)
    }
  }

  const addFloatingText = (x: number, y: number) => {
    const englishTexts = ['Merit +1', 'Calm mind', 'Steady breath', 'Stay gentle', 'Kind focus', 'Flow state', 'Good vibes', 'Peaceful reset']
    const textPool = (i18n.global.locale as any).value === 'en' ? englishTexts : meritTexts
    const randomText = textPool[Math.floor(Math.random() * textPool.length)] || ((i18n.global.locale as any).value === 'en' ? 'Merit +1' : '功德 +1')
    const id = ++textId
    
    floatingTexts.value.push({
      id,
      text: randomText,
      x: x + (Math.random() - 0.5) * 60,
      y: y - 20
    })

    setTimeout(() => {
      floatingTexts.value = floatingTexts.value.filter(t => t.id !== id)
    }, 1500)
  }

  const knock = (event?: MouseEvent | TouchEvent) => {
    state.count++
    state.merit++

    playKnockSound()
    triggerVibration()

    if (event) {
      const clientX = 'touches' in event ? event.touches[0]?.clientX ?? 0 : event.clientX
      const clientY = 'touches' in event ? event.touches[0]?.clientY ?? 0 : event.clientY
      addFloatingText(clientX, clientY)
    }
  }

  const toggleAutoMode = () => {
    state.autoMode = !state.autoMode

    if (state.autoMode) {
      autoInterval = window.setInterval(() => {
        knock()
      }, state.autoSpeed)
    } else {
      if (autoInterval) {
        clearInterval(autoInterval)
        autoInterval = null
      }
    }
  }

  const setAutoSpeed = (speed: number) => {
    state.autoSpeed = Math.max(50, Math.min(1000, speed))
    
    if (state.autoMode && autoInterval) {
      clearInterval(autoInterval)
      autoInterval = window.setInterval(() => {
        knock()
      }, state.autoSpeed)
    }
  }

  const toggleSound = () => {
    state.soundEnabled = !state.soundEnabled
  }

  const toggleVibration = () => {
    state.vibrationEnabled = !state.vibrationEnabled
  }

  const resetCount = () => {
    state.count = 0
    state.merit = 0
  }

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault()
      knock()
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
    initAudio()
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
    if (autoInterval) {
      clearInterval(autoInterval)
    }
  })

  return {
    state,
    floatingTexts,
    knock,
    toggleAutoMode,
    setAutoSpeed,
    toggleSound,
    toggleVibration,
    resetCount
  }
}
