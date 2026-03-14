import { computed, ref } from 'vue'
import type { ComposerTranslation } from 'vue-i18n'
import type { ProcessState } from '../types'

export function useTextDedupe(t: ComposerTranslation) {
  const sourceText = ref('')
  const resultText = ref('')
  const state = ref<Exclude<ProcessState, 'error'>>('idle')
  const notice = ref('')

  const options = ref({
    trimLine: true,
    ignoreCase: false,
    removeEmpty: true
  })

  const stats = computed(() => {
    const before = sourceText.value ? sourceText.value.replace(/\r\n/g, '\n').split('\n').length : 0
    const after = resultText.value ? resultText.value.replace(/\r\n/g, '\n').split('\n').length : 0
    return { before, after, removed: Math.max(0, before - after) }
  })

  function run() {
    if (!sourceText.value.trim()) {
      state.value = 'empty'
      resultText.value = ''
      notice.value = t('tools.textDedupe.empty')
      return
    }
    state.value = 'processing'
    const lines = sourceText.value.replace(/\r\n/g, '\n').split('\n')
    const normalized = options.value.trimLine ? lines.map((line) => line.trim()) : lines
    const filtered = options.value.removeEmpty ? normalized.filter((line) => line.length > 0) : normalized
    const set = new Set<string>()
    const output: string[] = []
    for (const line of filtered) {
      const key = options.value.ignoreCase ? line.toLowerCase() : line
      if (set.has(key)) continue
      set.add(key)
      output.push(line)
    }
    resultText.value = output.join('\n')
    state.value = 'success'
    notice.value = t('tools.textDedupe.done', stats.value)
  }

  function reset() {
    sourceText.value = ''
    resultText.value = ''
    state.value = 'idle'
    notice.value = ''
    options.value = {
      trimLine: true,
      ignoreCase: false,
      removeEmpty: true
    }
  }

  async function copyResult() {
    if (!resultText.value.trim()) return
    try {
      await navigator.clipboard.writeText(resultText.value)
      notice.value = t('tools.textDedupe.copied')
    } catch {
      notice.value = t('tools.textDedupe.copyFailed')
    }
  }

  function downloadResult() {
    if (!resultText.value.trim()) return
    const blob = new Blob([resultText.value], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `text-dedupe-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    sourceText,
    resultText,
    state,
    notice,
    options,
    stats,
    run,
    reset,
    copyResult,
    downloadResult
  }
}
