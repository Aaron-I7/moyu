import { ref } from 'vue'
import type { ComposerTranslation } from 'vue-i18n'
import type { ProcessState } from '../types'

type Base64Mode = 'encode' | 'decode'

export function useTextBase64(t: ComposerTranslation) {
  const sourceText = ref('')
  const resultText = ref('')
  const state = ref<ProcessState>('idle')
  const notice = ref('')
  const mode = ref<Base64Mode>('encode')
  const options = ref({
    urlSafe: false,
    stripPadding: false
  })

  function normalizeBase64(input: string) {
    let next = input.trim()
    if (options.value.urlSafe) {
      next = next.replace(/-/g, '+').replace(/_/g, '/')
    }
    if (next.length % 4) {
      next += '='.repeat(4 - (next.length % 4))
    }
    return next
  }

  function encodeBase64(input: string) {
    const bytes = new TextEncoder().encode(input)
    let binary = ''
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte)
    })
    let encoded = btoa(binary)
    if (options.value.urlSafe) {
      encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_')
    }
    if (options.value.stripPadding) {
      encoded = encoded.replace(/=+$/g, '')
    }
    return encoded
  }

  function decodeBase64(input: string) {
    const normalized = normalizeBase64(input)
    const binary = atob(normalized)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  }

  function run() {
    if (!sourceText.value.trim()) {
      state.value = 'empty'
      resultText.value = ''
      notice.value = t('tools.textBase64.empty')
      return
    }
    state.value = 'processing'
    try {
      const next = mode.value === 'encode' ? encodeBase64(sourceText.value) : decodeBase64(sourceText.value)
      resultText.value = next
      state.value = 'success'
      notice.value = t('tools.textBase64.done', { chars: next.length })
    } catch {
      state.value = 'error'
      resultText.value = ''
      notice.value = t('tools.textBase64.error')
    }
  }

  function reset() {
    sourceText.value = ''
    resultText.value = ''
    state.value = 'idle'
    notice.value = ''
    mode.value = 'encode'
    options.value = {
      urlSafe: false,
      stripPadding: false
    }
  }

  async function copyResult() {
    if (!resultText.value.trim()) return
    try {
      await navigator.clipboard.writeText(resultText.value)
      notice.value = t('tools.textBase64.copied')
    } catch {
      notice.value = t('tools.textBase64.copyFailed')
    }
  }

  function downloadResult() {
    if (!resultText.value.trim()) return
    const blob = new Blob([resultText.value], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `text-base64-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    sourceText,
    resultText,
    state,
    notice,
    mode,
    options,
    run,
    reset,
    copyResult,
    downloadResult
  }
}
