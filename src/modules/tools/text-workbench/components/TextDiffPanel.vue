<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TextToolLayout from './TextToolLayout.vue'
import { useTextDiff } from '../composables/useTextDiff'

const { t } = useI18n({ useScope: 'global' })
const { leftText, rightText, rows, state, notice, summary, run, reset, copyResult, downloadResult } = useTextDiff(t)
</script>

<template>
  <TextToolLayout
    :input-title="t('tools.textDiff.leftLabel')"
    :output-title="t('tools.textDiff.rightLabel')"
    :output-hint="t(`tools.textDiff.state.${state}`)"
  >
    <template #sidebar>
      <div class="block">
        <div class="block-title">{{ t('tools.textWorkbench.tabs.diff') }}</div>
        <div class="summary-row">
          <div class="summary-pill add">+ {{ summary.add }}</div>
          <div class="summary-pill remove">- {{ summary.remove }}</div>
          <div class="summary-pill same">= {{ summary.same }}</div>
        </div>
      </div>
      <div class="meta">{{ notice || t(`tools.textDiff.state.${state}`) }}</div>
    </template>

    <template #input>
      <textarea v-model="leftText" class="editor" :placeholder="t('tools.textDiff.leftPlaceholder')" />
    </template>

    <template #output>
      <textarea v-model="rightText" class="editor" :placeholder="t('tools.textDiff.rightPlaceholder')" />
      <div v-if="rows.length > 0" class="diff-list">
        <div v-for="(row, idx) in rows" :key="`${idx}-${row.type}`" class="diff-row" :data-type="row.type">
          <div class="line">{{ row.left }}</div>
          <div class="line">{{ row.right }}</div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="footer-row">
        <div class="left-actions">
          <button class="icon-btn" @click="copyResult">{{ t('tools.textDiff.copy') }}</button>
          <button class="icon-btn" @click="downloadResult">{{ t('tools.textDiff.download') }}</button>
          <button class="icon-btn" @click="reset">{{ t('tools.textDiff.reset') }}</button>
        </div>
        <div class="status">{{ notice || t(`tools.textDiff.state.${state}`) }}</div>
        <button class="run-btn" @click="run">{{ t('tools.textDiff.compare') }}</button>
      </div>
    </template>
  </TextToolLayout>
</template>

<style scoped lang="scss">
.block {
  border: 1px solid #dce6fb;
  border-radius: 12px;
  background: #f3f7ff;
  padding: 10px;
}

.block-title {
  font-size: 13px;
  font-weight: 700;
  color: #1c377a;
  margin-bottom: 8px;
}

.summary-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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

.meta {
  margin-top: 10px;
  font-size: 12px;
  color: #60749e;
}

.editor {
  width: 100%;
  min-height: 180px;
  border: 1px solid #dce6fb;
  border-radius: 10px;
  background: #ffffff;
  color: #0e2148;
  padding: 12px;
  resize: vertical;
  transition: var(--transition);
}

.editor:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--color-primary) 55%, var(--color-border));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 22%, transparent);
}

.diff-list {
  margin-top: 10px;
  border: 1px solid #dce6fb;
  border-radius: 10px;
  max-height: 240px;
  overflow: auto;
  background: #f7faff;
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
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.line + .line {
  border-left: 1px solid var(--color-border);
}

.diff-row[data-type='add'] .line:last-child {
  background: color-mix(in srgb, #22c55e 14%, var(--color-surface));
}

.diff-row[data-type='remove'] .line:first-child {
  background: color-mix(in srgb, #ef4444 14%, var(--color-surface));
}

.footer-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  border-radius: 10px;
  background: #edf3ff;
  padding: 6px;
}

.left-actions {
  display: flex;
  gap: 8px;
}

.icon-btn {
  border: 1px solid #d9e3f7;
  background: #fff;
  color: #445b8a;
  border-radius: 10px;
  height: 34px;
  padding: 0 10px;
  cursor: pointer;
}

.status {
  text-align: center;
  font-size: 12px;
  color: #60749e;
}

.run-btn {
  border: 1px solid #4467d6;
  background: linear-gradient(135deg, #2645b5, #3f5fd0);
  color: #fff;
  border-radius: 10px;
  height: 38px;
  padding: 0 18px;
  cursor: pointer;
  font-weight: 700;
}

@media (max-width: 860px) {
  .diff-row {
    grid-template-columns: 1fr;
  }

  .line + .line {
    border-left: none;
    border-top: 1px solid var(--color-border);
  }

  .footer-row {
    grid-template-columns: 1fr;
  }

  .status {
    text-align: left;
  }
}

[data-theme='pixel'] {
  .block,
  .summary-pill,
  .editor,
  .diff-list,
  .icon-btn,
  .run-btn {
    border-radius: 0;
    border-width: 2px;
  }
}
</style>
