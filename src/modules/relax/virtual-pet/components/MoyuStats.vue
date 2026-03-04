<template>
  <section class="status-panel">
    <div class="status-display" :class="{ working: isWorking }">
      <span class="status-emoji">{{ isWorking ? '🐟' : '🌙' }}</span>
      <div class="status-info">
        <span class="status-label">{{ isWorking ? (isEn ? 'Working' : '工作中') : (isEn ? 'Resting' : '休息中') }}</span>
        <span class="status-desc">{{ isWorking ? (isEn ? 'Take a mindful break' : '摸鱼时间到~') : (isEn ? 'Have a nice rest' : '好好休息吧') }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
const isEn = computed(() => locale.value === 'en')

defineProps<{
  isWorking: boolean
}>()
</script>

<style scoped lang="scss">
.status-panel {
  background: var(--color-surface);
  border-radius: var(--border-radius);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.status-display {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  transition: all 0.3s ease;

  &.working {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  }
}

.status-emoji {
  font-size: 36px;
  animation: float 2s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-label {
  font-size: 18px;
  font-weight: 700;
  color: white;
}

.status-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}
</style>
