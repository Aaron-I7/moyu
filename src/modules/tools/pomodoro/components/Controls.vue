<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed } from 'vue'

const props = defineProps<{
  status: 'idle' | 'running' | 'paused'
}>()

const emit = defineEmits<{
  (e: 'start'): void
  (e: 'pause'): void
  (e: 'skip'): void
  (e: 'reset'): void
}>()

const isRunning = computed(() => props.status === 'running')
</script>

<template>
  <div class="controls">
    <button 
      v-if="status !== 'idle'" 
      class="btn-icon" 
      @click="emit('reset')"
      title="Reset"
    >
      <Icon icon="mdi:refresh" width="24" />
    </button>

    <button 
      class="btn-primary" 
      :class="{ running: isRunning }"
      @click="isRunning ? emit('pause') : emit('start')"
    >
      <Icon :icon="isRunning ? 'mdi:pause' : 'mdi:play'" width="32" />
    </button>

    <button 
      class="btn-icon" 
      @click="emit('skip')"
      title="Skip Phase"
    >
      <Icon icon="mdi:skip-next" width="24" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin-top: 32px;
}

.btn-primary {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: none;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(0);
  }

  &.running {
    background: var(--color-surface);
    color: var(--color-primary);
    border: 2px solid var(--color-primary);
  }
}

.btn-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid transparent;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--color-background);
    color: var(--color-text);
  }
}
</style>
