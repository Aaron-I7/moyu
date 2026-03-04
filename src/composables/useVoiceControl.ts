import { ref } from 'vue'
import type { Router } from 'vue-router'
import { getStoredLocale } from '@/core/i18n'

type SpeechRecognitionCtor = new () => BasicSpeechRecognition

interface BasicSpeechRecognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

const commandMap: Record<string, string> = {
  home: '/',
  games: '/games',
  tools: '/tools',
  reading: '/reading',
  recharge: '/relax',
  首页: '/',
  游戏: '/games',
  工具: '/tools',
  阅读: '/reading',
  休闲: '/relax'
}

export function useVoiceControl(router: Router) {
  const locale = getStoredLocale()
  const isListening = ref(false)
  const supported = ref(false)

  let recognition: BasicSpeechRecognition | null = null

  function initRecognition(): BasicSpeechRecognition | null {
    const ctor = ((window as Window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition
      || (window as Window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition) as SpeechRecognitionCtor | undefined
    if (!ctor) {
      supported.value = false
      return null
    }
    supported.value = true
    const instance = new ctor()
    instance.lang = locale
    instance.continuous = true
    instance.interimResults = false
    instance.onresult = event => {
      const latest = event.results[event.results.length - 1]
      const transcript = latest?.[0]?.transcript
      if (!transcript) {
        return
      }
      const text = transcript.trim().toLowerCase()
      const route = commandMap[text]
      if (route) {
        router.push(route)
      }
    }
    instance.onend = () => {
      if (isListening.value) {
        instance.start()
      }
    }
    return instance
  }

  function toggleListening(): void {
    if (!recognition) {
      recognition = initRecognition()
    }
    if (!recognition) {
      return
    }
    if (isListening.value) {
      isListening.value = false
      recognition.stop()
      return
    }
    isListening.value = true
    recognition.start()
  }

  return {
    supported,
    isListening,
    toggleListening
  }
}
