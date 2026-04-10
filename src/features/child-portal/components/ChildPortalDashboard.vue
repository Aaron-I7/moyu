<script setup lang="ts">
import { computed, ref } from 'vue'
import { useElementSize, useWindowSize } from '@vueuse/core'
import { Icon } from '@iconify/vue'
import {
  buildAdventureEdges,
  buildAdventureLayout,
  buildAdventureNodes,
  buildAdventureRoute
} from '@/features/child-portal/adventure-map'
import {
  getRewardVisualIcon,
  sortRewardsForDisplay
} from '@/features/child-portal/helpers'
import { formatPoints } from '@/features/child-portal/format'
import type {
  ChildHomeResponse,
  ChildPointsResponse,
  ChildRewardsResponse,
  PortalSection
} from '@/features/child-portal/types'

const props = defineProps<{
  actionBusy?: boolean
  currentPoints: number
  homeData: ChildHomeResponse | null
  pointsData: ChildPointsResponse | null
  rewardsData: ChildRewardsResponse | null
}>()

const emit = defineEmits<{
  navigate: [section: PortalSection]
  complete: [taskId: string]
  redeem: [rewardId: string, callback: { onSuccess: () => void; onError: (err: string) => void }]
}>()

const rewardPreview = computed(() => sortRewardsForDisplay(props.rewardsData?.rewards || [], props.currentPoints))
const completedCount = computed(() => props.homeData?.today_completed_count || 0)
const allTasksCompleted = computed(() => {
  const total = props.homeData?.today_tasks?.length || 0
  return total > 0 && completedCount.value === total
})

const mapPathRef = ref<HTMLElement | null>(null)
const { width: windowWidth, height: windowHeight } = useWindowSize()
const { width: measuredMapWidth } = useElementSize(mapPathRef)

const mapHeightPx = computed(() => {
  const isMobile = windowWidth.value <= 768
  const preferredHeight = isMobile
    ? windowHeight.value - 240
    : windowHeight.value - 280
  const min = isMobile ? 460 : 520
  const max = isMobile ? 680 : 760

  return Math.min(max, Math.max(min, preferredHeight))
})

const adventureViewport = computed(() => ({
  width: Math.min(
    900,
    Math.max(
      320,
      Math.round(
        measuredMapWidth.value ||
          (windowWidth.value <= 768 ? windowWidth.value - 32 : windowWidth.value - 48)
      )
    )
  ),
  height: mapHeightPx.value
}))

const mapNodes = computed(() =>
  buildAdventureNodes(
    props.homeData?.today_tasks || [],
    props.homeData?.record_date || ''
  )
)
const adventureRoute = computed(() => buildAdventureRoute(mapNodes.value))
const adventureLayout = computed(() => buildAdventureLayout(mapNodes.value, adventureViewport.value))
const adventureEdges = computed(() => buildAdventureEdges(adventureRoute.value, adventureLayout.value))
const containerHeight = computed(() => `${adventureLayout.value.height}px`)
const mapPathClass = computed(() => ({
  'map-path--compact': adventureLayout.value.compact,
  'map-path--challenge': adventureRoute.value.mode === 'challenge'
}))
const nodePositions = computed(() => adventureLayout.value.positions)

