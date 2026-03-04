<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click.self="$emit('cancel')">
        <div class="modal-container">
          <div class="modal-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </div>
          <h3 class="modal-title">{{ title }}</h3>
          <p class="modal-message">{{ message }}</p>
          <div class="modal-actions">
            <BaseButton type="default" @click="$emit('cancel')">
              {{ isEn ? 'Cancel' : '取消' }}
            </BaseButton>
            <BaseButton type="primary" @click="$emit('confirm')">
              {{ isEn ? 'Confirm' : '确认' }}
            </BaseButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseButton from '@/components/common/BaseButton.vue'
const { locale } = useI18n()
const isEn = computed(() => locale.value === 'en')

defineProps<{
  visible: boolean
  title: string
  message: string
}>()

defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal-container {
  background: var(--color-surface);
  border-radius: var(--border-radius);
  padding: 28px;
  max-width: 360px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--color-border);
}

.modal-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  background: var(--color-primary);
  border-radius: 50%;
  color: white;
  margin-bottom: 16px;
  box-shadow: var(--shadow);
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 8px;
}

.modal-message {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0 0 24px;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.25s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: all 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}
</style>
