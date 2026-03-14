import { ref } from 'vue'
import type { ComposerTranslation } from 'vue-i18n'
import type { ProcessState } from '../types'

export function useTextBatchReplace(t: ComposerTranslation) {
  const sourceText = ref('')
  const rulesText = ref('')
  const resultText = ref('')
  const state = ref<ProcessState>('idle')
  const notice = ref('')

  const options = ref({
    useRegex: false,
    ignoreCase: false
  })

  function parseReplaceRules(text: string) {
    return text
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const idx = line.indexOf('=>')
        if (idx < 0) return null
        const from = line.slice(0, idx).trim()
        const to = line.slice(idx + 2).trim()
        if (!from) return null
        return { from, to }
      })
      .filter((rule): rule is { from: string; to: string } => Boolean(rule))
  }

  function escapeRegex(text: string) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  function run() {
    if (!sourceText.value.trim()) {
      state.value = 'empty'
      resultText.value = ''
      notice.value = t('tools.textBatchReplace.empty')
      return
    }
    const rules = parseReplaceRules(rulesText.value)
    if (rules.length === 0) {
      state.value = 'empty'
      resultText.value = ''
      notice.value = t('tools.textBatchReplace.rulesEmpty')
      return
    }

    state.value = 'processing'
    let next = sourceText.value
    let replaced = 0

    try {
      for (const rule of rules) {
        if (options.value.useRegex) {
          const flags = options.value.ignoreCase ? 'gi' : 'g'
          const re = new RegExp(rule.from, flags)
          const hit = next.match(re)
          replaced += hit ? hit.length : 0
          next = next.replace(re, rule.to)
        } else {
          const flags = options.value.ignoreCase ? 'gi' : 'g'
          const re = new RegExp(escapeRegex(rule.from), flags)
          const hit = next.match(re)
          replaced += hit ? hit.length : 0
          next = next.replace(re, rule.to)
        }
      }
      resultText.value = next
      state.value = 'success'
      notice.value = t('tools.textBatchReplace.done', { rules: rules.length, replaced })
    } catch {
      state.value = 'error'
      notice.value = t('tools.textBatchReplace.error')
    }
  }

  function reset() {
    sourceText.value = ''
    rulesText.value = ''
    resultText.value = ''
    state.value = 'idle'
    notice.value = ''
    options.value = {
      useRegex: false,
      ignoreCase: false
    }
  }

  async function copyResult() {
    if (!resultText.value.trim()) return
    try {
      await navigator.clipboard.writeText(resultText.value)
      notice.value = t('tools.textBatchReplace.copied')
    } catch {
      notice.value = t('tools.textBatchReplace.copyFailed')
    }
  }

  function downloadResult() {
    if (!resultText.value.trim()) return
    const blob = new Blob([resultText.value], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `text-batch-replace-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    sourceText,
    rulesText,
    resultText,
    state,
    notice,
    options,
    run,
    reset,
    copyResult,
    downloadResult
  }
}
