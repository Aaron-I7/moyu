import { reactive, ref, computed } from 'vue'
import { Howl } from 'howler'
import { PRESET_SOUNDS, type SoundItem, type SoundMix } from '../types'
import { useCloudSync } from '@/composables/useCloudSync'

const MIXES_KEY = 'moyu-pomodoro-mixes'
const FAVORITES_KEY = 'favoriteSounds'
const MAX_FAVORITE_COUNT = 10

// Global State
const sounds = reactive<SoundItem[]>(PRESET_SOUNDS.map(s => ({ ...s })))
const howls: Record<string, Howl> = {}
const savedMixes = ref<SoundMix[]>([])
const isGlobalMixerOpen = ref(false)
const isPlaying = computed(() => sounds.some(s => s.active))
const isActuallyPlaying = computed(() => sounds.some(s => s.active && (howls[s.id]?.playing() ?? false)))
type FavoriteMix = SoundMix & { createdAt: number; fingerprint: string }
const favoriteMixes = ref<FavoriteMix[]>([])

function normalizeMixSounds(input: { id: string; volume: number }[]) {
  const validIds = new Set(PRESET_SOUNDS.map(s => s.id))
  return input
    .filter(s => validIds.has(s.id))
    .map(s => ({ id: s.id, volume: Math.max(0, Math.min(1, Number(s.volume.toFixed(2)))) }))
    .sort((a, b) => a.id.localeCompare(b.id))
}

function createFingerprint(input: { id: string; volume: number }[]) {
  return normalizeMixSounds(input).map(s => `${s.id}:${s.volume}`).join('|')
}

function normalizeFavoriteMix(raw: any): FavoriteMix | null {
  if (!raw) return null
  const sounds = normalizeMixSounds(Array.isArray(raw.sounds) ? raw.sounds : [])
  if (sounds.length === 0) return null
  const createdAt = typeof raw.createdAt === 'number' ? raw.createdAt : Date.now()
  return {
    id: typeof raw.id === 'string' ? raw.id : crypto.randomUUID(),
    name: typeof raw.name === 'string' ? raw.name : '',
    sounds,
    createdAt,
    fingerprint: typeof raw.fingerprint === 'string' && raw.fingerprint
      ? raw.fingerprint
      : createFingerprint(sounds)
  }
}

function dedupeFavorites(input: FavoriteMix[]) {
  const map = new Map<string, FavoriteMix>()
  input
    .sort((a, b) => b.createdAt - a.createdAt)
    .forEach(item => {
      if (!map.has(item.fingerprint)) {
        map.set(item.fingerprint, item)
      }
    })
  return Array.from(map.values()).slice(0, MAX_FAVORITE_COUNT)
}

// Load mixes on init
try {
  const saved = localStorage.getItem(MIXES_KEY)
  if (saved) {
    savedMixes.value = JSON.parse(saved)
  }
} catch (e) {
  console.error('Failed to load sound mixes', e)
}

try {
  const saved = localStorage.getItem(FAVORITES_KEY)
  if (saved) {
    const parsed = JSON.parse(saved)
    favoriteMixes.value = dedupeFavorites(
      (Array.isArray(parsed) ? parsed : [])
        .map(normalizeFavoriteMix)
        .filter((item): item is FavoriteMix => !!item)
    )
  }
} catch (e) {
  console.error('Failed to load favorite mixes', e)
}

function getSelectedMixFromState() {
  return normalizeMixSounds(
    sounds
      .filter(s => s.active)
      .map(s => ({ id: s.id, volume: s.volume }))
  )
}

