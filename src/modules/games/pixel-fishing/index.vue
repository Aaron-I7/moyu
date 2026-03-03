<script setup lang="ts">
/**
 * 像素钓场 — 主入口
 * 整合 PixiJS 画布 + 所有 UI 组件
 */
import {
  ref, computed, watch, onMounted, onUnmounted, nextTick
} from 'vue'
import { usePixelFishingStore } from './stores/pixelFishing'
import { usePixiRenderer } from './composables/usePixiRenderer'
import { usePixelFishing } from './composables/usePixelFishing'
import { useSoundManager } from './composables/useSoundManager'
import { getFishById } from './data/fish'
import SpotSelector from './components/SpotSelector.vue'
import TimingBar from './components/TimingBar.vue'
import GameHUD from './components/GameHUD.vue'
import ResultPanel from './components/ResultPanel.vue'
import FishJournal from './components/FishJournal.vue'

const store = usePixelFishingStore()

// ─── Canvas ref ───
const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

// ─── Composables ───
const renderer = usePixiRenderer(canvasRef)
const game = usePixelFishing()
const sound = useSoundManager()

// ─── UI 状态 ───
const showJournal = ref(false)

// ─── 计算属性 ───
const isSpotSelect = computed(() => store.fishingState === 'spot-select')
const isTimingGame = computed(() => store.fishingState === 'timing-game')
const isResult = computed(() =>
  store.fishingState === 'success' || store.fishingState === 'failed'
)
const showCanvas = computed(() =>
  store.fishingState !== 'spot-select'
)

// 当前 Timing Bar 正在处理的鱼
const currentTimingFish = computed(() =>
  store.currentFishId ? getFishById(store.currentFishId) : null
)

// ─── 场景初始化 ───
onMounted(async () => {
  await nextTick()
  // 初始化音效
  sound.initSounds()
  sound.applySettings(store.state.settings)
  // 初始化 Pixi 渲染器
  if (canvasRef.value) {
    await renderer.init()
    handleResize()
  }
})

onUnmounted(() => {
  renderer.destroy()
  sound.destroy()
})

// ─── 选择钓点 → 加载场景 ───
function onSelectSpot(spotId: string) {
  store.selectSpot(spotId)

  const spot = store.currentSpot
  if (!spot) return

  // 加载对应的 PixiJS 场景
  renderer.loadScene(spot.environmentType)
  renderer.setViewMode(store.viewMode)

  // 播放场景 BGM / 环境音
  sound.playBgm(spot.bgmKey as any)
  sound.playAmbient(spot.ambientKey as any)

  nextTick(() => handleResize())
}

// ─── 返回钓点选择 ───
function onBack() {
  game.cancel()
  store.backToSpotSelect()
  sound.stopAll()
}

// ─── 视角切换 ───
function onToggleView() {
  store.toggleView()
  renderer.setViewMode(store.viewMode)
}

// ─── 图鉴 ───
function onToggleJournal() {
  showJournal.value = !showJournal.value
}

// ─── 静音切换 ───
function onToggleMute() {
  const muted = sound.toggleMute()
  store.updateSettings({ muted })
}

// ─── 钓鱼状态变化 → 同步渲染器 & 音效 ───
watch(
  () => store.fishingState,
  (state) => {
    renderer.updateFishingState(state)

    switch (state) {
      case 'casting':
        sound.playSfx('sfx-cast')
        break
      case 'waiting':
        sound.playSfx('sfx-splash')
        break
      case 'biting':
        sound.playSfx('sfx-bite')
        break
      case 'timing-game':
        // Timing Bar 组件自行管理
        break
      case 'catch-animation': {
        // ★ 鱼跃出水面动画（在结算面板之前）
        sound.playSfx('sfx-catch')
        if (store.currentFishId) {
          renderer.showCaughtFish(store.currentFishId)
        }
        break
      }
      case 'success': {
        // 结算面板显示（动画已在 catch-animation 中播放）
        break
      }
      case 'failed':
        sound.playSfx('sfx-fail')
        break
    }
  }
)

