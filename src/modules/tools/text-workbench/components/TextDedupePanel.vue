<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TextToolLayout from './TextToolLayout.vue'
import { useTextDedupe } from '../composables/useTextDedupe'

const { t } = useI18n({ useScope: 'global' })
const { sourceText, resultText, state, notice, options, stats, run, reset, copyResult, downloadResult } = useTextDedupe(t)
</script>

<template>
  <TextToolLayout
    :input-title="t('tools.textDedupe.source')"
    :output-title="t('tools.textDedupe.result')"
    :output-hint="t(`tools.textDedupe.state.${state}`)"
  >
    <template #sidebar>
      <div class="block">
        <div class="block-title">{{ t('tools.textWorkbench.tabs.dedupe') }}</div>
        <div class="switch-list">
          <label class="switch-item"><input v-model="options.trimLine" type="checkbox"> {{ t('tools.textDedupe.options.trimLine') }}</label>
          <label class="switch-item"><input v-model="options.ignoreCase" type="checkbox"> {{ t('tools.textDedupe.options.ignoreCase') }}</label>
          <label class="switch-item"><input v-model="options.removeEmpty" type="checkbox"> {{ t('tools.textDedupe.options.removeEmpty') }}</label>
        </div>
      </div>
      <div class="meta">{{ t('tools.textDedupe.stats', stats) }}</div>
    </template>

    <template #input>
      <textarea v-model="sourceText" class="editor" :placeholder="t('tools.textDedupe.sourcePlaceholder')" />
    </template>

    <template #output>
      <textarea :value="resultText" class="editor" readonly :placeholder="t('tools.textDedupe.resultPlaceholder')" />
    </template>

    <template #footer>
      <div class="footer-row">
        <div class="left-actions">
          <button class="icon-btn" @click="copyResult">{{ t('tools.textDedupe.copy') }}</button>
          <button class="icon-btn" @click="downloadResult">{{ t('tools.textDedupe.download') }}</button>
          <button class="icon-btn" @click="reset">{{ t('tools.textDedupe.reset') }}</button>
        </div>
        <div class="status">{{ notice || t(`tools.textDedupe.state.${state}`) }}</div>
        <button class="run-btn" @click="run">{{ t('tools.textDedupe.run') }}</button>
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

.switch-list {
  display: grid;
  gap: 8px;
}

.switch-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #536791;
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
  .editor,
  .icon-btn,
  .run-btn {
    border-radius: 0;
    border-width: 2px;
  }
}
</style>
