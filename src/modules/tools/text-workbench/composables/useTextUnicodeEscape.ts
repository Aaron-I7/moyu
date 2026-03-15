import { ref } from 'vue'
import type { ComposerTranslation } from 'vue-i18n'
import type { ProcessState } from '../types'

type UnicodeMode = 'unicodeEscape' | 'unicodeUnescape' | 'jsonEscape' | 'jsonUnescape'

export function useTextUnicodeEscape(t: ComposerTranslation) {
  const sourceText = ref('')
  const resultText = ref('')
  const state = ref<ProcessState>('idle')
  const notice = ref('')
  const mode = ref<UnicodeMode>('unicodeEscape')

  function toUnicodeEscape(input: string) {
    return Array.from(input)
      .map((char) => {
        const code = char.codePointAt(0) ?? 0
        if (code <= 0xffff) {
          return `\\u${code.toString(16).padStart(4, '0')}`
        }
        return JSON.stringify(char).slice(1, -1)
      })
      .join('')
  }

  function fromUnicodeEscape(input: string) {
    return input
      .replace(/\\u([\da-fA-F]{4})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/\\x([\da-fA-F]{2})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
  }

  function toJsonEscape(input: string) {
    return JSON.stringify(input).slice(1, -1)
  }

  function fromJsonEscape(input: string) {
    const safe = input.replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/"/g, '\\"')
    return JSON.parse(`"${safe}"`) as string
  }

  function run() {
    if (!sourceText.value.trim()) {
      state.value = 'empty'
      resultText.value = ''
      notice.value = t('tools.textUnicodeEscape.empty')
      return
    }
    state.value = 'processing'
    try {
      let next = ''
      if (mode.value === 'unicodeEscape') {
        next = toUnicodeEscape(sourceText.value)
      } else if (mode.value === 'unicodeUnescape') {
        next = fromUnicodeEscape(sourceText.value)
      } else if (mode.value === 'jsonEscape') {
        next = toJsonEscape(sourceText.value)
      } else {
        next = fromJsonEscape(sourceText.value)
      }
      resultText.value = next
      state.value = 'success'
      notice.value = t('tools.textUnicodeEscape.done', { chars: next.length })
    } catch {
      state.value = 'error'
      resultText.value = ''
      notice.value = t('tools.textUnicodeEscape.error')
    }
  }

  function reset() {
    sourceText.value = ''
    resultText.value = ''
    state.value = 'idle'
    notice.value = ''
    mode.value = 'unicodeEscape'
  }

  async function copyResult() {
    if (!resultText.value.trim()) return
    try {
      await navigator.clipboard.writeText(resultText.value)
      notice.value = t('tools.textUnicodeEscape.copied')
    } catch {
      notice.value = t('tools.textUnicodeEscape.copyFailed')
    }
  }

  function downloadResult() {
    if (!resultText.value.trim()) return
    const blob = new Blob([resultText.value], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `text-unicode-escape-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    sourceText,
    resultText,
    state,
    notice,
    mode,
    run,
    reset,
    copyResult,
    downloadResult
  }
}
