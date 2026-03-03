<script setup lang="ts">
/**
 * 像素钓场 — 游戏 HUD
 * 像素风暗色浮层：金币、当前钓点、等级、操作提示
 */
import { computed } from 'vue'
import { usePixelFishingStore } from '../stores/pixelFishing'

const store = usePixelFishingStore()

const stateHint = computed(() => {
  switch (store.fishingState) {
    case 'idle': return '[ 空格 ] 抛竿'
    case 'casting': return '抛竿中 ...'
    case 'waiting': return '等待咬钩 ...'
    case 'biting': return '!! 鱼咬钩了 — 快按空格 !!'
    case 'timing-game': return '精准停住指针!'
    case 'catch-animation': return ''
    case 'success': return ''
    case 'failed': return ''
    default: return ''
  }
})

const stateClass = computed(() => {
  if (store.fishingState === 'biting') return 'hint--urgent'
  if (store.fishingState === 'success') return 'hint--success'
  if (store.fishingState === 'failed') return 'hint--fail'
  return ''
})

const emit = defineEmits<{
  openJournal: []
  toggleView: []
  backToSpots: []
  toggleMute: []
}>()
</script>

<template>
  <div class="game-hud">
    <!-- 左上：返回 + 钓点名 -->
    <div class="hud-top-left">
      <button class="hud-btn" @click="emit('backToSpots')" title="返回">
        <span class="btn-icon">◁</span>
      </button>
      <div v-if="store.currentSpot" class="spot-badge">
        {{ store.currentSpot.name }}
      </div>
    </div>

    <!-- 右上：功能按钮组 -->
    <div class="hud-top-right">
      <button
        class="hud-btn"
        :class="{ 'hud-btn--active': store.viewMode === 'first-person' }"
        @click="emit('toggleView')"
        title="切换视角 (V)"
      >
        <span class="btn-icon">{{ store.viewMode === 'third-person' ? '👁' : '🎯' }}</span>
        <span class="btn-label">{{ store.viewMode === 'third-person' ? '三人称' : '第一人称' }}</span>
      </button>
      <button class="hud-btn" @click="emit('openJournal')" title="图鉴 (J)">
        <span class="btn-icon">📖</span>
      </button>
      <button class="hud-btn" @click="emit('toggleMute')" title="静音 (M)">
        <span class="btn-icon">🔊</span>
      </button>
    </div>

    <!-- 下方中央：状态提示 -->
    <div class="hud-bottom-center">
      <div class="state-box" :class="stateClass">
        <span class="state-text">{{ stateHint }}</span>
      </div>
    </div>

    <!-- 左下：状态面板 -->
    <div class="hud-bottom-left">
      <div class="stat-chip">
        <span class="chip-icon">⭐</span>
        <span class="chip-val">Lv.{{ store.level }}</span>
        <div class="exp-track">
          <div class="exp-fill" :style="{ width: `${store.expProgress * 100}%` }" />
        </div>
      </div>
      <div class="stat-chip">
        <span class="chip-icon">💰</span>
        <span class="chip-val gold">{{ store.coins }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* ═══════════════════════════════════════
   像素钓场 · 暗色沉浸式 HUD
   深紫底 + 琥珀色强调
   ═══════════════════════════════════════ */

$hud-bg: rgba(15, 10, 31, 0.82);
$hud-border: rgba(106, 90, 174, 0.25);
$hud-text: #E2E0D8;
$hud-text-dim: rgba(226, 224, 216, 0.55);
$hud-accent: #C8A04A;
$hud-accent-glow: rgba(200, 160, 74, 0.25);
$hud-radius: 6px;

.game-hud {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
}

.hud-top-left,
.hud-top-right,
.hud-bottom-left,
.hud-bottom-center {
  position: absolute;
  pointer-events: auto;
}

// ── 左上 ──
.hud-top-left {
  top: 10px;
  left: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

// ── 右上 ──
.hud-top-right {
  top: 10px;
  right: 10px;
  display: flex;
  gap: 4px;
}

// ── 按钮 ──
.hud-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 32px;
  padding: 0 10px;
  background: $hud-bg;
  border: 1px solid $hud-border;
  border-radius: $hud-radius;
  color: $hud-text;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);

  &:hover {
    border-color: $hud-accent;
    box-shadow: 0 2px 12px $hud-accent-glow;
  }

  &--active {
    border-color: $hud-accent;
    background: rgba(200, 160, 74, 0.1);
  }
}

.btn-icon {
  font-size: 14px;
  line-height: 1;
}

.btn-label {
  font-size: 10px;
  color: $hud-text-dim;
  letter-spacing: 0.5px;
}

.spot-badge {
  height: 32px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  background: $hud-bg;
  border: 1px solid $hud-border;
  border-radius: $hud-radius;
  font-size: 13px;
  font-weight: 700;
  color: $hud-accent;
  letter-spacing: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
}

// ── 底部中央状态 ──
.hud-bottom-center {
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
}

.state-box {
  padding: 8px 24px;
  background: $hud-bg;
  border: 1px solid $hud-border;
  border-radius: $hud-radius;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  backdrop-filter: blur(4px);
}

.state-text {
  font-size: 13px;
  font-weight: 600;
  color: $hud-text;
  letter-spacing: 1px;
}

.hint--urgent {
  border-color: $hud-accent;
  animation: urgent-flash 0.4s ease infinite alternate;

  .state-text {
    color: $hud-accent;
  }
}

.hint--success {
  border-color: #5AAE7A;
  .state-text { color: #5AAE7A; }
}

.hint--fail {
  border-color: #E05A5A;
  .state-text { color: #E05A5A; }
}

@keyframes urgent-flash {
  from { box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5); }
  to   { box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5), 0 0 16px $hud-accent-glow; }
}

// ── 左下状态 ──
.hud-bottom-left {
  bottom: 10px;
  left: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: $hud-bg;
  border: 1px solid $hud-border;
  border-radius: $hud-radius;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
}

.chip-icon {
  font-size: 12px;
}

.chip-val {
  font-size: 12px;
  font-weight: 700;
  color: $hud-accent;

  &.gold { color: $hud-accent; }
}

.exp-track {
  width: 40px;
  height: 6px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid $hud-border;
  border-radius: $hud-radius;
  overflow: hidden;
}

.exp-fill {
  height: 100%;
  background: $hud-accent;
  transition: width 0.3s;
}
</style>
