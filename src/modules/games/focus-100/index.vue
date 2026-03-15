<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import FocusSuccessCelebration from './components/FocusSuccessCelebration.vue'

type RuleMode = 'normal' | 'redBlack'
type GameState = 'idle' | 'playing' | 'done'
type Point = { x: number; y: number }
type CellTone = 'normal' | 'red' | 'black'
type CellShape = { id: string; num: number; tone: CellTone; cx: number; cy: number; pointsAttr: string; clipId: string; fontSize: number }
type TargetStep = { num: number; tone: CellTone }
type MemoryStyle = 'dim' | 'mark' | 'hide'

const BOARD_W = 700
const BOARD_H = 520
const { t } = useI18n({ useScope: 'global' })

const ruleMode = ref<RuleMode>('normal')
const state = ref<GameState>('idle')
const cells = ref<CellShape[]>([])
const targetSequence = ref<TargetStep[]>([])
const targetIndex = ref(0)
const doneCellIds = ref<string[]>([])
const completed = ref(0)
const errors = ref(0)
const wrongFlashNum = ref<number | null>(null)
const boardShake = ref(false)
const messageKey = ref('modules.focus100.ready')
const messageArgs = ref<Record<string, string | number>>({})
const elapsed = ref(0)
const boardWrapRef = ref<HTMLElement | null>(null)
const maxNumber = ref(100)
const maxNumberInput = ref('100')
const rememberDone = ref(true)
const memoryStyle = ref<MemoryStyle>('mark')
const fullscreenBoard = ref(false)
const showSuccess = ref(false)
const finishedTimeText = ref('--:--')
let timerId: number | null = null

const storageKey = 'focus-100-stats'
const bestTime = ref(0)

const target = computed(() => targetSequence.value[targetIndex.value] ?? null)
const progress = computed(() => completed.value)
const progressPercent = computed(() => `${Math.min(100, (progress.value / Math.max(1, targetSequence.value.length)) * 100)}%`)
const comboLabel = computed(() => t('modules.focus100.completedLabel'))
const comboValue = computed(() => completed.value)
const bestTimeText = computed(() => (bestTime.value ? formatClock(bestTime.value) : '--:--'))
const isRedTarget = computed(() => {
  if (!target.value) return false
  return target.value.tone === 'red'
})

function setMessage(key: string, args: Record<string, string | number> = {}) {
  messageKey.value = key
  messageArgs.value = args
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function formatClock(value: number) {
  return `${pad(Math.floor(value / 60))}:${pad(value % 60)}`
}

function shuffle<T>(list: T[]) {
  const next = [...list]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = next[i]
    next[i] = next[j] as T
    next[j] = temp as T
  }
  return next
}

function clearTimer() {
  if (timerId !== null) {
    window.clearInterval(timerId)
    timerId = null
  }
}

