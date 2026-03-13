<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })

const sourceText = ref('')
const resultText = ref('')
const state = ref<'idle' | 'processing' | 'success' | 'empty'>('idle')
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

function formatText() {
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

function resetAll() {
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
</script>

<template>
  <div class="page">
    <div class="page-inner">
      <div class="header panel">
        <h1>{{ t('tools.textFormatter.title') }}</h1>
        <p>{{ t('tools.textFormatter.desc') }}</p>
      </div>

      <div class="panel option-area">
        <div class="option-grid">
          <label><input v-model="options.trimLine" type="checkbox"> {{ t('tools.textFormatter.options.trimLine') }}</label>
          <label><input v-model="options.collapseBlankLines" type="checkbox"> {{ t('tools.textFormatter.options.blankLine') }}</label>
          <label><input v-model="options.normalizePunctuation" type="checkbox"> {{ t('tools.textFormatter.options.punctuation') }}</label>
          <label><input v-model="options.toUppercase" type="checkbox"> {{ t('tools.textFormatter.options.uppercase') }}</label>
          <label><input v-model="options.toLowercase" type="checkbox"> {{ t('tools.textFormatter.options.lowercase') }}</label>
        </div>
        <div class="action-row">
          <button class="btn primary" @click="formatText">
            <Icon icon="mdi:text-box-check-outline" width="16" />
            {{ t('tools.textFormatter.run') }}
          </button>
          <button class="btn" @click="resetAll">{{ t('tools.textFormatter.reset') }}</button>
          <button class="btn" @click="copyResult">{{ t('tools.textFormatter.copy') }}</button>
          <button class="btn" @click="downloadResult">{{ t('tools.textFormatter.download') }}</button>
        </div>
      </div>

      <div class="panel editor-grid">
        <div class="editor">
          <label>{{ t('tools.textFormatter.source') }}</label>
          <textarea v-model="sourceText" :placeholder="t('tools.textFormatter.sourcePlaceholder')" />
        </div>
        <div class="editor">
          <label>{{ t('tools.textFormatter.result') }}</label>
          <textarea :value="resultText" readonly :placeholder="t('tools.textFormatter.resultPlaceholder')" />
        </div>
      </div>

      <div class="panel foot">
        <span>{{ notice || t(`tools.textFormatter.state.${state}`) }}</span>
        <span>{{ t('tools.textFormatter.stats', lineStats) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page {
  min-height: 100%;
  padding-top: 56px;
}

.page-inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 20px 12px 28px;
  display: grid;
  gap: 12px;
}

.panel {
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  box-shadow: var(--shadow);
  padding: 14px;
}

.header h1 {
  margin: 0 0 6px;
  font-size: 28px;
  color: var(--color-text);
}

.header p {
  margin: 0;
  color: var(--color-text-secondary);
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.option-grid label {
  font-size: 13px;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-row {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.btn {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  border-radius: 10px;
  height: 34px;
  padding: 0 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn.primary {
  border-color: color-mix(in srgb, var(--color-primary) 50%, var(--color-border));
  background: color-mix(in srgb, var(--color-primary) 15%, var(--color-surface));
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
  min-height: 260px;
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
  padding: 10px 12px;
  resize: vertical;
}

.foot {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--color-text-secondary);
  font-size: 13px;
}

[data-theme='pixel'] {
  .panel,
  .editor textarea,
  .btn {
    border-radius: 0;
    border-width: 2px;
  }
}

@media (max-width: 860px) {
  .editor-grid {
    grid-template-columns: 1fr;
  }

  .option-grid {
    grid-template-columns: 1fr;
  }

  .foot {
    flex-direction: column;
  }
}
</style>
