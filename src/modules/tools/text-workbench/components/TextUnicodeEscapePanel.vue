<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TextToolLayout from './TextToolLayout.vue'
import { useTextUnicodeEscape } from '../composables/useTextUnicodeEscape'

const { t } = useI18n({ useScope: 'global' })
const { sourceText, resultText, state, notice, mode, run, reset, copyResult, downloadResult } = useTextUnicodeEscape(t)
</script>

<template>
  <TextToolLayout
    :input-title="t('tools.textUnicodeEscape.source')"
    :output-title="t('tools.textUnicodeEscape.result')"
    :output-hint="t(`tools.textUnicodeEscape.state.${state}`)"
  >
    <template #sidebar>
      <div class="block">
        <div class="block-title">{{ t('tools.textUnicodeEscape.title') }}</div>
        <label class="field">
          <span>{{ t('tools.textUnicodeEscape.modeLabel') }}</span>
          <select v-model="mode" class="select">
            <option value="unicodeEscape">{{ t('tools.textUnicodeEscape.modes.unicodeEscape') }}</option>
            <option value="unicodeUnescape">{{ t('tools.textUnicodeEscape.modes.unicodeUnescape') }}</option>
            <option value="jsonEscape">{{ t('tools.textUnicodeEscape.modes.jsonEscape') }}</option>
            <option value="jsonUnescape">{{ t('tools.textUnicodeEscape.modes.jsonUnescape') }}</option>
          </select>
        </label>
      </div>
      <div class="meta">{{ notice || t(`tools.textUnicodeEscape.state.${state}`) }}</div>
    </template>

    <template #input>
      <textarea v-model="sourceText" class="editor" :placeholder="t('tools.textUnicodeEscape.sourcePlaceholder')" />
    </template>

    <template #output>
      <textarea :value="resultText" class="editor" readonly :placeholder="t('tools.textUnicodeEscape.resultPlaceholder')" />
    </template>

    <template #footer>
      <div class="footer-row">
        <div class="left-actions">
          <button class="icon-btn" @click="copyResult">{{ t('tools.textUnicodeEscape.copy') }}</button>
          <button class="icon-btn" @click="downloadResult">{{ t('tools.textUnicodeEscape.download') }}</button>
          <button class="icon-btn" @click="reset">{{ t('tools.textUnicodeEscape.reset') }}</button>
        </div>
        <div class="status">{{ notice || t(`tools.textUnicodeEscape.state.${state}`) }}</div>
        <button class="run-btn" @click="run">{{ t('tools.textUnicodeEscape.run') }}</button>
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

.field {
  display: grid;
  gap: 6px;
  margin-bottom: 10px;
  font-size: 12px;
  color: #536791;
}

.select {
  border: 1px solid #d9e3f7;
  border-radius: 10px;
  height: 34px;
  padding: 0 10px;
  background: #fff;
  color: #23406f;
}

.meta {
  margin-top: 10px;
  font-size: 12px;
  color: #5d7198;
}

.editor {
  width: 100%;
  height: 100%;
  min-height: 420px;
  border: 1px solid #dce6fb;
  border-radius: 10px;
  background: #ffffff;
  color: #0e2148;
  padding: 12px;
  resize: none;
  transition: var(--transition);
}

.editor:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--color-primary) 55%, var(--color-border));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 22%, transparent);
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
  .editor {
    min-height: 280px;
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
  .select,
  .editor,
  .icon-btn,
  .run-btn {
    border-radius: 0;
    border-width: 2px;
  }
}
</style>
