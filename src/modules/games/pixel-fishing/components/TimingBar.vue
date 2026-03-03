<script setup lang="ts">
import { onMounted, onUnmounted, computed, watch } from 'vue'
import { useTimingBar } from '../composables/useTimingBar'
import type { Fish, TimingResult } from '../types'
import { RARITY_COLORS, RARITY_NAMES } from '../constants'

const props = defineProps<{
  fish: Fish
}>()

const emit = defineEmits<{
  result: [value: TimingResult]
  complete: [results: TimingResult[]]
}>()

const {
  barWidth,
  pointerPos,
  greenStart,
  greenWidth,
  yellowWidth,
  active,
  result,
  totalStages,
  stageResults,
  combo,
  isTensionMode,
  tension,
  tensionMin,
  tensionMax,
  tensionInZone,
  tensionProgress,
  start,
  stop,
  onTensionClick,
  continueToNextStage,
  isComplete,
  cancel
} = useTimingBar()

const stageDots = computed(() => 
  Array.from({ length: totalStages.value }, (_, i) => ({
    index: i,
    result: stageResults.value[i] || null
  }))
)

onMounted(() => {
  start(props.fish)
  window.addEventListener('keydown', onKey)
})

onUnmounted(() => {
  cancel()
  window.removeEventListener('keydown', onKey)
})

watch(result, (r) => {
  if (!r) return
  
  if (isComplete()) {
    setTimeout(() => {
      emit('complete', stageResults.value)
    }, 600)
  } else if (r !== 'miss') {
    setTimeout(() => {
      continueToNextStage()
    }, 800)
  } else {
    setTimeout(() => {
      emit('result', r)
    }, 600)
  }
})

function onKey(e: KeyboardEvent) {
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault()
    if (isTensionMode.value && active.value) {
      onTensionClick()
    } else if (active.value) {
      doStop()
    }
  }
}

function doStop() {
  const r = stop()
  
  if (isComplete()) {
    setTimeout(() => {
      emit('complete', stageResults.value)
    }, 600)
  } else if (r === 'miss') {
    setTimeout(() => {
      emit('result', r)
    }, 600)
  }
}

function onPanelClick() {
  if (isTensionMode.value && active.value) {
    onTensionClick()
  } else if (active.value) {
    doStop()
  }
}

function getResultClass(r: TimingResult | null): string {
  if (!r) return ''
  return `stage-dot--${r}`
}
</script>

<template>
  <div class="timing-overlay" @click="onPanelClick">
    <div class="timing-panel" @click.stop>
      <div class="timing-header">
        <span
          class="rarity-gem"
          :style="{ background: RARITY_COLORS[fish.rarity] }"
        />
        <span class="timing-fish-name">{{ fish.name }}</span>
        <span class="rarity-tag" :style="{ color: RARITY_COLORS[fish.rarity], borderColor: RARITY_COLORS[fish.rarity] }">
          {{ RARITY_NAMES[fish.rarity] }}
        </span>
      </div>

      <div class="stage-indicator">
        <span
          v-for="dot in stageDots"
          :key="dot.index"
          class="stage-dot"
          :class="getResultClass(dot.result)"
        />
      </div>

      <!-- 张力条模式 -->
      <div v-if="isTensionMode" class="tension-wrap">
        <div class="tension-bar-track">
          <div class="tension-danger-zone tension-danger-zone--low" />
          <div class="tension-safe-zone" :style="{ left: tensionMin + '%', width: (tensionMax - tensionMin) + '%' }" />
          <div class="tension-danger-zone tension-danger-zone--high" :style="{ left: tensionMax + '%' }" />
          <div class="tension-bar" :style="{ width: tension + '%' }" />
          <div class="tension-indicator" :style="{ left: tension + '%' }" />
        </div>
        <div class="tension-timer">
          <div class="tension-timer-fill" :style="{ width: (1 - tensionProgress) * 100 + '%' }" />
        </div>
        <p class="tension-hint" :class="{ 'tension-hint--good': tensionInZone }">
          {{ tensionInZone ? '✓ 保持住!' : '⚡ 快速点击保持张力!' }}
        </p>
      </div>

      <!-- 指针条模式 -->
      <div v-else class="bar-wrap">
        <div class="bar-track" :style="{ width: barWidth + 'px' }">
          <div class="bar-bg-red" />
          <div
            class="bar-zone bar-zone--yellow"
            :style="{ left: (greenStart - yellowWidth) + 'px', width: yellowWidth + 'px' }"
          />
          <div
            class="bar-zone bar-zone--green"
            :style="{ left: greenStart + 'px', width: greenWidth + 'px' }"
          />
          <div
            class="bar-zone bar-zone--yellow"
            :style="{ left: (greenStart + greenWidth) + 'px', width: yellowWidth + 'px' }"
          />
          <div
            class="bar-cursor"
            :class="{ 'bar-cursor--stopped': !active }"
            :style="{ left: pointerPos + 'px' }"
          />
        </div>
        <div class="bar-ruler" :style="{ width: barWidth + 'px' }">
          <span v-for="i in 10" :key="i" class="ruler-tick" />
        </div>
      </div>

      <div v-if="combo.count >= 2" class="combo-display">
        <span class="combo-count">{{ combo.count }}连击</span>
        <span class="combo-multiplier">x{{ combo.multiplier.toFixed(1) }}</span>
      </div>

      <div v-if="result && !isTensionMode" class="timing-result" :class="`timing-result--${result}`">
        {{ result === 'perfect' ? '★ 完美 ★' : result === 'good' ? '◆ 不错 ◆' : '✗ 失误' }}
      </div>

      <p v-else-if="!isTensionMode" class="timing-hint">
        ◈ 按 空格 / 点击 停下指针 ◈
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
$tb-bg: rgba(15, 10, 31, 0.92);
$tb-border: rgba(106, 90, 174, 0.25);
$tb-text: #E2E0D8;
$tb-text-dim: rgba(226, 224, 216, 0.5);
$tb-accent: #C8A04A;
$tb-success: #5AAE7A;
$tb-error: #E05A5A;
$tb-radius: 6px;