export function useSoundEngine() {
  const { pushData } = useCloudSync()

  function getActiveMixSounds() {
    return getSelectedMixFromState()
  }

  function applyMixSounds(mixSounds: { id: string; volume: number }[]) {
    const next = normalizeMixSounds(mixSounds)

    sounds.forEach(s => {
      const inNext = next.some(ms => ms.id === s.id)
      if (s.active && !inNext) {
        s.active = false
        const howl = howls[s.id]
        if (howl) {
          howl.pause()
        }
      }
    })

    next.forEach(ms => {
      const sound = sounds.find(s => s.id === ms.id)
      if (!sound) return
      sound.volume = ms.volume
      sound.active = true
      const howl = howls[sound.id] || initSound(sound)
      if (!howl.playing()) {
        howl.volume(sound.volume)
        howl.play()
      } else {
        howl.volume(sound.volume)
      }
    })
  }

  function saveFavoriteMixesToStorage() {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteMixes.value))
    pushData(FAVORITES_KEY, favoriteMixes.value)
  }

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
      onplayerror: (_id: any, error: any) => {
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
    
    if (sound.active) {
      const howl = howls[id] || initSound(sound)
      if (!howl.playing()) {
        howl.volume(sound.volume)
        howl.play()
      }
    } else {
      const howl = howls[id]
      if (howl) {
        howl.pause()
      }
    }
  }

  // 音量控制
  function setVolume(id: string, vol: number) {
    const sound = sounds.find(s => s.id === id)
    if (!sound) return
    
    sound.volume = vol
    const howl = howls[id]
    if (sound.active && howl && howl.playing()) {
      howl.volume(vol)
    }
  }

  // 恢复播放所有激活的声音
  function fadeInAll() {
    sounds.forEach(sound => {
      if (sound.active) {
        const howl = howls[sound.id] || initSound(sound)
        if (!howl.playing()) {
          howl.volume(sound.volume)
          howl.play()
        }
      }
    })
  }

  // 暂停所有声音
  function fadeOutAll() {
    sounds.forEach(sound => {
      const howl = howls[sound.id]
      if (howl && howl.playing()) {
        howl.pause()
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
    applyMixSounds(mix.sounds)
  }

  function deleteMix(id: string) {
    savedMixes.value = savedMixes.value.filter(m => m.id !== id)
    saveMixesToStorage()
  }

  function saveMixesToStorage() {
    localStorage.setItem(MIXES_KEY, JSON.stringify(savedMixes.value))
    pushData('moyu-pomodoro-mixes', savedMixes.value)
  }

  function toggleFavoriteCurrentMix() {
    const mixSounds = getActiveMixSounds()
    if (mixSounds.length === 0) return
    const fingerprint = createFingerprint(mixSounds)
    const existing = favoriteMixes.value.find(m => m.fingerprint === fingerprint)
    if (existing) {
      favoriteMixes.value = favoriteMixes.value.filter(m => m.id !== existing.id)
      saveFavoriteMixesToStorage()
      return
    }

    const createdAt = Date.now()
    const mix: FavoriteMix = {
      id: crypto.randomUUID(),
      name: '',
      sounds: mixSounds,
      createdAt,
      fingerprint
    }
    favoriteMixes.value = dedupeFavorites([mix, ...favoriteMixes.value])
    saveFavoriteMixesToStorage()
  }

  function loadFavoriteMix(id: string) {
    const mix = favoriteMixes.value.find(m => m.id === id)
    if (!mix) return
    applyMixSounds(mix.sounds)
  }

  function deleteFavoriteMix(id: string) {
    favoriteMixes.value = favoriteMixes.value.filter(m => m.id !== id)
    saveFavoriteMixesToStorage()
  }

  function replaceFavoriteMixes(input: unknown) {
    const normalized = dedupeFavorites(
      (Array.isArray(input) ? input : [])
        .map(normalizeFavoriteMix)
        .filter((item): item is FavoriteMix => !!item)
    )
    favoriteMixes.value = normalized
    saveFavoriteMixesToStorage()
  }

  function playRandomSounds(count: number) {
    const allSounds = [...sounds]
    if (allSounds.length === 0) return
    
    const actualCount = Math.min(count, allSounds.length, 5)
    stopAll(true)
    
    const shuffled = allSounds.sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, actualCount)
    
    selected.forEach(sound => {
      sound.active = true
      const howl = howls[sound.id] || initSound(sound)
      howl.volume(sound.volume)
      howl.play()
    })
  }

  return {
    sounds,
    savedMixes,
    favoriteMixes,
    isGlobalMixerOpen,
    toggleSound,
    setVolume,
    fadeInAll,
    fadeOutAll,
    stopAll,
    saveMix,
    loadMix,
    deleteMix,
    isPlaying,
    isActuallyPlaying,
    toggleFavoriteCurrentMix,
    loadFavoriteMix,
    deleteFavoriteMix,
    createFingerprint,
    getActiveMixSounds,
    replaceFavoriteMixes,
    playRandomSounds
  }
}