// ─── Timing Bar 单次结果回调 ───
function onTimingResultFromBar(result: import('./types').TimingResult) {
  game.onTimingResult(result)
}

// ─── Timing Bar 多阶段完成回调 ───
function onTimingComplete(results: import('./types').TimingResult[]) {
  game.onTimingComplete(results)
}

// ─── 键盘控制 ───
function handleKeydown(e: KeyboardEvent) {
  if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return

  switch (e.code) {
    case 'Space':
    case 'Enter':
      e.preventDefault()
      if (store.fishingState === 'idle') {
        game.startCast()
      } else if (store.fishingState === 'biting') {
        game.hookFish()
      } else if (['success', 'failed', 'catch-animation'].includes(store.fishingState)) {
        game.skipResult()
      }
      break
    case 'Escape':
      e.preventDefault()
      if (showJournal.value) {
        showJournal.value = false
      } else if (store.fishingState !== 'spot-select') {
        onBack()
      }
      break
    case 'KeyV':
      if (showCanvas.value) onToggleView()
      break
    case 'KeyM':
      onToggleMute()
      break
    case 'KeyJ':
      onToggleJournal()
      break
  }
}

// ─── 鼠标左键甩杆 ───
function handleCanvasClick(e: MouseEvent) {
  if (e.button !== 0) return
  
  if (store.fishingState === 'idle') {
    game.startCast()
  } else if (store.fishingState === 'biting') {
    game.hookFish()
  } else if (['success', 'failed', 'catch-animation'].includes(store.fishingState)) {
    game.skipResult()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// ─── 窗口缩放 ───
function handleResize() {
  if (!containerRef.value) return
  const { clientWidth, clientHeight } = containerRef.value
  renderer.resize(clientWidth, clientHeight)
}

let resizeObserver: ResizeObserver | null = null
onMounted(() => {
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => handleResize())
    resizeObserver.observe(containerRef.value)
  }
})
onUnmounted(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <div class="pixel-fishing" ref="containerRef">
    <!-- 钓点选择界面 -->
    <SpotSelector
      v-if="isSpotSelect"
      @select="onSelectSpot"
    />

    <!-- PixiJS 画布 -->
    <div v-show="showCanvas" class="canvas-wrapper">
      <canvas 
        ref="canvasRef" 
        class="pixel-canvas" 
        @click="handleCanvasClick"
      />

      <!-- HUD 覆层 -->
      <GameHUD
        @back-to-spots="onBack"
        @toggle-view="onToggleView"
        @open-journal="onToggleJournal"
        @toggle-mute="onToggleMute"
      />

      <!-- Timing Bar 小游戏 -->
      <TimingBar
        v-if="isTimingGame && currentTimingFish"
        :fish="currentTimingFish"
        @result="onTimingResultFromBar"
        @complete="onTimingComplete"
      />

      <!-- 结果面板 -->
      <ResultPanel
        v-if="isResult"
        :fish="game.targetFish.value"
        :record="game.lastCatch.value"
        :is-new="game.isNewSpecies.value"
        :success="store.fishingState === 'success'"
        @close="game.skipResult()"
      />

      <!-- 鱼类图鉴 -->
      <FishJournal
        v-if="showJournal"
        @close="showJournal = false"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.pixel-fishing {
  position: relative;
  width: 100%;
  min-height: calc(100vh - 56px);
  margin-top: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0F0A1F;
  overflow: visible;
  user-select: none;
}

.canvas-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: calc(100vh - 56px);
  // 内框暗色渐变装饰
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 1;
    box-shadow: inset 0 0 80px 20px rgba(10, 6, 24, 0.5);
  }
}

.pixel-canvas {
  display: block;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  border: 3px solid #1E1438;
  border-radius: 4px;
  box-shadow:
    0 0 0 1px rgba(106, 90, 174, 0.15),
    0 4px 24px rgba(0, 0, 0, 0.6),
    0 0 60px rgba(106, 90, 174, 0.06);
}
</style>