function randomRange(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function clipPolygonHalfPlane(poly: Point[], a: number, b: number, c: number) {
  if (!poly.length) return []
  const output: Point[] = []
  const eps = 1e-6
  for (let i = 0; i < poly.length; i += 1) {
    const current = poly[i] as Point
    const prev = poly[(i + poly.length - 1) % poly.length] as Point
    const currVal = a * current.x + b * current.y - c
    const prevVal = a * prev.x + b * prev.y - c
    const currInside = currVal <= eps
    const prevInside = prevVal <= eps
    if (currInside !== prevInside) {
      const dx = current.x - prev.x
      const dy = current.y - prev.y
      const denominator = a * dx + b * dy
      if (Math.abs(denominator) > eps) {
        const t = (c - a * prev.x - b * prev.y) / denominator
        output.push({
          x: prev.x + dx * t,
          y: prev.y + dy * t
        })
      }
    }
    if (currInside) output.push(current)
  }
  return output
}

function buildTargetSequence(limit: number, rule: RuleMode) {
  if (rule === 'normal') {
    return Array.from({ length: limit }, (_, i) => ({ num: i + 1, tone: 'normal' as CellTone }))
  }
  const seq: TargetStep[] = []
  for (let i = 1; i <= limit; i += 1) {
    seq.push({ num: i, tone: 'red' })
    seq.push({ num: i, tone: 'black' })
  }
  return seq
}

function buildVoronoiCells(seed: Array<{ id: string; num: number; tone: CellTone }>) {
  const cols = Math.max(2, Math.ceil(Math.sqrt((seed.length * BOARD_W) / BOARD_H)))
  const rows = Math.max(2, Math.ceil(seed.length / cols))
  const cellW = BOARD_W / cols
  const cellH = BOARD_H / rows
  const sites: Point[] = []

  for (let i = 0; i < seed.length; i += 1) {
    const row = Math.floor(i / cols)
    const col = i % cols
    sites.push({
      x: (col + 0.5) * cellW + randomRange(-cellW * 0.38, cellW * 0.38),
      y: (row + 0.5) * cellH + randomRange(-cellH * 0.38, cellH * 0.38)
    })
  }

  const bbox: Point[] = [
    { x: 1, y: 1 },
    { x: BOARD_W - 1, y: 1 },
    { x: BOARD_W - 1, y: BOARD_H - 1 },
    { x: 1, y: BOARD_H - 1 }
  ]

  const drafts: Array<{
    id: string
    num: number
    tone: CellTone
    cx: number
    cy: number
    pointsAttr: string
    minSide: number
  }> = []
  for (let i = 0; i < sites.length; i += 1) {
    const s = sites[i] as Point
    let poly = [...bbox]
    for (let j = 0; j < sites.length; j += 1) {
      if (i === j) continue
      const t = sites[j] as Point
      const mx = (s.x + t.x) / 2
      const my = (s.y + t.y) / 2
      const a = t.x - s.x
      const b = t.y - s.y
      const c = a * mx + b * my
      poly = clipPolygonHalfPlane(poly, a, b, c)
      if (!poly.length) break
    }
    if (poly.length < 3) continue
    let minX = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY
    poly.forEach((p) => {
      minX = Math.min(minX, p.x)
      maxX = Math.max(maxX, p.x)
      minY = Math.min(minY, p.y)
      maxY = Math.max(maxY, p.y)
    })
    const minSide = Math.max(10, Math.min(maxX - minX, maxY - minY))
    drafts.push({
      id: seed[i]!.id,
      num: seed[i]!.num,
      tone: seed[i]!.tone,
      cx: s.x,
      cy: s.y,
      pointsAttr: poly.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' '),
      minSide
    })
  }
  const minCellSide = drafts.length ? Math.min(...drafts.map((d) => d.minSide)) : 12
  const densityFactor = Math.sqrt(40 / Math.max(1, seed.length))
  // Adjusted for bigger font size preference
  const globalCap = Math.max(9, Math.min(18, minCellSide * 0.45 * densityFactor))
  const next: CellShape[] = drafts.map((d) => {
    const digits = String(d.num).length
    const widthLimit = (d.minSide * 0.75) / (digits * 0.6)
    const heightLimit = d.minSide * 0.42
    const localCap = Math.min(widthLimit, heightLimit)
    const fontSize = Math.max(8, Math.min(globalCap, localCap))
    return {
      ...d,
      clipId: `focus-cell-clip-${d.id}`,
      fontSize: Math.round(fontSize)
    }
  })
  cells.value = next
}

function buildSeed(limit: number, rule: RuleMode) {
  if (rule === 'normal') {
    return shuffle(Array.from({ length: limit }, (_, i) => ({ id: `n-${i + 1}`, num: i + 1, tone: 'normal' as CellTone })))
  }
  const rows: Array<{ id: string; num: number; tone: CellTone }> = []
  for (let i = 1; i <= limit; i += 1) {
    rows.push({ id: `r-${i}`, num: i, tone: 'red' })
    rows.push({ id: `b-${i}`, num: i, tone: 'black' })
  }
  return shuffle(rows)
}

function loadStats() {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return
    const parsed = JSON.parse(raw) as { bestTime?: number }
    bestTime.value = Math.max(0, Number(parsed.bestTime || 0))
  } catch {
    bestTime.value = 0
  }
}

function saveStats() {
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      bestTime: bestTime.value
    })
  )
}

function cellOpacity() {
  return 1
}

function applyMaxNumber() {
  const parsed = Number(maxNumberInput.value)
  if (!Number.isFinite(parsed)) {
    maxNumberInput.value = String(maxNumber.value)
    return
  }
  const next = Math.max(10, Math.min(100, Math.floor(parsed)))
  maxNumber.value = next
  maxNumberInput.value = String(next)
  startGame()
}

