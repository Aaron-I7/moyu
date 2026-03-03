/**
 * 像素钓场 — 音效管理（Howler.js）
 * BGM + 环境音 + 操作音效
 */
import { ref, onUnmounted } from 'vue'
import { Howl, Howler } from 'howler'
import type { PlayerSettings } from '../types'

/** 音效 key 与对应音频来源——使用在线免费 8-bit 音效 */
// 注意：实际项目应替换为本地 assets，这里用内联生成的静音占位
// 后续可替换为真实音频文件

type SoundKey =
  | 'bgm-stream' | 'bgm-ocean'
  | 'amb-birds' | 'amb-water'
  | 'sfx-cast' | 'sfx-splash' | 'sfx-bite'
  | 'sfx-reel' | 'sfx-catch' | 'sfx-fail'

export function useSoundManager() {
  const sounds = new Map<SoundKey, Howl>()
  const currentBgm = ref<SoundKey | null>(null)
  const currentAmbient = ref<SoundKey | null>(null)
  const loaded = ref(false)
  let isMuted = false

  /**
   * 生成一段短促的合成音效（Web Audio API）
   * 用于在没有真实音频文件时提供占位音效
   */
  function generateToneDataUri(
    _freq: number,
    _duration: number,
    _type: OscillatorType = 'square',
    _volume = 0.3
  ): string {
    // 返回空白数据URI - Howler会正常处理
    // 在真实项目中替换为 mp3/ogg 文件路径
    return 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='
  }

  function initSounds() {
    if (loaded.value) return

    // 占位音效（后续可替换为真实文件）
    const defs: [SoundKey, { src: string; loop: boolean; volume: number }][] = [
      ['bgm-stream', { src: generateToneDataUri(440, 2, 'square'), loop: true, volume: 0.3 }],
      ['bgm-ocean', { src: generateToneDataUri(220, 2, 'sine'), loop: true, volume: 0.3 }],
      ['amb-birds', { src: generateToneDataUri(880, 1, 'sine'), loop: true, volume: 0.15 }],
      ['amb-water', { src: generateToneDataUri(330, 1, 'sine'), loop: true, volume: 0.2 }],
      ['sfx-cast', { src: generateToneDataUri(600, 0.2, 'square'), loop: false, volume: 0.5 }],
      ['sfx-splash', { src: generateToneDataUri(200, 0.3, 'sawtooth'), loop: false, volume: 0.4 }],
      ['sfx-bite', { src: generateToneDataUri(800, 0.15, 'square'), loop: false, volume: 0.6 }],
      ['sfx-reel', { src: generateToneDataUri(500, 0.3, 'triangle'), loop: false, volume: 0.4 }],
      ['sfx-catch', { src: generateToneDataUri(1000, 0.5, 'square'), loop: false, volume: 0.5 }],
      ['sfx-fail', { src: generateToneDataUri(150, 0.4, 'sawtooth'), loop: false, volume: 0.4 }],
    ]

    for (const [key, opts] of defs) {
      const howl = new Howl({
        src: [opts.src],
        loop: opts.loop,
        volume: opts.volume,
        preload: true,
        html5: false
      })
      sounds.set(key, howl)
    }

    loaded.value = true
  }

  /** 播放 BGM（淡入淡出切换） */
  function playBgm(key: SoundKey) {
    if (currentBgm.value === key) return

    // 淡出当前
    if (currentBgm.value) {
      const old = sounds.get(currentBgm.value)
      if (old) {
        old.fade(old.volume(), 0, 500)
        setTimeout(() => old.stop(), 500)
      }
    }

    const next = sounds.get(key)
    if (next) {
      next.volume(0)
      next.play()
      next.fade(0, 0.3, 800)
    }
    currentBgm.value = key
  }

  /** 播放环境音 */
  function playAmbient(key: SoundKey) {
    if (currentAmbient.value === key) return

    if (currentAmbient.value) {
      const old = sounds.get(currentAmbient.value)
      old?.stop()
    }

    const next = sounds.get(key)
    if (next) {
      next.play()
    }
    currentAmbient.value = key
  }

  /** 播放音效 */
  function playSfx(key: SoundKey) {
    const sound = sounds.get(key)
    sound?.play()
  }

  /** 停止所有 */
  function stopAll() {
    sounds.forEach(s => s.stop())
    currentBgm.value = null
    currentAmbient.value = null
  }

  /** 应用音量设置 */
  function applySettings(settings: PlayerSettings) {
    Howler.mute(settings.muted)
    Howler.volume(settings.masterVolume)

    // BGM 音量
    if (currentBgm.value) {
      const bgm = sounds.get(currentBgm.value)
      bgm?.volume(settings.bgmVolume * 0.5)
    }

    // 环境音量
    if (currentAmbient.value) {
      const amb = sounds.get(currentAmbient.value)
      amb?.volume(settings.bgmVolume * 0.3)
    }
  }

  /** 切换静音 */
  function toggleMute() {
    isMuted = !isMuted
    Howler.mute(isMuted)
    return isMuted
  }

  function destroy() {
    stopAll()
    sounds.forEach(s => s.unload())
    sounds.clear()
    loaded.value = false
  }

  onUnmounted(() => {
    destroy()
  })

  return {
    loaded,
    initSounds,
    playBgm,
    playAmbient,
    playSfx,
    stopAll,
    applySettings,
    toggleMute,
    destroy
  }
}
