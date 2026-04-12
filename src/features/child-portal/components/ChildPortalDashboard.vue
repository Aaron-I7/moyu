<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useElementBounding, useElementSize, useWindowSize } from '@vueuse/core'
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
const portalDockRef = ref<HTMLElement | null>(null)
const layoutRefreshTick = ref(0)
const { width: windowWidth, height: windowHeight } = useWindowSize()
const { width: measuredMapWidth } = useElementSize(mapPathRef)
const { top: mapTop } = useElementBounding(mapPathRef)
const { top: dockTop } = useElementBounding(portalDockRef)

onMounted(() => {
  portalDockRef.value = document.querySelector('.portal-dock') as HTMLElement | null
})

const mapHeightPx = computed(() => {
  const isMobile = windowWidth.value <= 768
  const dockGap = isMobile ? 28 : 48
  const fallbackHeight = isMobile
    ? windowHeight.value - 240
    : windowHeight.value - 280
  const dockLimitedHeight = dockTop.value > 0 && mapTop.value > 0
    ? Math.round(dockTop.value - mapTop.value - dockGap)
    : fallbackHeight
  const min = isMobile ? 460 : 520
  const max = isMobile ? 920 : 1040

  return Math.min(max, Math.max(min, dockLimitedHeight))
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

const layoutSeedKey = computed(() =>
  `${props.homeData?.record_date || ''}::layout-${layoutRefreshTick.value}`
)
const mapNodes = computed(() =>
  buildAdventureNodes(
    props.homeData?.today_tasks || [],
    layoutSeedKey.value
  )
)
const adventureRoute = computed(() => buildAdventureRoute(mapNodes.value))
const adventureLayout = computed(() => buildAdventureLayout(mapNodes.value, adventureViewport.value))
const adventureEdges = computed(() => buildAdventureEdges(adventureRoute.value, adventureLayout.value))
const mapResponsiveProfile = computed(() => adventureLayout.value.responsive)
const containerHeight = computed(() => `${adventureLayout.value.height}px`)
const mapPathClass = computed(() => ({
  'map-path--compact': adventureLayout.value.compact,
  'map-path--challenge': adventureRoute.value.mode === 'challenge'
}))
const mapPathStyle = computed(() => {
  const profile = mapResponsiveProfile.value
  const labelPaddingX = profile.tier === 'desktop' ? 16 : profile.tier === 'tablet' ? 14 : profile.tier === 'phone' ? 12 : 10
  const labelPaddingY = profile.tier === 'narrow-phone' ? 6 : 7
  const nodeGap = profile.tier === 'desktop' ? 12 : profile.tier === 'tablet' ? 10 : 8
  const titleFontSize = profile.tier === 'desktop' ? 16 : profile.tier === 'tablet' ? 15 : profile.tier === 'phone' ? 13 : 12
  const orbShadowOffset = Math.max(6, Math.round(profile.orbSizePx * 0.1))
  const orbShadowBlur = Math.max(18, Math.round(profile.orbSizePx * 0.24))
  const rerollFontSize = profile.tier === 'desktop' ? 14 : profile.tier === 'tablet' ? 13 : 12
  const rerollPadY = profile.tier === 'desktop' ? 10 : profile.tier === 'tablet' ? 9 : 8
  const rerollPadX = profile.tier === 'desktop' ? 16 : profile.tier === 'tablet' ? 14 : profile.tier === 'phone' ? 12 : 10
  const rerollTop = profile.tier === 'desktop' ? 10 : profile.tier === 'tablet' ? 6 : -4
  const rerollIconSize = profile.tier === 'desktop' ? 18 : 16
  const lineDash = profile.tier === 'desktop' ? '18 16' : profile.tier === 'tablet' ? '16 14' : profile.tier === 'phone' ? '12 12' : '10 12'
  const challengeDash = profile.tier === 'desktop' ? '14 18' : profile.tier === 'tablet' ? '13 16' : profile.tier === 'phone' ? '11 13' : '9 12'
  const actionFontSize = profile.tier === 'desktop' ? 18 : profile.tier === 'tablet' ? 16 : 14
  const actionPadY = profile.tier === 'desktop' ? 12 : profile.tier === 'tablet' ? 11 : 10
  const actionPadX = profile.tier === 'desktop' ? 20 : profile.tier === 'tablet' ? 18 : profile.tier === 'phone' ? 15 : 13
  const actionIconSize = profile.tier === 'desktop' ? 24 : profile.tier === 'tablet' ? 22 : 20

  return {
    height: containerHeight.value,
    '--map-orb-size': `${profile.orbSizePx}px`,
    '--map-orb-radius': `${Math.round(profile.orbSizePx * 0.32)}px`,
    '--map-orb-font-size': `${Math.round(profile.orbSizePx * 0.48)}px`,
    '--map-orb-border-width': `${profile.tier === 'desktop' ? 4 : 3}px`,
    '--map-orb-shadow-offset': `${orbShadowOffset}px`,
    '--map-orb-shadow-blur': `${orbShadowBlur}px`,
    '--map-node-gap': `${nodeGap}px`,
    '--map-label-max-width': `${profile.labelMaxWidthPx}px`,
    '--map-label-padding-y': `${labelPaddingY}px`,
    '--map-label-padding-x': `${labelPaddingX}px`,
    '--map-title-font-size': `${titleFontSize}px`,
    '--map-line-width': `${profile.lineStrokePx}px`,
    '--map-line-dash': lineDash,
    '--map-line-challenge-dash': challengeDash,
    '--map-marker-size': `${profile.markerSizePx}px`,
    '--map-reroll-top': `${rerollTop}px`,
    '--map-reroll-font-size': `${rerollFontSize}px`,
    '--map-reroll-padding-y': `${rerollPadY}px`,
    '--map-reroll-padding-x': `${rerollPadX}px`,
    '--map-reroll-gap': `${profile.tier === 'narrow-phone' ? 6 : 8}px`,
    '--map-reroll-icon-size': `${rerollIconSize}px`,
    '--map-action-font-size': `${actionFontSize}px`,
    '--map-action-padding-y': `${actionPadY}px`,
    '--map-action-padding-x': `${actionPadX}px`,
    '--map-action-radius': `${profile.tier === 'desktop' ? 20 : 18}px`,
    '--map-action-icon-size': `${actionIconSize}px`,
    '--map-info-font-size': `${Math.max(actionFontSize - 2, 12)}px`
  } as Record<string, string>
})
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

const currentTaskNodeId = computed(() => {
  const routeTaskNodes = adventureRoute.value.taskNodeIds
    .map((nodeId) => mapNodes.value.find((node) => node.id === nodeId))
    .filter((node): node is NonNullable<typeof node> => Boolean(node))

  const firstActiveNode = routeTaskNodes.find((node) => node.originalTask?.type === 'active')
  if (firstActiveNode) {
    return firstActiveNode.id
  }

  const firstPendingNode = routeTaskNodes.find((node) => node.originalTask?.type === 'pending')
  if (firstPendingNode) {
    return firstPendingNode.id
  }

  return allTasksCompleted.value ? 'end' : routeTaskNodes[0]?.id || 'start'
})

const currentTaskMarker = computed(() => {
  const positions = nodePositions.value
  const markerTarget = positions[currentTaskNodeId.value] || positions.start
  const verticalOffset = mapResponsiveProfile.value.markerOffsetPx

  return {
    id: currentTaskNodeId.value,
    x: markerTarget?.x || 0,
    y: (markerTarget?.y || 0) - verticalOffset
  }
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

const rerollLayout = () => {
  layoutRefreshTick.value += 1
  activeNodeId.value = null
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
  const responsive = mapResponsiveProfile.value
  const density = responsive.obstacleDensity
  const sizeScale = Math.max(0.52, responsive.orbSizePx / 100)
  const offsetRange = Math.max(responsive.orbSizePx * 0.36, 18)

  return adventureEdges.value.flatMap((edge, index) => {
    const edgeSeed = `${adventureLayout.value.seed}:${edge.id}:${index}`
    const shouldRender = seededUnit(adventureLayout.value.seed, `${edgeSeed}:show`) < density
    if (!shouldRender) {
      return []
    }

    const t = 0.28 + seededUnit(adventureLayout.value.seed, `${edgeSeed}:t`) * 0.44
    const offset = (seededUnit(adventureLayout.value.seed, `${edgeSeed}:offset`) - 0.5) * offsetRange
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

    <div ref="mapPathRef" class="map-path" :class="mapPathClass" :style="mapPathStyle" @click.stop>
      <button type="button" class="map-reroll-btn" @click.stop="rerollLayout">
        <Icon icon="ph:shuffle-angular-fill" />
        <span>重新排版</span>
      </button>

      <svg
        class="map-svg-lines"
        preserveAspectRatio="none"
        :viewBox="`0 0 ${adventureLayout.width} ${adventureLayout.height}`"
      >
        <path
          v-for="edge in adventureEdges"
          :key="`${edge.id}:${edge.path}`"
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
              { 'map-node--compact': adventureLayout.compact }
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
        <div
          :key="`marker-${currentTaskMarker.id}`"
          class="current-task-marker"
          :style="{ left: `${currentTaskMarker.x}px`, top: `${currentTaskMarker.y}px` }"
          aria-hidden="true"
        >
          <img src="/images/定位.svg" alt="" class="current-task-marker__icon" />
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
@use '../adventure-theme.scss' as theme;

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
  --map-orb-size: 100px;
  --map-orb-radius: 32px;
  --map-orb-font-size: 48px;
  --map-orb-border-width: 4px;
  --map-orb-shadow-offset: 10px;
  --map-orb-shadow-blur: 24px;
  --map-node-gap: 12px;
  --map-label-max-width: 168px;
  --map-label-padding-y: 8px;
  --map-label-padding-x: 16px;
  --map-title-font-size: 16px;
  --map-line-width: 8px;
  --map-line-dash: 18 16;
  --map-line-challenge-dash: 14 18;
  --map-marker-size: 42px;
  --map-reroll-top: 10px;
  --map-reroll-font-size: 14px;
  --map-reroll-padding-y: 10px;
  --map-reroll-padding-x: 16px;
  --map-reroll-gap: 8px;
  --map-reroll-icon-size: 18px;
  --map-action-font-size: 18px;
  --map-action-padding-y: 12px;
  --map-action-padding-x: 20px;
  --map-action-radius: 20px;
  --map-action-icon-size: 24px;
  --map-info-font-size: 16px;

  position: relative;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  transition: height 0.3s ease;
  overflow: visible;
}

.map-reroll-btn {
  position: absolute;
  top: var(--map-reroll-top);
  right: 8px;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  gap: var(--map-reroll-gap);
  padding: var(--map-reroll-padding-y) var(--map-reroll-padding-x);
  border: clamp(2px, calc(var(--map-line-width) * 0.4), 3px) solid rgba(255, 255, 255, 0.92);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: #28527d;
  font-size: var(--map-reroll-font-size);
  font-weight: 900;
  box-shadow: 0 12px 24px rgba(61, 123, 196, 0.16);
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;

  svg {
    font-size: var(--map-reroll-icon-size);
    color: #3a7bc4;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 28px rgba(61, 123, 196, 0.2);
    background: white;
  }

  &:active {
    transform: translateY(0);
  }
}

.map-path--compact {
  .map-node {
    gap: max(8px, calc(var(--map-node-gap) - 1px));
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
  stroke-width: var(--map-line-width);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: var(--map-line-dash);
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.42));
  animation: pathRedraw 0.55s ease-out;
}

.map-svg-lines__path--challenge {
  stroke: rgba(255, 255, 255, 0.8);
  stroke-dasharray: var(--map-line-challenge-dash);
}

.map-node-wrapper {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 2;
  transition:
    left 0.38s cubic-bezier(0.22, 1, 0.36, 1),
    top 0.38s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: left, top;
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
  gap: var(--map-node-gap);
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

.map-node__orb {
  width: var(--map-orb-size);
  height: var(--map-orb-size);
  border-radius: var(--map-orb-radius);
  display: grid;
  place-items: center;
  font-size: var(--map-orb-font-size);
  border: var(--map-orb-border-width) solid rgba(255,255,255,0.8);
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
  box-shadow:
    0 var(--map-orb-shadow-offset) 0 #d98014,
    0 var(--map-orb-shadow-blur) calc(var(--map-orb-shadow-blur) * 1.15) rgba(217, 128, 20, 0.3);
}

.map-node--sky .map-node__orb {
  background: linear-gradient(135deg, #92dcff, #68a8ff);
  color: #1f4f81;
  box-shadow:
    0 var(--map-orb-shadow-offset) 0 #3a7bc4,
    0 var(--map-orb-shadow-blur) calc(var(--map-orb-shadow-blur) * 1.15) rgba(58, 123, 196, 0.3);
}

.map-node--mint .map-node__orb {
  background: linear-gradient(135deg, #a4ecae, #63c56f);
  color: #245a32;
  box-shadow:
    0 var(--map-orb-shadow-offset) 0 #3b9146,
    0 var(--map-orb-shadow-blur) calc(var(--map-orb-shadow-blur) * 1.15) rgba(59, 145, 70, 0.3);
}

.map-node--rose .map-node__orb {
  background: linear-gradient(135deg, #ffc980, #f3865e);
  color: #643200;
  box-shadow:
    0 var(--map-orb-shadow-offset) 0 #c75630,
    0 var(--map-orb-shadow-blur) calc(var(--map-orb-shadow-blur) * 1.15) rgba(199, 86, 48, 0.3);
}

.map-node__label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: rgba(255,255,255,0.92);
  padding: var(--map-label-padding-y) var(--map-label-padding-x);
  border-radius: 999px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  max-width: min(var(--map-label-max-width), 48vw);
  text-align: center;
}

.map-node__title {
  font-size: var(--map-title-font-size);
  font-weight: 900;
  color: #24354c;
  line-height: 1.2;
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
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
    padding: var(--map-action-padding-y) var(--map-action-padding-x);
    border-radius: var(--map-action-radius);
    font-size: var(--map-action-font-size);
    font-weight: 900;
    box-shadow: 0 8px 16px rgba(99, 197, 111, 0.3);
    cursor: pointer;
    transition: transform 0.2s;

    svg { font-size: var(--map-action-icon-size); }
    &:hover:not(:disabled) { transform: scale(1.05); }
    &:active:not(:disabled) { transform: scale(0.95); }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }
}

.node-action--info {
  background: #fff;
  padding: var(--map-action-padding-y) var(--map-action-padding-x);
  border-radius: var(--map-action-radius);
  font-size: var(--map-info-font-size);
  font-weight: 800;
  color: #5d7592;
  box-shadow: 0 8px 16px rgba(0,0,0,0.08);
  border: 3px solid #eef7ff;
}

.current-task-marker {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 3;
  pointer-events: none;
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.current-task-marker__icon {
  width: var(--map-marker-size);
  height: var(--map-marker-size);
  object-fit: contain;
  filter:
    drop-shadow(0 0 0 rgba(255, 255, 255, 0.96))
    drop-shadow(0 3px 10px rgba(49, 170, 255, 0.28));
  animation: markerFloat 1.9s ease-in-out infinite;
}

@keyframes markerFloat {
  0%, 100% {
    transform: translateY(0) scale(1);
    opacity: 0.82;
  }
  50% {
    transform: translateY(-8px) scale(1.05);
    opacity: 1;
  }
}

.obstacle-sticker {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 1;
  opacity: 0.16;
  pointer-events: none;
  animation: float 4s ease-in-out infinite alternate;
  transition:
    left 0.38s cubic-bezier(0.22, 1, 0.36, 1),
    top 0.38s cubic-bezier(0.22, 1, 0.36, 1);
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

@keyframes pathRedraw {
  from {
    opacity: 0;
    stroke-dashoffset: 64;
  }

  to {
    opacity: 1;
    stroke-dashoffset: 0;
  }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@include theme.respond-max(phone) {
  .adventure-map {
    padding: 28px 0;
  }

  .celebration-banner {
    gap: 12px;
    padding: 14px 18px;
    border-radius: 28px;
  }

  .node-action {
    left: 50%;
    right: auto;
    top: auto;
    bottom: calc(100% + 12px);
    transform: translateX(-50%);
  }

  .node-action .complete-btn,
  .node-action--info {
    max-width: min(260px, 72vw);
  }
}

@include theme.respond-max(narrow) {
  .adventure-map {
    padding: 22px 0;
  }

  .celebration-banner {
    gap: 10px;
    padding: 12px 14px;
    margin-bottom: 24px;

    h3 {
      font-size: 18px;
    }

    p {
      font-size: 13px;
    }
  }

  .map-reroll-btn {
    right: 0;
  }

  .map-node__label {
    max-width: min(var(--map-label-max-width), 42vw);
  }

  .rewards-modal-overlay {
    padding: 14px;
  }

  .rewards-modal {
    padding: 22px 18px;
    border-radius: 28px;
  }

  .reward-mini-card {
    grid-template-columns: 48px minmax(0, 1fr);
    gap: 10px;
    padding: 12px;
  }

  .reward-mini-card__icon {
    width: 48px;
    height: 48px;
    border-radius: 16px;
    font-size: 24px;
  }

  .reward-mini-card__info h4 {
    font-size: 16px;
  }

  .rewards-modal__btn {
    padding: 14px;
    font-size: 16px;
  }
}
</style>
