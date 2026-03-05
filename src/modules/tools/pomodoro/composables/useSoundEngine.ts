import { reactive, watch, ref } from 'vue'
import { Howl } from 'howler'
import { PRESET_SOUNDS, type SoundItem, type SoundMix } from '../types'

const MIXES_KEY = 'moyu-pomodoro-mixes'

// Global State
const sounds = reactive<SoundItem[]>(PRESET_SOUNDS.map(s => ({ ...s })))
const howls: Record<string, Howl> = {}
const savedMixes = ref<SoundMix[]>([])
const isGlobalMixerOpen = ref(false)

// Load mixes on init
try {
  const saved = localStorage.getItem(MIXES_KEY)
  if (saved) {
    savedMixes.value = JSON.parse(saved)
  }
} catch (e) {
  console.error('Failed to load sound mixes', e)
}

// 监听音量变化
watch(sounds, () => {
  // 可以在这里处理持久化
}, { deep: true })

export function useSoundEngine() {
  
  // 初始化音频实例
  function initSound(sound: SoundItem): Howl {
    if (howls[sound.id]) return howls[sound.id] as Howl

    const howl = new Howl({
      src: [sound.src],
      loop: true,
      volume: sound.volume, // 初始直接使用设定音量，由外部控制 fade
      preload: true,
      html5: true, // 强制使用 HTML5 Audio 以支持流式播放
      onloaderror: (_id, error) => {
        console.error(`Failed to load sound ${sound.id}:`, error)
      },
      onplayerror: (_id, error) => {
        console.error(`Failed to play sound ${sound.id}:`, error)
        howls[sound.id]?.once('unlock', function() {
          howls[sound.id]?.play()
        })
      }
    })
    howls[sound.id] = howl
    return howl
  }

  // 播放/停止控制
  function toggleSound(id: string) {
    const sound = sounds.find(s => s.id === id)
    if (!sound) return

    sound.active = !sound.active
    
    // 如果激活，初始化并淡入
    if (sound.active) {
      const howl = howls[id] || initSound(sound)
      if (!howl.playing()) {
        howl.volume(0)
        howl.play()
        howl.fade(0, sound.volume, 1000)
      }
    } else {
      // 如果关闭，淡出并暂停
      const howl = howls[id]
      if (howl && howl.playing()) {
        howl.fade(howl.volume(), 0, 1000)
        // 使用 setTimeout 在淡出后暂停，注意这里不清除实例
        setTimeout(() => {
          if (!sound.active) howl.pause()
        }, 1000)
      }
    }
  }

  // 音量控制
  function setVolume(id: string, vol: number) {
    const sound = sounds.find(s => s.id === id)
    if (!sound) return
    
    sound.volume = vol
    const howl = howls[id]
    // 只有在播放且激活状态下才实时调整音量
    if (sound.active && howl && howl.playing()) {
      howl.volume(vol)
    }
  }

  // 淡入所有激活的声音 (开始专注时)
  function fadeInAll() {
    sounds.forEach(sound => {
      if (sound.active) {
        const howl = howls[sound.id] || initSound(sound)
        if (!howl.playing()) {
          howl.volume(0)
          howl.play()
          howl.fade(0, sound.volume, 2000)
        } else {
          // 如果已经在播放（可能被暂停了），恢复音量
          howl.fade(howl.volume(), sound.volume, 2000)
        }
      }
    })
  }

  // 淡出所有声音 (暂停/休息时)
  function fadeOutAll() {
    sounds.forEach(sound => {
      const howl = howls[sound.id]
      if (sound.active && howl && howl.playing()) {
        howl.fade(howl.volume(), 0, 2000)
        setTimeout(() => {
          // 不真正停止，只是静音或暂停，保持 active 状态以便下次恢复
          howl.pause()
        }, 2000)
      }
    })
  }

  function stopAll(deactivate = false) {
    Object.keys(howls).forEach(key => {
      if (howls[key]) {
        howls[key].stop()
        howls[key].unload()
      }
      delete howls[key]
    })

    if (deactivate) {
      sounds.forEach(s => s.active = false)
    }
  }

  // Mix Management
  function saveMix(name: string) {
    const activeSounds = sounds.filter(s => s.active).map(s => ({
      id: s.id,
      volume: s.volume
    }))
    
    if (activeSounds.length === 0) return

    const newMix: SoundMix = {
      id: crypto.randomUUID(),
      name,
      sounds: activeSounds
    }

    savedMixes.value.push(newMix)
    saveMixesToStorage()
  }

  function loadMix(mixId: string) {
    const mix = savedMixes.value.find(m => m.id === mixId)
    if (!mix) return

    // Stop all sounds that are NOT in the mix
    sounds.forEach(s => {
      const inMix = mix.sounds.some(ms => ms.id === s.id)
      if (s.active && !inMix) {
        toggleSound(s.id) // Will set active=false and fade out
      }
    })

    // Start/Update sounds that ARE in the mix
    mix.sounds.forEach(ms => {
      const sound = sounds.find(s => s.id === ms.id)
      if (sound) {
        sound.volume = ms.volume // Update volume first
        // If not active, activate it
        if (!sound.active) {
           toggleSound(sound.id)
        } else {
           // If already active, ensure volume is updated in Howler (setVolume does this)
           setVolume(sound.id, ms.volume)
        }
      }
    })
  }

  function deleteMix(id: string) {
    savedMixes.value = savedMixes.value.filter(m => m.id !== id)
    saveMixesToStorage()
  }

  function saveMixesToStorage() {
    localStorage.setItem(MIXES_KEY, JSON.stringify(savedMixes.value))
  }

  return {
    sounds,
    savedMixes,
    isGlobalMixerOpen,
    toggleSound,
    setVolume,
    fadeInAll,
    fadeOutAll,
    stopAll,
    saveMix,
    loadMix,
    deleteMix
  }
}