function switchRule(next: RuleMode) {
  ruleMode.value = next
  startGame()
}

async function syncFullscreen() {
  const active = document.fullscreenElement === boardWrapRef.value
  if (fullscreenBoard.value === active) return
  fullscreenBoard.value = active
}

async function toggleBoardFullscreen() {
  try {
    if (fullscreenBoard.value) {
      if (boardWrapRef.value) {
        await boardWrapRef.value.requestFullscreen()
      }
      return
    }
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    }
  } catch {
    fullscreenBoard.value = false
  }
}

function startGame() {
  clearTimer()
  const limit = maxNumber.value
  buildVoronoiCells(buildSeed(limit, ruleMode.value))
  targetSequence.value = buildTargetSequence(limit, ruleMode.value)
  targetIndex.value = 0
  doneCellIds.value = []
  completed.value = 0
  errors.value = 0
  elapsed.value = 0
  state.value = 'playing'
  showSuccess.value = false
  wrongFlashNum.value = null
  boardShake.value = false
  setMessage('modules.focus100.msgStartBright', { n: limit })
  timerId = window.setInterval(() => {
    elapsed.value += 1
  }, 1000)
}

function finishGame() {
  if (state.value === 'done') return
  state.value = 'done'
  clearTimer()
  const used = elapsed.value
  finishedTimeText.value = formatClock(used)
  bestTime.value = bestTime.value === 0 ? used : Math.min(bestTime.value, used)
  saveStats()
  setMessage('modules.focus100.msgWin', { time: formatClock(used) })
  showSuccess.value = true
}

function onCellClick(cell: CellShape) {
  if (state.value !== 'playing') return
  if (target.value && cell.num === target.value.num && cell.tone === target.value.tone) {
    completed.value += 1
    doneCellIds.value.push(cell.id)
    targetIndex.value += 1
    if (targetIndex.value >= targetSequence.value.length) {
      finishGame()
    } else {
      setMessage('modules.focus100.msgCorrect', { value: target.value?.num as number })
    }
    return
  }
  errors.value += 1
  wrongFlashNum.value = cell.num
  boardShake.value = true
  window.setTimeout(() => {
    boardShake.value = false
  }, 360)
  window.setTimeout(() => {
    if (wrongFlashNum.value === cell.num) wrongFlashNum.value = null
  }, 320)
  setMessage('modules.focus100.msgWrong', { value: target.value?.num ?? '-' })
}

const doneSet = computed(() => {
  return new Set(doneCellIds.value)
})

function colorTone(cell: CellShape) {
  return cell.tone
}

function closeSuccess() {
  showSuccess.value = false
}

function restartFromSuccess() {
  showSuccess.value = false
  startGame()
}

onMounted(() => {
  loadStats()
  document.addEventListener('fullscreenchange', syncFullscreen)
  startGame()
})

onBeforeUnmount(() => {
  clearTimer()
  document.removeEventListener('fullscreenchange', syncFullscreen)
})
</script>

