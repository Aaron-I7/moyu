<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DanmakuInput from './DanmakuInput.vue'
import { useWebSocketDanmaku } from '@/composables/useWebSocketDanmaku'

const showInputPanel = ref(false)
const isHovered = ref(false)

const { danmakuEnabled, loadDanmakuEnabled } = useWebSocketDanmaku()

function openInputPanel() {
  showInputPanel.value = true
}

function closeInputPanel() {
  showInputPanel.value = false
}

onMounted(() => {
  loadDanmakuEnabled()
})
</script>

<template>
  <div v-if="danmakuEnabled" class="danmaku-fab-container">
    <Transition name="fab-bounce">
      <button
        v-if="!showInputPanel"
        class="danmaku-fab"
        :class="{ 'danmaku-fab--hovered': isHovered }"
        @click="openInputPanel"
        @mouseenter="isHovered = true"
        @mouseleave="isHovered = false"
      >
        <div class="fab-icon">
          <span class="fab-emoji">💬</span>
        </div>
        <div class="fab-ripple" />
        <div class="fab-pulse" />
      </button>
    </Transition>

    <Transition name="input-panel">
      <DanmakuInput
        v-if="showInputPanel"
        @close="closeInputPanel"
      />
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.danmaku-fab-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9998;
  
  @media (max-width: 768px) {
    bottom: 16px;
    right: 16px;
  }
}

.danmaku-fab {
  position: relative;
  width: 64px;
  height: 64px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 50%, #8B5CF6 100%);
  background-size: 200% 200%;
  box-shadow: 
    0 8px 32px rgba(139, 92, 246, 0.4),
    0 4px 16px rgba(99, 102, 241, 0.3),
    inset 0 2px 0 rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation: gradient-shift 3s ease infinite;
  
  &:hover {
    transform: scale(1.1) rotate(5deg);
    box-shadow: 
      0 12px 48px rgba(139, 92, 246, 0.6),
      0 6px 24px rgba(99, 102, 241, 0.4),
      inset 0 2px 0 rgba(255, 255, 255, 0.3);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  &--hovered {
    .fab-emoji {
      animation: emoji-bounce 0.6s ease infinite;
    }
  }
  
  @media (max-width: 768px) {
    width: 56px;
    height: 56px;
  }
}

@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.fab-icon {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.fab-emoji {
  font-size: 32px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  transition: transform 0.3s ease;
  
  @media (max-width: 768px) {
    font-size: 28px;
  }
}

@keyframes emoji-bounce {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-4px) rotate(-5deg); }
  75% { transform: translateY(-4px) rotate(5deg); }
}

.fab-ripple {
  position: absolute;
  inset: -4px;
  border: 2px solid rgba(139, 92, 246, 0.4);
  border-radius: 50%;
  animation: ripple-expand 2s ease-out infinite;
}

@keyframes ripple-expand {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.fab-pulse {
  position: absolute;
  inset: -8px;
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 50%;
  animation: pulse-glow 3s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
    opacity: 0;
  }
}

.fab-bounce-enter-active {
  animation: fab-enter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fab-bounce-leave-active {
  animation: fab-leave 0.3s ease;
}

@keyframes fab-enter {
  0% {
    opacity: 0;
    transform: scale(0) rotate(-180deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

@keyframes fab-leave {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0) rotate(180deg);
  }
}

.input-panel-enter-active {
  animation: panel-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.input-panel-leave-active {
  animation: panel-leave 0.3s ease;
}

@keyframes panel-enter {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes panel-leave {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
}
</style>
