<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'

type DiffRow = {
  type: 'same' | 'add' | 'remove'
  left: string
  right: string
}

const { t } = useI18n({ useScope: 'global' })

const leftText = ref('')
const rightText = ref('')
const rows = ref<DiffRow[]>([])
const state = ref<'idle' | 'processing' | 'success' | 'empty' | 'error'>('idle')
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

function compare() {
  const left = leftText.value.trim()
  const right = rightText.value.trim()
  if (!left && !right) {
    state.value = 'empty'
    rows.value = []
    notice.value = t('tools.textDiff.empty')
    return
  }
  state.value = 'processing'
  const a = splitLines(leftText.value)
  const b = splitLines(rightText.value)
  rows.value = buildDiff(a, b)
  state.value = 'success'
  notice.value = t('tools.textDiff.done', {
    add: summary.value.add,
    remove: summary.value.remove,
    same: summary.value.same
  })
}

function resetAll() {
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
</script>

<template>
  <div class="page">
    <div class="page-inner">
      <div class="header panel">
        <h1>{{ t('tools.textDiff.title') }}</h1>
        <p>{{ t('tools.textDiff.desc') }}</p>
      </div>

      <div class="panel input-area">
        <div class="editor-grid">
          <div class="editor">
            <label>{{ t('tools.textDiff.leftLabel') }}</label>
            <textarea v-model="leftText" :placeholder="t('tools.textDiff.leftPlaceholder')" />
          </div>
          <div class="editor">
            <label>{{ t('tools.textDiff.rightLabel') }}</label>
            <textarea v-model="rightText" :placeholder="t('tools.textDiff.rightPlaceholder')" />
          </div>
        </div>
        <div class="action-row">
          <button class="btn primary" @click="compare">
            <Icon icon="mdi:file-compare" width="16" />
            {{ t('tools.textDiff.compare') }}
          </button>
          <button class="btn" @click="resetAll">{{ t('tools.textDiff.reset') }}</button>
          <button class="btn" @click="copyResult">{{ t('tools.textDiff.copy') }}</button>
          <button class="btn" @click="downloadResult">{{ t('tools.textDiff.download') }}</button>
        </div>
      </div>

      <div class="panel result-area">
        <div class="status">{{ notice || t(`tools.textDiff.state.${state}`) }}</div>
        <div v-if="rows.length > 0" class="summary-row">
          <div class="summary-pill add">+ {{ summary.add }}</div>
          <div class="summary-pill remove">- {{ summary.remove }}</div>
          <div class="summary-pill same">= {{ summary.same }}</div>
        </div>
        <div v-if="rows.length > 0" class="diff-list">
          <div v-for="(row, idx) in rows" :key="`${idx}-${row.type}`" class="diff-row" :data-type="row.type">
            <div class="line">{{ row.left }}</div>
            <div class="line">{{ row.right }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page {
  min-height: 100%;
  padding-top: 56px;
  position: relative;
  overflow: hidden;
}

.page::before,
.page::after {
  content: '';
  position: fixed;
  pointer-events: none;
  z-index: 0;
  border-radius: 50%;
  filter: blur(48px);
  opacity: 0.32;
}

.page::before {
  width: 320px;
  height: 320px;
  top: 80px;
  right: -80px;
  background: #14b8a6;
}

.page::after {
  width: 280px;
  height: 280px;
  bottom: -80px;
  left: -70px;
  background: #f97316;
}

.page-inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 20px 12px 28px;
  display: grid;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.panel {
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  box-shadow: var(--shadow);
  padding: 14px;
  backdrop-filter: blur(8px);
  background: color-mix(in srgb, var(--color-surface) 88%, transparent);
}

.header {
  padding: 18px;
  border-color: color-mix(in srgb, var(--color-primary) 42%, var(--color-border));
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-primary) 22%, var(--color-surface)),
    color-mix(in srgb, var(--color-surface) 92%, transparent)
  );
}

.header h1 {
  margin: 0 0 6px;
  font-size: 30px;
  letter-spacing: 0.2px;
  color: var(--color-text);
}

.header p {
  margin: 0;
  color: var(--color-text-secondary);
}

.editor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.editor {
  display: grid;
  gap: 6px;
}

.editor label {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.editor textarea {
  min-height: 220px;
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
  padding: 10px 12px;
  resize: vertical;
  transition: var(--transition);
}

.editor textarea:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--color-primary) 55%, var(--color-border));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 22%, transparent);
}

.action-row {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px dashed var(--color-border);
}

.btn {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  border-radius: 10px;
  height: 38px;
  padding: 0 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: var(--transition);
}

.btn:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
  box-shadow: 0 8px 18px color-mix(in srgb, var(--color-primary) 22%, transparent);
}

.btn.primary {
  border-color: color-mix(in srgb, var(--color-primary) 50%, var(--color-border));
  background: color-mix(in srgb, var(--color-primary) 15%, var(--color-surface));
}

.status {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.summary-row {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.summary-pill {
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
}

.summary-pill.add {
  border-color: color-mix(in srgb, #16a34a 45%, var(--color-border));
  color: #16a34a;
}

.summary-pill.remove {
  border-color: color-mix(in srgb, #dc2626 45%, var(--color-border));
  color: #dc2626;
}

.summary-pill.same {
  color: var(--color-text-secondary);
}

.diff-list {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  overflow: hidden;
  max-height: 460px;
  overflow: auto;
  background: color-mix(in srgb, var(--color-surface) 96%, transparent);
}

.diff-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.diff-row + .diff-row {
  border-top: 1px solid var(--color-border);
}

.line {
  padding: 8px 10px;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.line + .line {
  border-left: 1px solid var(--color-border);
}

.diff-row[data-type='same'] .line {
  background: color-mix(in srgb, var(--color-surface) 96%, transparent);
}

.diff-row[data-type='add'] .line:last-child {
  background: color-mix(in srgb, #22c55e 14%, var(--color-surface));
}

.diff-row[data-type='remove'] .line:first-child {
  background: color-mix(in srgb, #ef4444 14%, var(--color-surface));
}

[data-theme='pixel'] {
  .panel,
  .editor textarea,
  .btn,
  .diff-list {
    border-radius: 0;
    border-width: 2px;
  }
}

@media (max-width: 860px) {
  .editor-grid,
  .diff-row {
    grid-template-columns: 1fr;
  }

  .line + .line {
    border-left: none;
    border-top: 1px solid var(--color-border);
  }
}
</style>
