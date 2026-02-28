<template>
  <section class="room" :class="timeOfDay">
    <div class="hud-grid"></div>

    <div class="window">
      <div class="sky" :class="timeOfDay">
        <div class="sun-moon"></div>
        <div class="cloud cloud-1"></div>
        <div class="cloud cloud-2"></div>
      </div>
      <div class="cross-v"></div>
      <div class="cross-h"></div>
    </div>

    <div class="shelf">
      <div class="plant">🌱</div>
      <div class="book b1"></div>
      <div class="book b2"></div>
      <div class="book b3"></div>
    </div>

    <div class="floor"></div>

    <div class="room-content">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const hour = new Date().getHours()
const timeOfDay = computed(() => {
  if (hour >= 6 && hour < 18) return 'day'
  if (hour >= 18 && hour < 21) return 'evening'
  return 'night'
})
</script>

<style scoped lang="scss">
.room {
  position: relative;
  width: 100%;
  min-height: 400px;
  overflow: hidden;
  border-radius: var(--border-radius);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow);
}

.room.day {
  background: linear-gradient(180deg, #e0f2fe 0%, #bae6fd 100%);
}

.room.evening {
  background: linear-gradient(180deg, #fce7f3 0%, #fbcfe8 100%);
}

.room.night {
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
}

.hud-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, rgba(0, 0, 0, 0.02) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.02) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
}

.window {
  position: absolute;
  right: 24px;
  top: 20px;
  width: 120px;
  height: 96px;
  background: var(--color-background);
  overflow: hidden;
  border: 2px solid var(--color-border);
  border-radius: calc(var(--border-radius) - 4px);
  box-shadow: var(--shadow);
}

.sky {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%);
}

.sky.evening {
  background: linear-gradient(180deg, #fb7185 0%, #f43f5e 100%);
}

.sky.night {
  background: linear-gradient(180deg, #1e1b4b 0%, #0f0a2e 100%);
}

.sun-moon {
  position: absolute;
  top: 12px;
  right: 14px;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #fde047 0%, #facc15 100%);
  border-radius: 50%;
  box-shadow: 0 0 12px rgba(253, 224, 71, 0.6);
}

.night .sun-moon {
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  box-shadow: 0 0 8px rgba(226, 232, 240, 0.4);
}

.cloud {
  position: absolute;
  height: 12px;
  background: linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%);
  border-radius: 6px;
  animation: cloudMove 14s linear infinite;
}

.cloud::before,
.cloud::after {
  content: '';
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%);
}

.cloud-1 {
  width: 32px;
  left: 14px;
  top: 24px;
}

.cloud-2 {
  width: 26px;
  left: 54px;
  top: 46px;
  animation-duration: 18s;
  animation-direction: reverse;
}

.cloud-1::before {
  left: 2px;
  top: -10px;
}

.cloud-1::after {
  right: 2px;
  top: -10px;
}

.cloud-2::before {
  left: 2px;
  top: -10px;
}

.cloud-2::after {
  right: 2px;
  top: -10px;
}

.night .cloud {
  opacity: 0.3;
}

.cross-v,
.cross-h {
  position: absolute;
  background: var(--color-border);
}

.cross-v {
  width: 3px;
  height: 100%;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
}

.cross-h {
  height: 3px;
  width: 100%;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
}

.shelf {
  position: absolute;
  left: 18px;
  top: 90px;
  width: 100px;
  height: 44px;
  display: flex;
  align-items: end;
  gap: 6px;
  padding: 8px;
  background: var(--color-surface);
  border-radius: calc(var(--border-radius) - 4px);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow);
}

.plant {
  font-size: 20px;
  line-height: 1;
}

.book {
  width: 14px;
  border-radius: 2px;
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.15);
}

.b1 {
  height: 22px;
  background: var(--color-success);
}

.b2 {
  height: 26px;
  background: var(--color-accent);
}

.b3 {
  height: 20px;
  background: var(--color-secondary);
}

.floor {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 120px;
  background: var(--color-background);
  border-top: 1px solid var(--color-border);
}

.room-content {
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  min-height: 400px;
  justify-content: space-between;
  padding: 16px;
}

@keyframes cloudMove {
  0% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(10px);
  }
  100% {
    transform: translateX(0);
  }
}
</style>