function hashString(input: string): number {
  let hash = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function createPrng(seed: number) {
  let state = seed >>> 0

  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seededUnit(seed: number, salt: string) {
  return createPrng(hashString(`${seed}:${salt}`))()
}

const avatarPosition = computed(() => {
  const positions = nodePositions.value
  const taskCount = props.homeData?.today_tasks?.length || 0

  if (!taskCount) {
    return positions.start || { x: 0, y: 0 }
  }

  if (allTasksCompleted.value) {
    return positions.end || positions.start || { x: 0, y: 0 }
  }

  if (adventureRoute.value.mode === 'progressed' && adventureRoute.value.taskNodeIds.length > 0) {
    const currentId = adventureRoute.value.taskNodeIds[adventureRoute.value.taskNodeIds.length - 1]
    if (!currentId) {
      return positions.start || { x: 0, y: 0 }
    }
    const current = positions[currentId]
    const next = positions.end

    if (current && next) {
      return {
        x: current.x + (next.x - current.x) * 0.42,
        y: current.y + (next.y - current.y) * 0.42
      }
    }

    return current || positions.start || { x: 0, y: 0 }
  }

  const firstRouteTaskId = adventureRoute.value.taskNodeIds[0]
  const start = positions.start
  const next = firstRouteTaskId ? positions[firstRouteTaskId] : positions.start

  if (start && next) {
    return {
      x: start.x + (next.x - start.x) * 0.42,
      y: start.y + (next.y - start.y) * 0.42
    }
  }

  return start || { x: 0, y: 0 }
})

const touchTimers = new Map<string, number>()
const activeNodeId = ref<string | null>(null)
const showRewardsModal = ref(false)
const modalStatus = ref<{ message: string, type: 'success' | 'error' | '' }>({ message: '', type: '' })
const activeRedeemId = ref<string | null>(null)

const handlePointerDown = (nodeId: string) => {
  touchTimers.set(nodeId, Date.now())
}

const handlePointerUp = (node: (typeof mapNodes.value)[number]) => {
  const start = touchTimers.get(node.id)
  if (!start) return
  touchTimers.delete(node.id)

  const duration = Date.now() - start
  if (duration >= 800) {
    if (node.kind === 'task') {
      emit('navigate', 'tasks')
    }
    return
  }

  if (node.kind === 'task') {
    activeNodeId.value = activeNodeId.value === node.id ? null : node.id
    return
  }

  if (node.kind === 'end') {
    modalStatus.value = { message: '', type: '' }
    showRewardsModal.value = true
    return
  }

  activeNodeId.value = null
}

const handlePointerLeave = (nodeId: string) => {
  touchTimers.delete(nodeId)
}

const completeTask = (taskId: string) => {
  emit('complete', taskId)
  activeNodeId.value = null
}

const handleRedeem = (rewardId: string) => {
  modalStatus.value = { message: '', type: '' }
  activeRedeemId.value = rewardId

  emit('redeem', rewardId, {
    onSuccess: () => {
      modalStatus.value = { message: '兑换成功啦！快去告诉家长吧。', type: 'success' }
      activeRedeemId.value = null
      setTimeout(() => {
        if (showRewardsModal.value) showRewardsModal.value = false
      }, 2000)
    },
    onError: (err: string) => {
      modalStatus.value = { message: err || '兑换出错了，请稍后再试。', type: 'error' }
      activeRedeemId.value = null
    }
  })
}

const OBSTACLES = [
  { img: '', fallbackIcon: 'ph:mountains-fill', tone: 'text-slate-400', size: 48 },
  { img: '', fallbackIcon: 'ph:tree-evergreen-fill', tone: 'text-emerald-500', size: 40 },
  { img: '', fallbackIcon: 'ph:waves-fill', tone: 'text-blue-400', size: 36 },
  { img: '', fallbackIcon: 'ph:campfire-fill', tone: 'text-orange-500', size: 44 },
  { img: '', fallbackIcon: 'ph:tent-fill', tone: 'text-amber-600', size: 48 },
  { img: '', fallbackIcon: 'ph:cloud-fog-fill', tone: 'text-slate-300', size: 52 },
  { img: '', fallbackIcon: 'ph:cactus-fill', tone: 'text-green-500', size: 40 },
  { img: '', fallbackIcon: 'ph:flower-lotus-fill', tone: 'text-pink-400', size: 36 }
] as const

const pathObstacles = computed(() => {
  const compact = adventureLayout.value.compact
  const density = compact ? 0.34 : 0.58
  const sizeScale = compact ? 0.78 : 1

  return adventureEdges.value.flatMap((edge, index) => {
    const edgeSeed = `${adventureLayout.value.seed}:${edge.id}:${index}`
    const shouldRender = seededUnit(adventureLayout.value.seed, `${edgeSeed}:show`) < density
    if (!shouldRender) {
      return []
    }

    const t = 0.28 + seededUnit(adventureLayout.value.seed, `${edgeSeed}:t`) * 0.44
    const offset = (seededUnit(adventureLayout.value.seed, `${edgeSeed}:offset`) - 0.5) * (compact ? 28 : 40)
    const baseX = edge.fromPoint.x + (edge.toPoint.x - edge.fromPoint.x) * t
    const baseY = edge.fromPoint.y + (edge.toPoint.y - edge.fromPoint.y) * t
    const dx = edge.toPoint.x - edge.fromPoint.x
    const dy = edge.toPoint.y - edge.fromPoint.y
    const length = Math.hypot(dx, dy) || 1
    const normalX = -dy / length
    const normalY = dx / length
    const obstacle = OBSTACLES[Math.floor(seededUnit(adventureLayout.value.seed, `${edgeSeed}:kind`) * OBSTACLES.length)]

    if (!obstacle) {
      return []
    }

    return [{
      id: `obs-${edge.id}`,
      x: baseX + normalX * offset,
      y: baseY + normalY * offset,
      ...obstacle,
      size: Math.round(obstacle.size * sizeScale)
    }]
  })
})

function getNodeActionPlacement(nodeId: string) {
  if (windowWidth.value <= 768) {
    return 'top'
  }

  const point = nodePositions.value[nodeId]
  if (!point) {
    return 'top'
  }

  if (point.xPercent >= 72) {
    return 'left'
  }

  if (point.xPercent <= 28) {
    return 'right'
  }

  return 'top'
}
</script>

<template>
  <div class="adventure-map" @click="activeNodeId = null">
    <transition name="fade-down">
      <div v-if="allTasksCompleted" class="celebration-banner">
        <Icon icon="ph:confetti-fill" class="celebration-icon" />
        <div class="celebration-text">
          <h3>太棒啦！</h3>
          <p>今天的冒险任务全部完成啦！</p>
        </div>
        <Icon icon="ph:shooting-star-fill" class="celebration-icon" />
      </div>
    </transition>

    <div ref="mapPathRef" class="map-path" :class="mapPathClass" :style="{ height: containerHeight }" @click.stop>
      <svg
        class="map-svg-lines"
        preserveAspectRatio="none"
        :viewBox="`0 0 ${adventureLayout.width} ${adventureLayout.height}`"
      >
        <path
          v-for="edge in adventureEdges"
          :key="edge.id"
          :d="edge.path"
          class="map-svg-lines__path"
          :class="{ 'map-svg-lines__path--challenge': edge.routeKind === 'challenge' }"
        />
      </svg>

      <div
        v-for="node in mapNodes"
        :key="node.id"
        class="map-node-wrapper"
        :style="{
          left: `${nodePositions[node.id]?.x ?? 0}px`,
          top: `${nodePositions[node.id]?.y ?? 0}px`
        }"
      >
        <div class="node-container">
          <button
            type="button"
            class="map-node"
            :class="[
              `map-node--${node.tone}`,
              { 'map-node--completed': node.originalTask?.type === 'completed' },
              { 'map-node--compact': adventureLayout.compact },
              { 'map-node--unlinked': node.kind === 'task' && node.originalTask?.type === 'active' && adventureRoute.mode === 'progressed' }
            ]"
            @pointerdown.stop="handlePointerDown(node.id)"
            @pointerup.stop="handlePointerUp(node)"
            @pointerleave="handlePointerLeave(node.id)"
            @contextmenu.prevent
          >
            <div class="map-node__orb">
              <img v-if="node.imageUrl" :src="node.imageUrl" :alt="node.title" />
              <Icon v-else :icon="node.icon" />
            </div>
            <div class="map-node__label">
              <span class="map-node__title">{{ node.title }}</span>
              <span v-if="node.pointsText" class="map-node__points">{{ node.pointsText }}</span>
            </div>
          </button>

          <transition name="pop-out">
            <div
              v-if="activeNodeId === node.id && node.kind === 'task' && node.originalTask?.type === 'active'"
              class="node-action"
              :class="`node-action--${getNodeActionPlacement(node.id)}`"
            >
              <button type="button" class="complete-btn" :disabled="actionBusy" @click.stop="completeTask(node.id)">
                <Icon icon="ph:check-circle-fill" />
                <span>完成任务</span>
              </button>
            </div>
          </transition>

          <transition name="pop-out">
            <div
              v-if="activeNodeId === node.id && node.kind === 'task' && node.originalTask?.type !== 'active'"
              class="node-action node-action--info"
              :class="`node-action--${getNodeActionPlacement(node.id)}`"
            >
              <span>{{ node.originalTask?.type === 'completed' ? '已完成' : '等待家长确认' }}</span>
            </div>
          </transition>
        </div>
      </div>

      <div
        v-for="obs in pathObstacles"
        :key="obs.id"
        class="obstacle-sticker"
        :class="obs.tone"
        :style="{ left: `${obs.x}px`, top: `${obs.y}px`, width: `${obs.size}px`, height: `${obs.size}px`, fontSize: `${obs.size}px` }"
      >
        <img v-if="obs.img" :src="obs.img" alt="obstacle" />
        <Icon v-else :icon="obs.fallbackIcon" />
      </div>

      <transition name="bounce-walk">
        <div class="avatar-walker" :style="{ left: `${avatarPosition.x}px`, top: `${avatarPosition.y}px` }">
          <div class="avatar-walker__inner">
            <img v-if="props.homeData?.child_profile?.avatar_url" :src="props.homeData.child_profile.avatar_url" alt="avatar" />
            <Icon v-else icon="ph:user-circle-fill" />
          </div>
          <div class="avatar-walker__shadow"></div>
        </div>
      </transition>
    </div>

    <transition name="fade">
      <div v-if="showRewardsModal" class="rewards-modal-overlay" @click="showRewardsModal = false">
        <div class="rewards-modal" @click.stop>
          <button class="rewards-modal__close" @click="showRewardsModal = false">
            <Icon icon="ph:x-bold" />
          </button>

          <div class="rewards-modal__header">
            <Icon icon="ph:gift-fill" class="rewards-modal__icon" />
            <h3>终点宝库</h3>
            <p>挑选你喜欢的奖励吧！已申请的奖励会在商店中显示状态哦。</p>

            <transition name="fade">
              <div v-if="modalStatus.message" class="modal-alert" :class="`modal-alert--${modalStatus.type}`">
                <Icon :icon="modalStatus.type === 'success' ? 'ph:check-circle-fill' : 'ph:warning-circle-fill'" />
                {{ modalStatus.message }}
              </div>
            </transition>
          </div>

          <div class="rewards-modal__list">
            <div v-for="reward in rewardPreview" :key="reward.reward_id" class="reward-mini-card">
              <div class="reward-mini-card__icon">
                <img v-if="reward.image_url" :src="reward.image_url" :alt="reward.title" />
                <Icon v-else :icon="getRewardVisualIcon(reward.reward_type)" />
              </div>
              <div class="reward-mini-card__info">
                <h4>{{ reward.title }}</h4>
                <span class="reward-mini-card__cost">
                  <Icon icon="ph:shooting-star-fill" />
                  {{ formatPoints(reward.cost_points) }}
                </span>
              </div>
              <div class="reward-mini-card__action">
                <button
                  type="button"
                  class="redeem-inline-btn"
                  :class="{ 'redeem-inline-btn--loading': activeRedeemId === reward.reward_id }"
                  :disabled="actionBusy || props.currentPoints < (reward.cost_points || 0)"
                  @click.stop="handleRedeem(reward.reward_id)"
                >
                  <Icon v-if="activeRedeemId === reward.reward_id" icon="ph:spinner-gap-bold" class="loading-spin" />
                  <span v-else>兑换</span>
                </button>
              </div>
            </div>
            <div v-if="!rewardPreview.length" class="reward-empty">
              空空如也~
            </div>
          </div>

          <button class="rewards-modal__btn" @click="emit('navigate', 'rewards')">
            去魔法商店兑换
            <Icon icon="ph:arrow-right-bold" />
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped lang="scss">
.adventure-map {
  position: relative;
  width: 100%;
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
  animation: mapRise 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  max-width: 1200px;
  margin: 0 auto;
}

