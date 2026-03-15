import { ref } from 'vue'
import type { ComposerTranslation } from 'vue-i18n'
import type { ProcessState } from '../types'

type UrlMode = 'encodeUri' | 'encodeUriComponent' | 'decodeUri' | 'decodeUriComponent'

export function useTextUrlCodec(t: ComposerTranslation) {
  const sourceText = ref('')
  const resultText = ref('')
  const state = ref<ProcessState>('idle')
  const notice = ref('')
  const mode = ref<UrlMode>('encodeUriComponent')

  function run() {
    if (!sourceText.value.trim()) {
      state.value = 'empty'
      resultText.value = ''
      notice.value = t('tools.textUrlCodec.empty')
      return
    }
    state.value = 'processing'
    try {
      let next = ''
      if (mode.value === 'encodeUri') {
        next = encodeURI(sourceText.value)
      } else if (mode.value === 'encodeUriComponent') {
        next = encodeURIComponent(sourceText.value)
      } else if (mode.value === 'decodeUri') {
        next = decodeURI(sourceText.value)
      } else {
        next = decodeURIComponent(sourceText.value)
      }
      resultText.value = next
      state.value = 'success'
      notice.value = t('tools.textUrlCodec.done', { chars: next.length })
    } catch {
      state.value = 'error'
      resultText.value = ''
      notice.value = t('tools.textUrlCodec.error')
    }
  }

  function reset() {
    sourceText.value = ''
    resultText.value = ''
    state.value = 'idle'
    notice.value = ''
    mode.value = 'encodeUriComponent'
  }

  async function copyResult() {
    if (!resultText.value.trim()) return
    try {
      await navigator.clipboard.writeText(resultText.value)
      notice.value = t('tools.textUrlCodec.copied')
    } catch {
      notice.value = t('tools.textUrlCodec.copyFailed')
    }
  }

  function downloadResult() {
    if (!resultText.value.trim()) return
    const blob = new Blob([resultText.value], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `text-url-codec-${Date.now()}.txt`
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