<template>
  <div class="page">
    <div class="page-inner">
      <div class="header">
        <h1>{{ t('modules.focus100.title') }}</h1>
        <p>{{ t('modules.focus100.subtitle') }}</p>
      </div>

      <div class="panel">
        <div class="content-grid">
          <section class="play-area">
            <div class="toolbar">
              <div class="toolbar-group">
                <div class="control-item">
                  <span class="control-label">{{ t('modules.focus100.rangeLabel') }}</span>
                  <div class="input-with-action">
                    <input v-model="maxNumberInput" type="number" min="10" max="100" step="1" class="number-input">
                    <button class="action-btn" @click="applyMaxNumber">{{ t('modules.focus100.apply') }}</button>
                  </div>
                </div>

                <div class="control-item">
                  <span class="control-label">{{ t('modules.focus100.ruleLabel') || 'Mode' }}</span>
                  <div class="segmented-control">
                    <button 
                      class="segment-btn" 
                      :class="{ active: ruleMode === 'normal' }" 
                      @click="switchRule('normal')"
                    >
                      {{ t('modules.focus100.ruleNormal') }}
                    </button>
                    <button 
                      class="segment-btn" 
                      :class="{ active: ruleMode === 'redBlack' }" 
                      @click="switchRule('redBlack')"
                    >
                      {{ t('modules.focus100.ruleRedBlack') }}
                    </button>
                  </div>
                </div>
              </div>

              <div class="toolbar-divider"></div>

              <div class="toolbar-group secondary">
                <div class="control-item">
                  <span class="control-label">{{ t('modules.focus100.memoryStyle') }}</span>
                  <select v-model="memoryStyle" class="select-input">
                    <option value="mark">{{ t('modules.focus100.memoryMark') }}</option>
                    <option value="dim">{{ t('modules.focus100.memoryDim') }}</option>
                    <option value="hide">{{ t('modules.focus100.memoryHide') }}</option>
                  </select>
                </div>

                <div class="toggles-group">
                  <label class="toggle-btn" :class="{ active: rememberDone }">
                    <input v-model="rememberDone" type="checkbox" class="sr-only">
                    <span class="toggle-icon">✓</span>
                    <span class="toggle-text">{{ t('modules.focus100.rememberDone') }}</span>
                  </label>
                  
                  <label class="toggle-btn" :class="{ active: fullscreenBoard }">
                    <input v-model="fullscreenBoard" type="checkbox" class="sr-only" @change="toggleBoardFullscreen">
                    <span class="toggle-icon">⛶</span>
                    <span class="toggle-text">{{ t('modules.focus100.fullscreenBoard') }}</span>
                  </label>
                </div>
              </div>
            </div>

            <div class="stats">
              <div class="stat">
                <span>{{ t('modules.focus100.target') }}</span>
                <strong :data-tone="isRedTarget ? 'red' : 'normal'">{{ target?.num ?? '✓' }}</strong>
              </div>
              <div class="stat">
                <span>{{ t('modules.focus100.timerUp') }}</span>
                <strong>{{ formatClock(elapsed) }}</strong>
              </div>
              <div class="stat">
                <span>{{ comboLabel }}</span>
                <strong>{{ comboValue }}</strong>
              </div>
              <div class="stat">
                <span>{{ t('modules.focus100.errors') }}</span>
                <strong>{{ errors }}</strong>
              </div>
            </div>

            <div class="progress">
              <div class="fill" :style="{ width: progressPercent }" />
            </div>

            <div class="notice">{{ t(messageKey, messageArgs) }}</div>

            <div ref="boardWrapRef" class="board-wrap">
              <div
                class="board"
                :class="{ 'is-shaking': boardShake }"
              >
                <svg class="board-svg" viewBox="0 0 700 520" preserveAspectRatio="none">
                  <defs>
                    <clipPath v-for="cell in cells" :id="cell.clipId" :key="`${cell.id}-clip`">
                      <polygon :points="cell.pointsAttr" />
                    </clipPath>
                  </defs>
                  <g v-for="cell in cells" :key="cell.id">
                    <polygon
                      class="cell-shape"
                      :data-tone="colorTone(cell)"
                      :data-done="doneSet.has(cell.id)"
                      :data-wrong="wrongFlashNum === cell.num"
                      :data-memory-style="memoryStyle"
                      :points="cell.pointsAttr"
                      :style="{ opacity: rememberDone && doneSet.has(cell.id) && memoryStyle === 'dim' ? 0.25 : rememberDone && doneSet.has(cell.id) && memoryStyle === 'hide' ? 0.12 : cellOpacity() }"
                      @click="onCellClick(cell)"
                    />
                    <text
                      class="cell-label"
                      :data-tone="colorTone(cell)"
                      :data-memory-style="memoryStyle"
                      :x="cell.cx"
                      :y="cell.cy"
                      dominant-baseline="middle"
                      text-anchor="middle"
                      :style="{ opacity: rememberDone && doneSet.has(cell.id) && memoryStyle === 'hide' ? 0 : rememberDone && doneSet.has(cell.id) && memoryStyle === 'dim' ? 0.24 : 1, fontSize: `${cell.fontSize}px`, clipPath: `url(#${cell.clipId})` }"
                    >
                      {{ rememberDone && doneSet.has(cell.id) && memoryStyle === 'mark' ? '✓' : cell.num }}
                    </text>
                  </g>
                </svg>
              </div>
            </div>

            <div class="ctrls">
              <button class="restart" @click="startGame">{{ t('modules.focus100.restart') }}</button>
              <span class="record">{{ t('modules.focus100.bestTime') }} {{ bestTimeText }}</span>
            </div>
          </section>

          <aside class="sidebar">
            <h3>{{ t('modules.focus100.sidebarTitle') }}</h3>
            <p>{{ t('modules.focus100.sidebarIntro') }}</p>
            <div class="side-block">
              <div class="side-title">{{ t('modules.focus100.sidebarMethodTitle') }}</div>
              <ul>
                <li>{{ t('modules.focus100.sidebarMethod1') }}</li>
                <li>{{ t('modules.focus100.sidebarMethod2') }}</li>
                <li>{{ t('modules.focus100.sidebarMethod3') }}</li>
              </ul>
            </div>
            <div class="side-block">
              <div class="side-title">{{ t('modules.focus100.sidebarTipsTitle') }}</div>
              <ul>
                <li>{{ t('modules.focus100.sidebarTip1') }}</li>
                <li>{{ t('modules.focus100.sidebarTip2') }}</li>
                <li>{{ t('modules.focus100.sidebarTip3') }}</li>
              </ul>
            </div>
            <p class="side-effect">{{ t('modules.focus100.sidebarEffect') }}</p>
          </aside>
        </div>
      </div>
    </div>
    <FocusSuccessCelebration
      :visible="showSuccess"
      :time-text="finishedTimeText"
      :best-time-text="bestTimeText"
      :completed="completed"
      :errors="errors"
      :total="targetSequence.length"
      @close="closeSuccess"
      @restart="restartFromSuccess"
    />
  </div>
