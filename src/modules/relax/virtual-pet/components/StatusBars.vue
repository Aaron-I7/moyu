<template>
  <section class="status-panel">
    <div v-for="attr in attrs" :key="attr.key" class="status-row">
      <div class="status-meta">
        <SvgIcon :name="attr.icon" :size="14" :color="'var(--color-primary)'" />
        <span class="status-label">{{ attr.label }}</span>
      </div>

      <div class="status-bar">
        <div
          v-for="idx in 10"
          :key="`${attr.key}-${idx}`"
          class="bar-segment"
          :class="segmentClass(attr.value, idx)"
        ></div>
      </div>

      <span class="status-value">{{ Math.round(attr.value) }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SvgIcon from './SvgIcon.vue'

type IconName = 'food' | 'smile' | 'bolt' | 'drop'

const props = defineProps({
  hunger: { type: Number, default: 100 },
  happiness: { type: Number, default: 100 },
  energy: { type: Number, default: 100 },
  cleanliness: { type: Number, default: 100 },
})

const attrs = computed(() => [
  { key: 'hunger', icon: 'food' as IconName, label: '饱腹', value: props.hunger },
  { key: 'happiness', icon: 'smile' as IconName, label: '快乐', value: props.happiness },
  { key: 'energy', icon: 'bolt' as IconName, label: '体力', value: props.energy },
  { key: 'cleanliness', icon: 'drop' as IconName, label: '清洁', value: props.cleanliness },
])

function valueClass(value: number) {
  if (value >= 60) return 'good'
  if (value >= 30) return 'warn'
  return 'danger'
}

function segmentClass(value: number, idx: number) {
  const threshold = idx * 10
  const active = value >= threshold
  return active ? valueClass(value) : 'off'
}
</script>

<style scoped lang="scss">
.status-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--color-surface);
  padding: 20px;
  border-radius: var(--border-radius);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow);
}

.status-row {
  display: grid;
  grid-template-columns: 72px 1fr 36px;
  align-items: center;
  gap: 12px;
}

.status-meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text);
}

.status-label {
  font-size: 14px;
  font-weight: 500;
}

.status-bar {
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  gap: 4px;
}

.bar-segment {
  height: 10px;
  border-radius: 3px;
  transition: var(--transition);

  &.off {
    background: var(--color-border);
  }

  &.good {
    background: var(--color-success);
  }

  &.warn {
    background: var(--color-warning);
  }

  &.danger {
    background: var(--color-error);
  }
}

.status-value {
  text-align: right;
  color: var(--color-text);
  font-size: 13px;
  font-weight: 600;
}
</style>