.celebration-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, #fff3d4 0%, #ffdf88 100%);
  padding: 16px 32px;
  border-radius: 999px;
  box-shadow: 0 8px 24px rgba(255, 170, 0, 0.2);
  border: 4px solid #fff;
  margin-bottom: 32px;
  color: #a85800;
  z-index: 10;

  .celebration-icon {
    font-size: 32px;
    color: #ff9100;
    animation: bounce 2s infinite;
  }

  h3 { margin: 0; font-size: 20px; font-weight: 900; }
  p { margin: 4px 0 0; font-size: 14px; font-weight: 800; opacity: 0.8; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.map-path {
  position: relative;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  transition: height 0.3s ease;
  overflow: visible;
}

.map-path--compact {
  .map-node {
    gap: 10px;
  }

  .map-node__orb {
    width: 84px;
    height: 84px;
    border-radius: 28px;
    font-size: 38px;
  }

  .map-node__label {
    padding: 7px 13px;
  }

  .map-node__title {
    font-size: 14px;
  }

  .map-node__points {
    font-size: 12px;
  }

  .complete-btn,
  .node-action--info {
    padding: 10px 16px;
    font-size: 15px;
  }
}

.map-svg-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.map-svg-lines__path {
  fill: none;
  stroke: rgba(255, 255, 255, 0.9);
  stroke-width: 8px;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 18 16;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.42));
}

