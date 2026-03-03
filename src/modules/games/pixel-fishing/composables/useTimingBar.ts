import { ref, computed, onUnmounted } from 'vue'
import type { Fish, TimingResult, ComboState } from '../types'

export function useTimingBar() {
  const barWidth = 300
  const pointerPos = ref(0)
  const greenStart = ref(0)
  const greenWidth = ref(100)
  const yellowWidth = ref(20)
  const speed = ref(150)
  const direction = ref(1)
  const greenMoving = ref(false)
  const greenMoveSpeed = ref(30)
  const greenMoveDir = ref(1)

  const active = ref(false)
  const result = ref<TimingResult | null>(null)
  
  const currentStage = ref(0)
  const totalStages = ref(1)
  const stageResults = ref<TimingResult[]>([])
  
  const combo = ref<ComboState>({
    count: 0,
    multiplier: 1,
    lastTiming: null,
    timings: []
  })

  const isTensionMode = ref(false)
  const tension = ref(50)
  const tensionDecay = ref(8)
  const tensionClickBoost = ref(12)
  const tensionMin = ref(20)
  const tensionMax = ref(80)
  const tensionDuration = ref(5000)
  const tensionElapsed = ref(0)
  const tensionSuccess = ref(false)

  const stageProgress = computed(() => 
    totalStages.value > 0 ? currentStage.value / totalStages.value : 0
  )

  const comboText = computed(() => {
    if (combo.value.count >= 5) return '完美连击!'
    if (combo.value.count >= 3) return '连击中!'
    if (combo.value.count >= 2) return '不错!'
    return ''
  })

  const tensionInZone = computed(() => 
    tension.value >= tensionMin.value && tension.value <= tensionMax.value
  )

  const tensionProgress = computed(() => 
    tensionElapsed.value / tensionDuration.value
  )

  let rafId: number | null = null
  let lastTime = 0

  function start(fish: Fish) {
    const gzPct = fish.timingBarGreenZone
    greenWidth.value = Math.round(barWidth * gzPct)
    yellowWidth.value = Math.round(barWidth * 0.08)
    speed.value = fish.timingBarSpeed
    greenMoving.value = fish.timingBarMoving

    const maxStart = barWidth - greenWidth.value - yellowWidth.value * 2
    greenStart.value = yellowWidth.value + Math.random() * Math.max(maxStart, 0)

    greenMoveSpeed.value = fish.timingBarMoving ? 20 + fish.catchDifficulty * 3 : 0
    greenMoveDir.value = 1

    pointerPos.value = 0
    direction.value = 1
    result.value = null
    active.value = true
    lastTime = performance.now()
    
    totalStages.value = fish.stages || 1
    currentStage.value = 0
    stageResults.value = []
    isTensionMode.value = false
    tension.value = 50
    tensionElapsed.value = 0

    tick()
  }

  function tick() {
    if (!active.value) return

    const now = performance.now()
    const dt = (now - lastTime) / 1000
    lastTime = now

    if (isTensionMode.value) {
      tickTension(dt)
    } else {
      tickPointer(dt)
    }

    rafId = requestAnimationFrame(tick)
  }

  function tickPointer(dt: number) {
    pointerPos.value += direction.value * speed.value * dt
    if (pointerPos.value >= barWidth) {
      pointerPos.value = barWidth
      direction.value = -1
    } else if (pointerPos.value <= 0) {
      pointerPos.value = 0
      direction.value = 1
    }

    if (greenMoving.value) {
      greenStart.value += greenMoveDir.value * greenMoveSpeed.value * dt
      const minG = yellowWidth.value
      const maxG = barWidth - greenWidth.value - yellowWidth.value
      if (greenStart.value >= maxG) {
        greenStart.value = maxG
        greenMoveDir.value = -1
      } else if (greenStart.value <= minG) {
        greenStart.value = minG
        greenMoveDir.value = 1
      }
    }
  }

  function tickTension(dt: number) {
    tension.value -= tensionDecay.value * dt
    tension.value = Math.max(0, Math.min(100, tension.value))
    
    tensionElapsed.value += dt * 1000
    
    if (tensionElapsed.value >= tensionDuration.value) {
      active.value = false
      tensionSuccess.value = tensionInZone.value
      const r: TimingResult = tensionSuccess.value ? 'perfect' : 'miss'
      result.value = r
      stageResults.value.push(r)
      updateCombo(r)
    }
  }

  function onTensionClick() {
    if (!isTensionMode.value || !active.value) return
    tension.value += tensionClickBoost.value
    tension.value = Math.min(100, tension.value)
  }

  function stop(): TimingResult {
    if (isTensionMode.value) {
      return result.value || 'miss'
    }

    active.value = false
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }

    const pos = pointerPos.value
    const gs = greenStart.value
    const gw = greenWidth.value
    const yw = yellowWidth.value

    const greenEnd = gs + gw
    const yellowLeftStart = gs - yw
    const yellowRightEnd = greenEnd + yw

    if (pos >= gs && pos <= greenEnd) {
      result.value = 'perfect'
    } else if (
      (pos >= yellowLeftStart && pos < gs) ||
      (pos > greenEnd && pos <= yellowRightEnd)
    ) {
      result.value = 'good'
    } else {
      result.value = 'miss'
    }

    stageResults.value.push(result.value)
    currentStage.value++
    
    updateCombo(result.value)

    return result.value
  }

  function updateCombo(timing: TimingResult) {
    if (timing === 'perfect') {
      combo.value.count++
      combo.value.multiplier = 1 + (combo.value.count - 1) * 0.25
    } else if (timing === 'good') {
      combo.value.count = Math.max(1, combo.value.count)
      combo.value.multiplier = 1 + (combo.value.count - 1) * 0.1
    } else {
      combo.value.count = 0
      combo.value.multiplier = 1
    }
    combo.value.lastTiming = timing
    combo.value.timings.push(timing)
  }

  function continueToNextStage(): boolean {
    if (currentStage.value >= totalStages.value) return false
    
    const lastResult = stageResults.value[stageResults.value.length - 1]
    if (lastResult === 'miss') return false

    currentStage.value++
    result.value = null
    active.value = true
    lastTime = performance.now()
    
    if (currentStage.value >= 1) {
      isTensionMode.value = true
      tension.value = 50
      tensionElapsed.value = 0
      tensionDecay.value = 8 + currentStage.value * 2
    } else {
      pointerPos.value = 0
      direction.value = 1
      const maxStart = barWidth - greenWidth.value - yellowWidth.value * 2
      greenStart.value = yellowWidth.value + Math.random() * Math.max(maxStart, 0)
    }
    
    tick()
    return true
  }

  function isComplete(): boolean {
    return currentStage.value >= totalStages.value
  }

  function getFinalResult(): TimingResult {
    const perfectCount = stageResults.value.filter(r => r === 'perfect').length
    const missCount = stageResults.value.filter(r => r === 'miss').length
    
    if (missCount > 0) return 'miss'
    if (perfectCount === stageResults.value.length) return 'perfect'
    return 'good'
  }

  function cancel() {
    active.value = false
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  function resetCombo() {
    combo.value = {
      count: 0,
      multiplier: 1,
      lastTiming: null,
      timings: []
    }
  }

  onUnmounted(() => {
    cancel()
  })

  return {
    barWidth,
    pointerPos,
    greenStart,
    greenWidth,
    yellowWidth,
    speed,
    active,
    result,
    greenMoving,
    currentStage,
    totalStages,
    stageResults,
    stageProgress,
    combo,
    comboText,
    isTensionMode,
    tension,
    tensionMin,
    tensionMax,
    tensionInZone,
    tensionProgress,
    tensionSuccess,
    start,
    stop,
    onTensionClick,
    continueToNextStage,
    isComplete,
    getFinalResult,
    cancel,
    resetCombo
  }
}
