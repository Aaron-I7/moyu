<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  visible: boolean
  timeText: string
  bestTimeText: string
  completed: number
  errors: number
  total: number
}>()

const emit = defineEmits<{
  close: []
  restart: []
}>()

const { t } = useI18n({ useScope: 'global' })

const accuracy = computed(() => {
  const base = props.completed + props.errors
  if (base <= 0) return 100
  return Math.max(0, Math.min(100, Math.round((props.completed / base) * 100)))
})

const motivate = computed(() => {
  if (accuracy.value >= 98) return t('modules.focus100.successLinePerfect')
  if (accuracy.value >= 92) return t('modules.focus100.successLineGreat')
  return t('modules.focus100.successLineGood')
})

function particleStyle(i: number) {
  const angle = (360 / 20) * i
  const delay = `${(i % 7) * 0.08}s`
  const size = 6 + (i % 4)
  const dist = 98 + (i % 5) * 10
  return {
    '--angle': `${angle}deg`,
    '--delay': delay,
    '--size': `${size}px`,
    '--distance': `${dist}px`
  }
}
</script>

<template>
  <Transition name="success-pop">
    <div v-if="visible" class="overlay" @click.self="emit('close')">
      <div class="celebration">
        <div class="rays">
          <span v-for="i in 20" :key="i" class="ray" :style="particleStyle(i)" />
        </div>
        <div class="pulse" />
        <div class="medal">
          <span class="medal-core" />
          <span class="medal-ring" />
        </div>
        <h3>{{ t('modules.focus100.successTitle') }}</h3>
        <p class="subtitle">{{ t('modules.focus100.successSubtitle') }}</p>
        <p class="motivate">{{ motivate }}</p>
        <div class="metrics">
          <div class="metric">
            <span>{{ t('modules.focus100.successMetricTime') }}</span>
            <strong>{{ timeText }}</strong>
          </div>
          <div class="metric">
            <span>{{ t('modules.focus100.successMetricBest') }}</span>
            <strong>{{ bestTimeText }}</strong>
          </div>
          <div class="metric">
            <span>{{ t('modules.focus100.successMetricAccuracy') }}</span>
            <strong>{{ accuracy }}%</strong>
          </div>
        </div>
        <div class="actions">
          <button class="btn ghost" @click="emit('close')">{{ t('modules.focus100.successClose') }}</button>
          <button class="btn strong" @click="emit('restart')">{{ t('modules.focus100.successRestart') }}</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.overlay {
  position: fixed;
  inset: 0;
  z-index: 3200;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 22% 22%, color-mix(in srgb, var(--color-primary) 32%, transparent), transparent 48%),
    radial-gradient(circle at 78% 74%, color-mix(in srgb, #f59e0b 28%, transparent), transparent 52%),
    color-mix(in srgb, #050b16 72%, transparent);
  backdrop-filter: blur(8px);
}

.celebration {
  position: relative;
  width: min(560px, calc(100vw - 26px));
  border: 1px solid color-mix(in srgb, var(--color-primary) 58%, var(--color-border));
  border-radius: 24px;
  padding: 24px 22px 18px;
  background:
    linear-gradient(160deg, color-mix(in srgb, var(--color-surface) 94%, #0b1020), color-mix(in srgb, var(--color-surface) 88%, #090f1a));
  box-shadow:
    0 40px 80px color-mix(in srgb, #04070f 72%, transparent),
    0 0 0 1px color-mix(in srgb, #f59e0b 26%, transparent) inset;
  overflow: hidden;
}

.rays {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.ray {
  position: absolute;
  top: 38%;
  left: 50%;
  width: var(--size);
  height: var(--size);
  margin-left: calc(var(--size) / -2);
  margin-top: calc(var(--size) / -2);
  border-radius: 999px;
  background: linear-gradient(135deg, #f59e0b, #f97316);
  transform: rotate(var(--angle)) translateY(calc(var(--distance) * -1));
  opacity: 0;
  animation: rayBurst 1.4s ease-out infinite;
  animation-delay: var(--delay);
}

.pulse {
  position: absolute;
  top: -140px;
  left: 50%;
  width: 420px;
  height: 420px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: radial-gradient(circle, color-mix(in srgb, #f59e0b 32%, transparent), transparent 68%);
  opacity: 0.66;
  pointer-events: none;
}

.medal {
  width: 84px;
  height: 84px;
  margin: 0 auto 10px;
  position: relative;
}

.medal-core {
  position: absolute;
  inset: 14px;
  border-radius: 999px;
  background: linear-gradient(145deg, #fde68a, #f59e0b 62%, #ea580c);
  box-shadow: 0 8px 18px color-mix(in srgb, #f59e0b 60%, transparent);
}

.medal-ring {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  border: 3px solid color-mix(in srgb, #fcd34d 90%, #fff);
}

h3 {
  margin: 0;
  text-align: center;
  font-size: 30px;
  letter-spacing: 0.12em;
  color: #f8fafc;
}

.subtitle {
  margin: 6px 0 0;
  text-align: center;
  color: color-mix(in srgb, var(--color-text-secondary) 88%, #dbeafe);
  font-size: 13px;
}

.motivate {
  margin: 10px auto 0;
  text-align: center;
  width: fit-content;
  padding: 4px 12px;
  border-radius: 999px;
  color: #fef3c7;
  font-size: 12px;
  border: 1px solid color-mix(in srgb, #f59e0b 56%, transparent);
  background: color-mix(in srgb, #f59e0b 16%, transparent);
}

.metrics {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.metric {
  border: 1px solid color-mix(in srgb, var(--color-border) 88%, var(--color-primary));
  border-radius: 12px;
  background: color-mix(in srgb, var(--color-surface) 88%, #0c1324);
  padding: 8px 10px;
  display: grid;
  gap: 4px;
}

.metric span {
  font-size: 11px;
  color: #93a4c7;
}

.metric strong {
  font-size: 20px;
  color: #f8fafc;
}

.actions {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn {
  border-radius: 10px;
  height: 36px;
  padding: 0 14px;
  font-size: 12px;
  cursor: pointer;
}

.btn.ghost {
  border: 1px solid color-mix(in srgb, var(--color-border) 92%, #9ca3af);
  background: color-mix(in srgb, var(--color-surface) 90%, transparent);
  color: #d1d5db;
}

.btn.strong {
  border: 1px solid #f59e0b;
  background: linear-gradient(135deg, #f59e0b, #f97316);
  color: #121212;
  font-weight: 700;
}

.success-pop-enter-active,
.success-pop-leave-active {
  transition: opacity 0.25s ease;
}

.success-pop-enter-from,
.success-pop-leave-to {
  opacity: 0;
}

@keyframes rayBurst {
  0% {
    opacity: 0;
    transform: rotate(var(--angle)) translateY(calc((var(--distance) - 22px) * -1)) scale(0.55);
  }
  28% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: rotate(var(--angle)) translateY(calc((var(--distance) + 16px) * -1)) scale(1.1);
  }
}

@media (max-width: 640px) {
  .metrics {
    grid-template-columns: 1fr;
  }

  h3 {
    font-size: 24px;
  }
}

[data-theme='pixel'] {
  .celebration,
  .metric,
  .btn {
    border-radius: 0;
    border-width: 2px;
  }
}
</style>
