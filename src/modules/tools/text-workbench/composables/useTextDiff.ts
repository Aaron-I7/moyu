import { computed, ref } from 'vue'
import type { ComposerTranslation } from 'vue-i18n'
import type { DiffRow, ProcessState } from '../types'

export function useTextDiff(t: ComposerTranslation) {
  const leftText = ref('')
  const rightText = ref('')
  const rows = ref<DiffRow[]>([])
  const state = ref<ProcessState>('idle')
  const notice = ref('')

  const summary = computed(() => {
    let add = 0
    let remove = 0
    let same = 0
    for (const row of rows.value) {
      if (row.type === 'add') add += 1
      else if (row.type === 'remove') remove += 1
      else same += 1
    }
    return { add, remove, same }
  })

  const downloadableText = computed(() =>
    rows.value
      .map((row) => {
        if (row.type === 'add') return `+ ${row.right}`
        if (row.type === 'remove') return `- ${row.left}`
        return `  ${row.left}`
      })
      .join('\n')
  )

  function splitLines(text: string) {
    return text.replace(/\r\n/g, '\n').split('\n')
  }

  function buildDiff(a: string[], b: string[]) {
    const n = a.length
    const m = b.length
    const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0))
    for (let i = n - 1; i >= 0; i -= 1) {
      for (let j = m - 1; j >= 0; j -= 1) {
        dp[i]![j] = a[i] === b[j] ? 1 + dp[i + 1]![j + 1]! : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!)
      }
    }
    const output: DiffRow[] = []
    let i = 0
    let j = 0
    while (i < n && j < m) {
      if (a[i] === b[j]) {
        output.push({ type: 'same', left: a[i]!, right: b[j]! })
        i += 1
        j += 1
      } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
        output.push({ type: 'remove', left: a[i]!, right: '' })
        i += 1
      } else {
        output.push({ type: 'add', left: '', right: b[j]! })
        j += 1
      }
    }
    while (i < n) {
      output.push({ type: 'remove', left: a[i]!, right: '' })
      i += 1
    }
    while (j < m) {
      output.push({ type: 'add', left: '', right: b[j]! })
      j += 1
    }
    return output
  }

  function run() {
    const left = leftText.value.trim()
    const right = rightText.value.trim()
    if (!left && !right) {
      state.value = 'empty'
      rows.value = []
      notice.value = t('tools.textDiff.empty')
      return
    }
    state.value = 'processing'
    rows.value = buildDiff(splitLines(leftText.value), splitLines(rightText.value))
    state.value = 'success'
    notice.value = t('tools.textDiff.done', {
      add: summary.value.add,
      remove: summary.value.remove,
      same: summary.value.same
    })
  }

  function reset() {
    leftText.value = ''
    rightText.value = ''
    rows.value = []
    state.value = 'idle'
    notice.value = ''
  }

  async function copyResult() {
    if (!downloadableText.value.trim()) return
    try {
      await navigator.clipboard.writeText(downloadableText.value)
      notice.value = t('tools.textDiff.copied')
    } catch {
      notice.value = t('tools.textDiff.copyFailed')
    }
  }

  function downloadResult() {
    if (!downloadableText.value.trim()) return
    const blob = new Blob([downloadableText.value], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `text-diff-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    leftText,
    rightText,
    rows,
    state,
    notice,
    summary,
    run,
    reset,
    copyResult,
    downloadResult
  }
}
