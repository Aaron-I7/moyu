<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TextToolLayout from './TextToolLayout.vue'
import { useTextStructured } from '../composables/useTextStructured'

const { t } = useI18n({ useScope: 'global' })
const { sourceText, resultText, state, notice, mode, indentSize, stats, run, reset, copyResult, downloadResult } = useTextStructured(t)
</script>

<template>
  <TextToolLayout
    :input-title="t('tools.textStructured.source')"
    :output-title="t('tools.textStructured.result')"
    :output-hint="t(`tools.textStructured.state.${state}`)"
  >
    <template #sidebar>
      <div class="block">
        <div class="block-title">{{ t('tools.textStructured.title') }}</div>
        <label class="field">
          <span>{{ t('tools.textStructured.modeLabel') }}</span>
          <select v-model="mode" class="select">
            <option value="jsonFormat">{{ t('tools.textStructured.modes.jsonFormat') }}</option>
            <option value="jsonMinify">{{ t('tools.textStructured.modes.jsonMinify') }}</option>
            <option value="jsonToYaml">{{ t('tools.textStructured.modes.jsonToYaml') }}</option>
            <option value="yamlToJson">{{ t('tools.textStructured.modes.yamlToJson') }}</option>
            <option value="jsonToToml">{{ t('tools.textStructured.modes.jsonToToml') }}</option>
            <option value="tomlToJson">{{ t('tools.textStructured.modes.tomlToJson') }}</option>
          </select>
        </label>
        <label class="field">
          <span>{{ t('tools.textStructured.indentLabel') }}</span>
          <select v-model.number="indentSize" class="select">
            <option :value="2">2</option>
            <option :value="4">4</option>
          </select>
        </label>
      </div>
      <div class="meta">{{ t('tools.textStructured.stats', stats) }}</div>
    </template>

    <template #input>
      <textarea v-model="sourceText" class="editor" :placeholder="t('tools.textStructured.sourcePlaceholder')" />
    </template>

    <template #output>
      <textarea :value="resultText" class="editor" readonly :placeholder="t('tools.textStructured.resultPlaceholder')" />
    </template>

    <template #footer>
      <div class="footer-row">
        <div class="left-actions">
          <button class="icon-btn" @click="copyResult">{{ t('tools.textStructured.copy') }}</button>
          <button class="icon-btn" @click="downloadResult">{{ t('tools.textStructured.download') }}</button>
          <button class="icon-btn" @click="reset">{{ t('tools.textStructured.reset') }}</button>
        </div>
        <div class="status">{{ notice || t(`tools.textStructured.state.${state}`) }}</div>
        <button class="run-btn" @click="run">{{ t('tools.textStructured.run') }}</button>
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
