<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { TabKey } from '../types'

defineProps<{
  activeTab: TabKey
  tabs: Array<{ key: TabKey; label: string; icon: string }>
}>()

const emit = defineEmits<{
  switch: [key: TabKey]
}>()
</script>

<template>
  <div class="tab-row panel">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      class="tab-btn"
      :data-active="activeTab === tab.key"
      @click="emit('switch', tab.key)"
    >
      <Icon :icon="tab.icon" width="16" />
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped lang="scss">
.panel {
  border: 1px solid #d9e3f7;
  border-radius: 14px;
  background: #eef4ff;
  box-shadow: 0 8px 18px rgba(61, 84, 164, 0.08);
  padding: 10px;
}

.tab-row {
  display: flex;
  gap: 8px;
}

.tab-btn {
  border: 1px solid #d9e3f7;
  background: #fff;
  color: #5b6f96;
  border-radius: 10px;
  height: 38px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: var(--transition);
}

.tab-btn[data-active='true'] {
  color: #1c3f95;
  border-color: #7d9eff;
  background: #e7efff;
}

@media (max-width: 900px) {
  .tab-row {
    flex-direction: column;
  }
}

[data-theme='pixel'] {
  .panel,
  .tab-btn {
    border-radius: 0;
    border-width: 2px;
  }
}
</style>
