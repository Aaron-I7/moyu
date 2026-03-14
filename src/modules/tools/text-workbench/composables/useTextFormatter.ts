import { computed, ref } from 'vue'
import type { ComposerTranslation } from 'vue-i18n'
import type { ProcessState } from '../types'

export function useTextFormatter(t: ComposerTranslation) {
  const sourceText = ref('')
  const resultText = ref('')
  const state = ref<Exclude<ProcessState, 'error'>>('idle')
  const notice = ref('')

  const options = ref({
    trimLine: true,
    collapseBlankLines: true,
    normalizePunctuation: false,
    toUppercase: false,
    toLowercase: false
  })

  const lineStats = computed(() => {
    const sourceLines = sourceText.value.replace(/\r\n/g, '\n').split('\n').length
    const resultLines = resultText.value ? resultText.value.replace(/\r\n/g, '\n').split('\n').length : 0
    return { sourceLines, resultLines }
  })

  function normalizePunctuation(text: string) {
    return text
      .replace(/，/g, ', ')
      .replace(/。/g, '. ')
      .replace(/；/g, '; ')
      .replace(/：/g, ': ')
      .replace(/！/g, '! ')
      .replace(/？/g, '? ')
      .replace(/\s{2,}/g, ' ')
  }

  function run() {
    if (!sourceText.value.trim()) {
      state.value = 'empty'
      resultText.value = ''
      notice.value = t('tools.textFormatter.empty')
      return
    }
    state.value = 'processing'
    let next = sourceText.value.replace(/\r\n/g, '\n')
    if (options.value.trimLine) {
      next = next
        .split('\n')
        .map((line) => line.trim())
        .join('\n')
    }
    if (options.value.collapseBlankLines) {
      next = next.replace(/\n{3,}/g, '\n\n')
    }
    if (options.value.normalizePunctuation) {
      next = normalizePunctuation(next)
    }
    if (options.value.toUppercase && !options.value.toLowercase) {
      next = next.toUpperCase()
    }
    if (options.value.toLowercase && !options.value.toUppercase) {
      next = next.toLowerCase()
    }
    resultText.value = next
    state.value = 'success'
    notice.value = t('tools.textFormatter.done', { lines: lineStats.value.resultLines })
  }

  function reset() {
    sourceText.value = ''
    resultText.value = ''
    state.value = 'idle'
    notice.value = ''
    options.value = {
      trimLine: true,
      collapseBlankLines: true,
      normalizePunctuation: false,
      toUppercase: false,
      toLowercase: false
    }
  }

  async function copyResult() {
    if (!resultText.value.trim()) return
    try {
      await navigator.clipboard.writeText(resultText.value)
      notice.value = t('tools.textFormatter.copied')
    } catch {
      notice.value = t('tools.textFormatter.copyFailed')
    }
  }

  function downloadResult() {
    if (!resultText.value.trim()) return
    const blob = new Blob([resultText.value], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `text-formatter-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    sourceText,
    resultText,
    state,
    notice,
    options,
    lineStats,
    run,
    reset,
    copyResult,
    downloadResult
  }
}
