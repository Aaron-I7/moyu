<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import WorkbenchTabs from './components/WorkbenchTabs.vue'
import TextDiffPanel from './components/TextDiffPanel.vue'
import TextFormatterPanel from './components/TextFormatterPanel.vue'
import TextDedupePanel from './components/TextDedupePanel.vue'
import TextBatchReplacePanel from './components/TextBatchReplacePanel.vue'
import type { TabKey } from './types'

const { t } = useI18n({ useScope: 'global' })
const activeTab = ref<TabKey>('diff')

const tabs = computed(() => [
  { key: 'diff' as const, label: t('tools.textWorkbench.tabs.diff'), icon: 'mdi:file-compare' },
  { key: 'formatter' as const, label: t('tools.textWorkbench.tabs.formatter'), icon: 'mdi:text-box-edit-outline' },
  { key: 'dedupe' as const, label: t('tools.textWorkbench.tabs.dedupe'), icon: 'mdi:filter-variant-remove' },
  { key: 'replace' as const, label: t('tools.textWorkbench.tabs.replace'), icon: 'mdi:find-replace' }
])
</script>

<template>
  <div class="page">
    <div class="page-inner">
      <div class="panel header">
        <h1>{{ t('tools.textWorkbench.title') }}</h1>
        <p>{{ t('tools.textWorkbench.desc') }}</p>
      </div>

      <WorkbenchTabs
        :active-tab="activeTab"
        :tabs="tabs"
        @switch="(key) => (activeTab = key)"
      />

      <TextDiffPanel v-if="activeTab === 'diff'" />
      <TextFormatterPanel v-else-if="activeTab === 'formatter'" />
      <TextDedupePanel v-else-if="activeTab === 'dedupe'" />
      <TextBatchReplacePanel v-else />
    </div>
  </div>
</template>

<style scoped lang="scss">
.page {
  min-height: 100%;
  padding-top: 10px;
  background: #f8f9ff;
}

.page-inner {
  width: 100%;
  height: 90vh;
  margin: 0;
  padding: 12px;
  display: grid;
  grid-template-rows: auto auto 1fr;
  gap: 12px;
}

.panel {
  border: 1px solid #d9e3f7;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 10px 24px rgba(61, 84, 164, 0.08);
  padding: 14px;
}

.header {
  padding: 12px 20px;
  border-color: #dbe6ff;
  background: linear-gradient(180deg, #f8fbff 0%, #f3f7ff 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header h1 {
  margin: 0;
  font-size: 20px;
  color: #0d2247;
  font-weight: 600;
}

.header p {
  margin: 0;
  font-size: 13px;
  color: #5b6f96;
}

[data-theme='pixel'] {
  .panel {
    border-radius: 0;
    border-width: 2px;
  }
}
</style>