.map-svg-lines__path--challenge {
  stroke: rgba(255, 255, 255, 0.8);
  stroke-dasharray: 14 18;
}

.map-node-wrapper {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 2;
}

.node-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.map-node {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  transition: transform 0.2s, filter 0.2s, opacity 0.2s;
  cursor: pointer;
  user-select: none;
  -webkit-touch-callout: none;
  background: transparent;
  border: none;
  padding: 0;

  &:hover {
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
}

.map-node--completed {
  opacity: 0.82;
  filter: grayscale(14%);
}

.map-node--unlinked {
  .map-node__label {
    background: rgba(255, 255, 255, 0.82);
  }
}

.map-node__orb {
  width: 100px;
  height: 100px;
  border-radius: 32px;
  display: grid;
  place-items: center;
  font-size: 48px;
  border: 4px solid rgba(255,255,255,0.8);
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.map-node--amber .map-node__orb {
  background: linear-gradient(135deg, #ffd772, #f8a93d);
  color: #5f3800;
  box-shadow: 0 10px 0 #d98014, 0 16px 24px rgba(217, 128, 20, 0.3);
}

.map-node--sky .map-node__orb {
  background: linear-gradient(135deg, #92dcff, #68a8ff);
  color: #1f4f81;
  box-shadow: 0 10px 0 #3a7bc4, 0 16px 24px rgba(58, 123, 196, 0.3);
}

.map-node--mint .map-node__orb {
  background: linear-gradient(135deg, #a4ecae, #63c56f);
  color: #245a32;
  box-shadow: 0 10px 0 #3b9146, 0 16px 24px rgba(59, 145, 70, 0.3);
}

.map-node--rose .map-node__orb {
  background: linear-gradient(135deg, #ffc980, #f3865e);
  color: #643200;
  box-shadow: 0 10px 0 #c75630, 0 16px 24px rgba(199, 86, 48, 0.3);
}

.map-node__label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: rgba(255,255,255,0.92);
  padding: 8px 16px;
  border-radius: 999px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  max-width: min(168px, 24vw);
  text-align: center;
}

.map-node__title {
  font-size: 16px;
  font-weight: 900;
  color: #24354c;
  line-height: 1.2;
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.map-node__points {
  font-size: 14px;
  font-weight: 800;
  color: #ff9100;
}

.node-action {
  position: absolute;
  z-index: 10;
  white-space: nowrap;

  &--right {
    left: calc(100% + 16px);
    top: 50%;
    transform: translateY(-50%);
  }

  &--left {
    right: calc(100% + 16px);
    top: 50%;
    transform: translateY(-50%);
  }

  &--top {
    left: 50%;
    bottom: calc(100% + 14px);
    transform: translateX(-50%);
  }

  .complete-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #a4ecae, #63c56f);
    color: #1a4325;
    border: 3px solid #fff;
    padding: 12px 20px;
    border-radius: 20px;
    font-size: 18px;
    font-weight: 900;
    box-shadow: 0 8px 16px rgba(99, 197, 111, 0.3);
    cursor: pointer;
    transition: transform 0.2s;

    svg { font-size: 24px; }
    &:hover:not(:disabled) { transform: scale(1.05); }
    &:active:not(:disabled) { transform: scale(0.95); }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }
}

.node-action--info {
  background: #fff;
  padding: 12px 20px;
  border-radius: 20px;
  font-weight: 800;
  color: #5d7592;
  box-shadow: 0 8px 16px rgba(0,0,0,0.08);
  border: 3px solid #eef7ff;
}

.avatar-walker {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  animation: walkFloat 2s ease-in-out infinite;
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.avatar-walker__inner {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #fff;
  border: 4px solid #42baff;
  box-shadow: 0 4px 12px rgba(66, 186, 255, 0.4);
  display: grid;
  place-items: center;
  overflow: hidden;
  font-size: 32px;
  color: #42baff;

  img { width: 100%; height: 100%; object-fit: cover; }
}

.avatar-walker__shadow {
  width: 30px;
  height: 8px;
  background: rgba(0,0,0,0.1);
  border-radius: 50%;
  margin-top: 8px;
  animation: shadowPulse 2s ease-in-out infinite;
}

@keyframes walkFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes shadowPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(0.6); opacity: 0.4; }
}

.obstacle-sticker {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 1;
  opacity: 0.16;
  pointer-events: none;
  animation: float 4s ease-in-out infinite alternate;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
  }

  svg {
    width: 100%;
    height: 100%;
  }

  &:nth-child(even) {
    animation-delay: -2s;
    animation-duration: 5s;
  }
}

.text-slate-400 { color: #94a3b8; }
.text-emerald-500 { color: #10b981; }
.text-blue-400 { color: #60a5fa; }
.text-orange-500 { color: #f97316; }
.text-amber-600 { color: #d97706; }
.text-slate-300 { color: #cbd5e1; }
.text-green-500 { color: #22c55e; }
.text-pink-400 { color: #f472b6; }

@keyframes float {
  from { transform: translate(-50%, -50%) translateY(-3px) rotate(-2deg); }
  to { transform: translate(-50%, -50%) translateY(3px) rotate(2deg); }
}

.rewards-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(18, 29, 51, 0.6);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 20px;
}

.rewards-modal {
  position: relative;
  background: #fff;
  width: 100%;
  max-width: 480px;
  border-radius: 36px;
  padding: 32px;
  box-shadow: 0 24px 48px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.rewards-modal__close {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f1f5f9;
  color: #64748b;
  display: grid;
  place-items: center;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { background: #e2e8f0; color: #0f172a; }
}

.rewards-modal__header {
  text-align: center;

  .rewards-modal__icon { font-size: 56px; color: #f59e0b; margin-bottom: 12px; }
  h3 { margin: 0; font-size: 28px; font-weight: 900; color: #1e293b; }
  p { margin: 8px 0 0; font-size: 16px; color: #64748b; }
}

.rewards-modal__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 40vh;
  overflow-y: auto;
  padding-right: 8px;
}

.reward-mini-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 20px;
  border: 2px solid #e2e8f0;

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: #fff;
    display: grid;
    place-items: center;
    font-size: 28px;
    color: #f43f5e;
    box-shadow: 0 4px 8px rgba(0,0,0,0.04);

    img { width: 100%; height: 100%; border-radius: 14px; object-fit: cover; }
  }

  &__info {
    flex: 1;
    h4 { margin: 0 0 4px; font-size: 16px; font-weight: 800; color: #334155; }
  }

  &__cost {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    font-weight: 900;
    color: #f59e0b;
    background: #fffbeb;
    padding: 4px 10px;
    border-radius: 12px;
  }
}

.redeem-inline-btn {
  background: #f59e0b;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(245, 158, 11, 0.3);
  transition: all 0.2s;
  min-width: 60px;
  display: grid;
  place-items: center;

  &:hover:not(:disabled) { transform: scale(1.05); }
  &:active:not(:disabled) { transform: scale(0.95); }
  &:disabled {
    background: #cbd5e1;
    box-shadow: none;
    cursor: not-allowed;
  }
}

.redeem-inline-btn--loading {
  background: #fcd34d !important;
  color: #b45309 !important;
}

.loading-spin {
  animation: spin 1s linear infinite;
  font-size: 16px;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

.modal-alert {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 800;

  svg { font-size: 20px; }

  &--success {
    background: #ecfdf5;
    color: #059669;
    border: 1px solid #a7f3d0;
  }

  &--error {
    background: #fef2f2;
    color: #e11d48;
    border: 1px solid #fecdd3;
  }
}

.rewards-modal__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: linear-gradient(135deg, #a4ecae, #63c56f);
  color: #1a4325;
  border-radius: 24px;
  font-size: 18px;
  font-weight: 900;
  border: none;
  cursor: pointer;
  transition: transform 0.2s;
  box-shadow: 0 8px 16px rgba(99, 197, 111, 0.2);

  &:hover { transform: translateY(-2px); }
  &:active { transform: translateY(0); }
}

.fade-down-enter-active, .fade-down-leave-active { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.fade-down-enter-from, .fade-down-leave-to { opacity: 0; transform: translateY(-20px) scale(0.9); }

.pop-out-enter-active, .pop-out-leave-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.pop-out-enter-from, .pop-out-leave-to { opacity: 0; transform: scale(0.8) translateX(-20px); }

.bounce-walk-enter-active { animation: bounceIn 0.6s; }
.bounce-walk-leave-active { animation: bounceOut 0.4s; }

@keyframes bounceIn {
  0% { transform: scale(0) translateY(-40px); opacity: 0; }
  60% { transform: scale(1.1) translateY(10px); opacity: 1; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}

@keyframes bounceOut {
  to { transform: scale(0) translateY(40px); opacity: 0; }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 768px) {
  .adventure-map {
    padding: 28px 0;
  }

  .celebration-banner {
    gap: 12px;
    padding: 14px 18px;
    border-radius: 28px;
  }

  .map-node__orb { width: 72px; height: 72px; font-size: 34px; border-radius: 24px; }
  .map-node__label { max-width: min(144px, 48vw); padding: 7px 12px; }
  .map-node__title { font-size: 13px; }
  .map-node__points { font-size: 11px; }

  .node-action {
    left: 50%;
    right: auto;
    top: auto;
    bottom: calc(100% + 12px);
    transform: translateX(-50%);
  }

  .node-action .complete-btn,
  .node-action--info {
    padding: 10px 14px;
    font-size: 14px;
  }

  .avatar-walker__inner {
    width: 48px;
    height: 48px;
    font-size: 26px;
  }
}
</style>