</template>

<style scoped lang="scss">
.page {
  min-height: 100%;
  padding-top: 56px;
}

.page-inner {
  max-width: 1040px;
  margin: 0 auto;
  padding: 20px 12px 32px;
}

.header {
  margin-bottom: 14px;

  h1 {
    margin: 0 0 6px;
    font-size: 30px;
    color: var(--color-text);
  }

  p {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 14px;
  }
}

.panel {
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  background: color-mix(in srgb, var(--color-surface) 94%, transparent);
  box-shadow: var(--shadow);
  padding: 14px;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 14px;
}

.play-area {
  min-width: 0;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 16px;
  padding: 16px;
  border: 1px solid color-mix(in srgb, var(--color-border) 80%, transparent);
  border-radius: 16px;
  background: color-mix(in srgb, var(--color-surface) 50%, transparent);
  align-items: flex-end;
}

.toolbar-group {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.toolbar-divider {
  width: 1px;
  height: 40px;
  background: var(--color-border);
  margin: 0 8px;
  display: none;
  
  @media (min-width: 768px) {
    display: block;
  }
}

.control-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.control-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-left: 2px;
}

.input-with-action {
  display: flex;
  gap: 6px;
}

.number-input {
  width: 70px;
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 14px;
  text-align: center;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
}

.action-btn {
  height: 36px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: color-mix(in srgb, var(--color-surface) 90%, var(--color-primary));
    border-color: color-mix(in srgb, var(--color-border) 80%, var(--color-primary));
  }
}

.segmented-control {
  display: flex;
  background: color-mix(in srgb, var(--color-surface) 90%, black);
  padding: 3px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  height: 36px;
}

