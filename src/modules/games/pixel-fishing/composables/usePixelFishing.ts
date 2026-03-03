/**
 * 像素钓场 — 核心游戏逻辑状态机
 */
import { ref, onUnmounted } from 'vue'
import type { Fish, CatchRecord } from '../types'
import { BITE_WAIT_RANGE, BITE_RESPONSE_TIME, CAST_DURATION, RARITY_WEIGHTS } from '../constants'
import { usePixelFishingStore } from '../stores/pixelFishing'
import { getFishBySpot } from '../data/fish'

export function usePixelFishing() {
  const store = usePixelFishingStore()

  // 运行时状态
  const targetFish = ref<Fish | null>(null)
  const lastCatch = ref<CatchRecord | null>(null)
  const isNewSpecies = ref(false)

  // 计时器 ID
  let biteTimer: number | null = null
  let responseTimer: number | null = null
  let resultTimer: number | null = null
  let castTimer: number | null = null

  function clearAllTimers() {
    if (biteTimer !== null) { clearTimeout(biteTimer); biteTimer = null }
    if (responseTimer !== null) { clearTimeout(responseTimer); responseTimer = null }
    if (resultTimer !== null) { clearTimeout(resultTimer); resultTimer = null }
    if (castTimer !== null) { clearTimeout(castTimer); castTimer = null }
  }

  /** 随机选择一条鱼（加权随机 by rarity） */
  function pickFish(): Fish | null {
    const spotId = store.currentSpotId
    if (!spotId) return null

    const fishes = getFishBySpot(spotId)
    if (fishes.length === 0) return null

    // 加权随机
    const weighted = fishes.map(f => ({
      fish: f,
      weight: RARITY_WEIGHTS[f.rarity] ?? 10
    }))
    const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0)
    let roll = Math.random() * totalWeight

    for (const w of weighted) {
      roll -= w.weight
      if (roll <= 0) return w.fish
    }
    return fishes[0] ?? null
  }

  /** 开始抛竿 */
  function startCast() {
    if (store.fishingState !== 'idle') return
    clearAllTimers()

    store.setFishingState('casting')

    // 抛竿动画后进入等待
    castTimer = window.setTimeout(() => {
      store.setFishingState('waiting')
      waitForBite()
    }, CAST_DURATION)
  }

  /** 等待鱼咬钩 */
  function waitForBite() {
    const fishResult = pickFish()
    targetFish.value = fishResult
    store.setCurrentFish(fishResult?.id ?? null)

    const delay = BITE_WAIT_RANGE[0] + Math.random() * (BITE_WAIT_RANGE[1] - BITE_WAIT_RANGE[0])

    biteTimer = window.setTimeout(() => {
      if (store.fishingState !== 'waiting') return
      store.setFishingState('biting')
      startResponseCountdown()
    }, delay)
  }

  /** 咬钩后的响应倒计时 */
  function startResponseCountdown() {
    responseTimer = window.setTimeout(() => {
      if (store.fishingState !== 'biting') return
      // 超时 → 鱼跑了
      onFishEscaped()
    }, BITE_RESPONSE_TIME)
  }

  /** 玩家在咬钩时按下确认 → 进入 Timing Bar */
  function hookFish() {
    if (store.fishingState !== 'biting') return
    clearAllTimers()
    store.setFishingState('timing-game')
  }

  /** Timing Bar 单次结果回调（用于失败情况） */
  function onTimingResult(hit: 'perfect' | 'good' | 'miss') {
    if (store.fishingState !== 'timing-game') return

    if (hit === 'miss') {
      onFishEscaped()
    }
  }

  /** Timing Bar 多阶段完成回调 */
  function onTimingComplete(results: ('perfect' | 'good' | 'miss')[]) {
    if (store.fishingState !== 'timing-game') return

    const hasMiss = results.some(r => r === 'miss')
    if (hasMiss) {
      onFishEscaped()
      return
    }

    const allPerfect = results.every(r => r === 'perfect')
    if (!allPerfect) {
      // 有 good 的情况，50% 概率成功
      if (Math.random() > 0.5) {
        onFishEscaped()
        return
      }
    }

    // 成功！
    onCatchSuccess()
  }

  /** 钓获成功 */
  function onCatchSuccess() {
    if (!targetFish.value) {
      resetToIdle()
      return
    }

    const fish = targetFish.value
    const size = +(fish.sizeRange[0] + Math.random() * (fish.sizeRange[1] - fish.sizeRange[0])).toFixed(1)
    const weight = +(fish.weightRange[0] + Math.random() * (fish.weightRange[1] - fish.weightRange[0])).toFixed(2)

    // 检查是否是新物种
    const entry = store.state.journal[fish.id]
    isNewSpecies.value = entry ? !entry.caught : true

    const record = store.recordCatch(fish.id, size, weight)
    lastCatch.value = record

    // ★ 先播放鱼跃出水面的动画，再显示结算面板
    store.setFishingState('catch-animation')

    castTimer = window.setTimeout(() => {
      store.setFishingState('success')
      // 不再自动关闭，等待用户点击
    }, 2000) // 2 秒跳鱼动画
  }

  /** 鱼逃跑 */
  function onFishEscaped() {
    clearAllTimers()
    store.setFishingState('failed')
    // 不再自动关闭，等待用户点击
  }

  /** 回到空闲 */
  function resetToIdle() {
    clearAllTimers()
    targetFish.value = null
    lastCatch.value = null
    isNewSpecies.value = false
    store.setCurrentFish(null)
    store.setFishingState('idle')
  }

  /** 取消当前操作（回到空闲） */
  function cancel() {
    clearAllTimers()
    targetFish.value = null
    store.setCurrentFish(null)
    store.setFishingState('idle')
  }

  /** 跳过结果展示 */
  function skipResult() {
    if (store.fishingState === 'success' || store.fishingState === 'failed' || store.fishingState === 'catch-animation') {
      clearAllTimers()
      resetToIdle()
    }
  }

  onUnmounted(() => {
    clearAllTimers()
  })

  return {
    targetFish,
    lastCatch,
    isNewSpecies,
    startCast,
    hookFish,
    onTimingResult,
    onTimingComplete,
    cancel,
    skipResult,
    resetToIdle
  }
}
