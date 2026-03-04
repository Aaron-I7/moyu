<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getStoredLocale, localeMetaMap } from '@/core/i18n'

const { t } = useI18n()
const visible = ref(false)

const locale = getStoredLocale()
const region = localeMetaMap[locale].region
const firstTriggerMinutes = region === 'europe' ? 45 : 60

let elapsedSeconds = 0
let timer: number | null = null

const elapsedMinutes = computed(() => Math.floor(elapsedSeconds / 60))

function tick(): void {
  if (document.hidden) {
    return
  }
  elapsedSeconds += 1
  if (elapsedMinutes.value >= firstTriggerMinutes && !visible.value) {
    visible.value = true
  }
}

function closeAndSnooze(): void {
  visible.value = false
  elapsedSeconds = Math.max(0, elapsedSeconds - 15 * 60)
}

function takeBreak(): void {
  visible.value = false
  elapsedSeconds = 0
}

onMounted(() => {
  timer = window.setInterval(tick, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="usage-modal">
        <div class="panel">
          <h3>{{ t('usageReminder.title') }}</h3>
          <p>{{ t('usageReminder.desc') }}</p>
          <div class="actions">
            <button class="ghost" @click="closeAndSnooze">{{ t('usageReminder.snooze') }}</button>
            <button class="primary" @click="takeBreak">{{ t('usageReminder.action') }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.usage-modal {
  position: fixed;
  inset: 0;
  z-index: 1300;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(8, 15, 30, 0.45);
}

.panel {
  width: min(92vw, 420px);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 20px;
  box-shadow: var(--shadow);

  h3 {
    margin-bottom: 8px;
    color: var(--color-text);
  }

  p {
    color: var(--color-text-secondary);
    font-size: 14px;
    margin-bottom: 16px;
  }
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;

  button {
    border-radius: 10px;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 600;
  }

  .ghost {
    border: 1px solid var(--color-border);
    color: var(--color-text-secondary);
  }

  .primary {
    background: var(--color-primary);
    color: #fff;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
