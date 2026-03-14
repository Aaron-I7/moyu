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
          <label class="option-item"><input v-model="options.trimLine" type="checkbox"> {{ t('tools.textFormatter.options.trimLine') }}</label>
          <label class="option-item"><input v-model="options.collapseBlankLines" type="checkbox"> {{ t('tools.textFormatter.options.blankLine') }}</label>
          <label class="option-item"><input v-model="options.normalizePunctuation" type="checkbox"> {{ t('tools.textFormatter.options.punctuation') }}</label>
          <label class="option-item"><input v-model="options.toUppercase" type="checkbox"> {{ t('tools.textFormatter.options.uppercase') }}</label>
          <label class="option-item"><input v-model="options.toLowercase" type="checkbox"> {{ t('tools.textFormatter.options.lowercase') }}</label>
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
  filter: blur(56px);
  opacity: 0.3;
}

.page::before {
  width: 320px;
  height: 320px;
  top: 88px;
  left: -90px;
  background: #14b8a6;
}

.page::after {
  width: 290px;
  height: 290px;
  bottom: -70px;
  right: -90px;
  background: #f59e0b;
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
    color-mix(in srgb, var(--color-primary) 20%, var(--color-surface)),
    color-mix(in srgb, var(--color-surface) 92%, transparent)
  );
}

.header h1 {
  margin: 0 0 6px;
  font-size: 30px;
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

.option-item {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 8px 10px;
  background: color-mix(in srgb, var(--color-surface) 96%, transparent);
  transition: var(--transition);
}

.option-item:hover {
  border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
  transform: translateY(-1px);
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
  transition: var(--transition);
}

.editor textarea:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--color-primary) 55%, var(--color-border));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 22%, transparent);
}

.foot {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--color-text-secondary);
  font-size: 13px;
  border-top: 1px dashed var(--color-border);
  padding-top: 10px;
}

[data-theme='pixel'] {
  .panel,
  .editor textarea,
  .btn,
  .option-item {
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