.segment-btn {
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  padding: 0 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 7px;
  transition: all 0.2s;

  &:hover {
    color: var(--color-text);
  }

  &.active {
    background: var(--color-surface);
    color: var(--color-text);
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
}

.select-input {
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 13px;
  min-width: 100px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
}

.toggles-group {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  padding-bottom: 2px; /* Align with inputs */
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;

  &:hover {
    background: color-mix(in srgb, var(--color-surface) 50%, transparent);
  }

  &.active {
    background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
    border-color: color-mix(in srgb, var(--color-primary) 30%, var(--color-border));
    color: var(--color-primary);
  }
}

.toggle-icon {
  font-size: 14px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.stat {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  padding: 8px 10px;
  display: grid;
  gap: 2px;
}

.stat span {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.stat strong {
  font-size: 20px;
  color: var(--color-text);
}

.stat strong[data-tone='red'] {
  color: #dc2626;
}

.progress {
  height: 3px;
  background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
  border-radius: 999px;
  margin-top: 10px;
}

.fill {
  height: 100%;
  background: color-mix(in srgb, var(--color-primary) 72%, #16a34a);
  border-radius: inherit;
  transition: width 0.2s ease;
}

.notice {
  margin: 8px 0 10px;
  color: var(--color-text-secondary);
  font-size: 13px;
  min-height: 20px;
}

.board-wrap {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
}

.board-wrap:fullscreen {
  background: var(--color-background);
  display: grid;
  place-items: center;
  padding: 10px;
}

.board-wrap:fullscreen .board {
  width: min(100vw, 1100px);
  max-height: calc(100vh - 20px);
}

.board {
  position: relative;
  aspect-ratio: 7 / 5;
  background: color-mix(in srgb, var(--color-surface) 96%, var(--color-background));
}

.board.is-shaking {
  animation: boardShake 0.35s ease;
}

.board-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.cell-shape {
  fill: color-mix(in srgb, var(--color-surface) 92%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-border) 88%, var(--color-primary));
  stroke: color-mix(in srgb, var(--color-border) 88%, var(--color-primary));
  stroke-width: 1.2;
  cursor: pointer;
  transition: fill 0.12s ease, stroke 0.12s ease, opacity 0.12s ease;
}

.cell-shape:hover {
  fill: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
  stroke: color-mix(in srgb, var(--color-primary) 48%, var(--color-border));
}

.cell-shape[data-tone='red'] {
  fill: color-mix(in srgb, #ef4444 7%, var(--color-surface));
}

.cell-shape[data-tone='black'] {
  fill: color-mix(in srgb, #111827 6%, var(--color-surface));
}

.cell-shape[data-wrong='true'] {
  fill: color-mix(in srgb, #ef4444 34%, var(--color-surface));
  stroke: #ef4444;
  stroke-width: 2;
}

.cell-label {
  font-size: 12px;
  font-weight: 500;
  fill: var(--color-text);
  user-select: none;
  pointer-events: none;
  paint-order: stroke;
  stroke: color-mix(in srgb, var(--color-surface) 92%, transparent);
  stroke-width: 0.7px;
}

.cell-label[data-memory-style='mark'] {
  font-weight: 700;
}

.cell-label[data-tone='red'] {
  fill: #b91c1c;
}

.cell-label[data-tone='black'] {
  fill: #111827;
}

.ctrls {
  margin-top: 10px;
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.restart {
  border: 1px solid var(--color-border);
  border-radius: 9px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  height: 34px;
  padding: 0 12px;
  cursor: pointer;
  font-size: 12px;
}

.restart {
  color: var(--color-text);
}

.record {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.sidebar {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: color-mix(in srgb, var(--color-surface) 96%, transparent);
  padding: 12px;
  display: grid;
  gap: 10px;
  align-content: start;
}

.sidebar h3 {
  margin: 0;
  font-size: 15px;
  color: var(--color-text);
}

.sidebar p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.55;
}

.side-block {
  display: grid;
  gap: 6px;
}

.side-title {
  font-size: 12px;
  color: var(--color-text);
  font-weight: 600;
}

.side-block ul {
  margin: 0;
  padding-left: 16px;
  display: grid;
  gap: 4px;
}

.side-block li {
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.45;
}

.side-effect {
  border-top: 1px dashed var(--color-border);
  padding-top: 8px;
}

[data-theme='pixel'] {
  .panel,
  .rule-tabs,
  .rtab,
  .number-input,
  .style-select,
  .small-btn,
  .stat,
  .board-wrap,
  .sidebar,
  .restart {
    border-radius: 0;
    border-width: 2px;
  }

  .cell-shape {
    stroke-width: 2px;
  }
}

@media (max-width: 820px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .toolbar-row {
    flex-direction: column;
    align-items: stretch;
  }

  .field-range,
  .field-memory {
    min-width: 0;
  }

  .rule-tabs {
    width: 100%;
  }

  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cell-label {
    font-size: 11px;
  }
}

@keyframes boardShake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-7px);
  }
  40% {
    transform: translateX(7px);
  }
  60% {
    transform: translateX(-4px);
  }
  80% {
    transform: translateX(4px);
  }
}
</style>