.timing-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  background: rgba(0, 0, 0, 0.45);
}

.timing-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 28px;
  background: $tb-bg;
  border: 1px solid $tb-border;
  border-radius: $tb-radius;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.6);
  animation: panel-in 0.25s ease;
  backdrop-filter: blur(6px);
  cursor: pointer;
  user-select: none;
}

@keyframes panel-in {
  from { opacity: 0; transform: scale(0.92) translateY(8px); }
}

.timing-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rarity-gem {
  width: 10px;
  height: 10px;
  transform: rotate(45deg);
  flex-shrink: 0;
}

.timing-fish-name {
  font-size: 16px;
  font-weight: 700;
  color: $tb-text;
  letter-spacing: 2px;
}

.rarity-tag {
  font-size: 10px;
  padding: 2px 8px;
  border: 1px solid;
  border-radius: $tb-radius;
  letter-spacing: 1px;
}

.stage-indicator {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.stage-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  transition: all 0.3s ease;

  &--perfect {
    background: $tb-success;
    border-color: $tb-success;
    box-shadow: 0 0 8px rgba(90, 174, 122, 0.6);
  }

  &--good {
    background: $tb-accent;
    border-color: $tb-accent;
    box-shadow: 0 0 8px rgba(200, 160, 74, 0.5);
  }

  &--miss {
    background: $tb-error;
    border-color: $tb-error;
    box-shadow: 0 0 8px rgba(224, 90, 90, 0.5);
  }
}

.tension-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 280px;
}

.tension-bar-track {
  position: relative;
  width: 100%;
  height: 32px;
  background: #1A1A2A;
  border: 1px solid $tb-border;
  border-radius: 4px;
  overflow: hidden;
}

.tension-danger-zone {
  position: absolute;
  top: 0;
  bottom: 0;
  background: rgba(224, 90, 90, 0.4);

  &--low { left: 0; width: 20%; }
  &--high { right: 0; width: 20%; left: auto; }
}

.tension-safe-zone {
  position: absolute;
  top: 0;
  bottom: 0;
  background: rgba(90, 174, 122, 0.3);
  border-left: 2px dashed $tb-success;
  border-right: 2px dashed $tb-success;
}

.tension-bar {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  background: linear-gradient(90deg, $tb-success, $tb-accent);
  transition: width 0.05s linear;
}

.tension-indicator {
  position: absolute;
  top: -4px;
  bottom: -4px;
  width: 4px;
  background: #fff;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
  transform: translateX(-2px);
  z-index: 2;
}

.tension-timer {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.tension-timer-fill {
  height: 100%;
  background: $tb-accent;
  transition: width 0.1s linear;
}

.tension-hint {
  font-size: 13px;
  color: $tb-error;
  letter-spacing: 1px;
  transition: color 0.2s;

  &--good {
    color: $tb-success;
  }
}

.bar-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bar-track {
  position: relative;
  height: 28px;
  border: 1px solid $tb-border;
  overflow: hidden;
  border-radius: 2px;
}

.bar-bg-red {
  position: absolute;
  inset: 0;
  background: $tb-error;
  opacity: 0.45;
}

.bar-zone {
  position: absolute;
  top: 0;
  bottom: 0;

  &--yellow {
    background: $tb-accent;
    opacity: 0.7;
  }
  &--green {
    background: $tb-success;
    opacity: 0.8;
  }
}

.bar-cursor {
  position: absolute;
  top: -4px;
  bottom: -4px;
  width: 4px;
  background: #fff;
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.6);
  transform: translateX(-2px);
  z-index: 2;

  &--stopped {
    animation: cursor-flash 0.2s ease 4;
  }
}

@keyframes cursor-flash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}

.bar-ruler {
  display: flex;
  justify-content: space-between;
  height: 4px;
}

.ruler-tick {
  width: 1px;
  height: 4px;
  background: $tb-text-dim;
  opacity: 0.3;
}

.combo-display {
  display: flex;
  align-items: center;
  gap: 8px;
  animation: combo-pop 0.3s ease;
}

@keyframes combo-pop {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

.combo-count {
  font-size: 14px;
  font-weight: 700;
  color: $tb-accent;
  letter-spacing: 1px;
}

.combo-multiplier {
  font-size: 12px;
  color: $tb-success;
  padding: 2px 6px;
  background: rgba(90, 174, 122, 0.2);
  border-radius: 4px;
}

.timing-result {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 3px;
  animation: result-pop 0.35s ease;

  &--perfect {
    color: $tb-success;
    text-shadow: 0 0 12px rgba(90, 174, 122, 0.5);
  }
  &--good {
    color: $tb-accent;
    text-shadow: 0 0 12px rgba(200, 160, 74, 0.4);
  }
  &--miss {
    color: $tb-error;
  }
}

@keyframes result-pop {
  0% { transform: scale(0.5); opacity: 0; }
  55% { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}

.timing-hint {
  font-size: 12px;
  color: $tb-text-dim;
  letter-spacing: 1px;
  animation: hint-pulse 1.4s ease infinite;
}

@keyframes hint-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
</style>
