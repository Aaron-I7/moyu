<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { formatDateTime, formatPoints } from '@/features/child-portal/format'
import {
  getRewardAccent,
  getRewardGap,
  getRewardRequestIcon,
  getRewardTypeLabel,
  getRewardVisualIcon,
  groupRewardRequestsByStatus,
  sortRewardsForDisplay
} from '@/features/child-portal/helpers'
import type {
  ChildRewardItem,
  ChildRewardRedemptionItem,
  ChildRewardRequestItem,
  ChildRewardsResponse
} from '@/features/child-portal/types'

type ModalStatus = '' | 'success' | 'error'

interface RewardRequestCard extends ChildRewardRequestItem {
  image_url?: string
}

interface RewardStatusSection {
  key: 'approved' | 'pending' | 'rejected' | 'fulfilled'
  label: string
  tone: 'mint' | 'sky' | 'rose' | 'amber'
  icon: string
  emptyIcon: string
  emptyText: string
  items: RewardRequestCard[]
}

type RewardStatusSectionKey = RewardStatusSection['key']

interface StackedPreviewItem {
  item: RewardRequestCard
  depth: number
}

type RequestProgressState = 'complete' | 'current' | 'pending' | 'failed'

interface RequestProgressStep {
  key: 'submit' | 'review' | 'use'
  label: string
  caption: string
  state: RequestProgressState
  nextActive?: boolean
}

const props = defineProps<{
  actionBusy: boolean
  currentPoints: number
  description: string
  rewardsData: ChildRewardsResponse | null
  title: string
}>()

const emit = defineEmits<{
  submit: []
  redeem: [rewardId: string, callback: { onSuccess: () => void; onError: (err: string) => void }]
  markUsed: [requestId: string]
  'update:description': [value: string]
  'update:title': [value: string]
}>()

const showRedeemModal = ref(false)
const activeRequestModalKey = ref<RewardStatusSectionKey | null>(null)
const activeRedeemId = ref<string | null>(null)
const modalStatus = ref<{ message: string; type: ModalStatus }>({ message: '', type: '' })
const stackIndexState = ref<Record<RewardStatusSectionKey, number>>({
  approved: 0,
  pending: 0,
  rejected: 0,
  fulfilled: 0
})

const stackGestureState: Record<RewardStatusSectionKey, { startX: number; startY: number; active: boolean }> = {
  approved: { startX: 0, startY: 0, active: false },
  pending: { startX: 0, startY: 0, active: false },
  rejected: { startX: 0, startY: 0, active: false },
  fulfilled: { startX: 0, startY: 0, active: false }
}

const wishPresets = [
  { key: 'outing', label: '探险出游', value: '出去玩', icon: 'ph:park-fill', tone: 'sky' },
  { key: 'toy', label: '神秘玩具', value: '小玩具', icon: 'ph:teddy-bear-fill', tone: 'rose' },
  { key: 'snack', label: '补给零食', value: '好吃的', icon: 'ph:ice-cream-fill', tone: 'amber' },
  { key: 'together', label: '陪伴时光', value: '陪伴', icon: 'ph:hand-heart-fill', tone: 'mint' }
] as const

function toTimestamp(value?: number | string) {
  if (!value) {
    return 0
  }

  if (typeof value === 'number') {
    return value
  }

  const time = new Date(value).getTime()
  return Number.isNaN(time) ? 0 : time
}

function normalizeRewardKey(value?: string) {
  return String(value || '').trim().replace(/\s+/g, '').toLowerCase()
}

function updateTitle(event: Event) {
  emit('update:title', (event.target as HTMLInputElement).value)
}

function togglePreset(value: string) {
  emit('update:description', props.description === value ? '' : value)
}

function isPresetActive(value: string) {
  return props.description === value
}

const rewardCards = computed(() => sortRewardsForDisplay(props.rewardsData?.rewards || [], props.currentPoints))
const redemptionHistory = computed<ChildRewardRedemptionItem[]>(() => {
  const items = [...(props.rewardsData?.redemption_history || [])]
  items.sort((left, right) => toTimestamp(right.requested_at) - toTimestamp(left.requested_at))
  return items
})

const rewardAssetMap = computed(() => {
  const map = new Map<string, { image_url?: string; reward_type?: string }>()

  for (const reward of props.rewardsData?.rewards || []) {
    const key = normalizeRewardKey(reward.title)
    if (!key || map.has(key)) {
      continue
    }

    map.set(key, {
      image_url: reward.image_url,
      reward_type: reward.reward_type
    })
  }

  return map
})

const pendingRedemptionMap = computed(() => {
  const map = new Map<string, ChildRewardRedemptionItem>()

  for (const item of redemptionHistory.value) {
    if (!item.reward_id || item.status !== 'pending' || map.has(item.reward_id)) {
      continue
    }

    map.set(item.reward_id, item)
  }

  return map
})

const requestCards = computed<RewardRequestCard[]>(() => {
  const items = [...(props.rewardsData?.request_history || [])]

  items.sort((left, right) => toTimestamp(right.requested_at) - toTimestamp(left.requested_at))

  return items.map((item) => {
    const matchedReward = rewardAssetMap.value.get(normalizeRewardKey(item.title))

    return {
      ...item,
      image_url: matchedReward?.image_url,
      reward_type: item.reward_type || matchedReward?.reward_type
    }
  })
})

const requestGroups = computed(() => groupRewardRequestsByStatus(requestCards.value))
const pendingCount = computed(() => requestGroups.value.pending.length)
const statusSections = computed<RewardStatusSection[]>(() => [
  {
    key: 'approved',
    label: '待使用',
    tone: 'mint',
    icon: 'ph:seal-check-fill',
    emptyIcon: 'ph:gift-light',
    emptyText: '现在还没有进入待使用的奖励。',
    items: requestGroups.value.approved
  },
  {
    key: 'pending',
    label: '待审核',
    tone: 'sky',
    icon: 'ph:hourglass-medium-fill',
    emptyIcon: 'ph:hourglass-low-light',
    emptyText: '提交后的新愿望会先在这里等家长审核。',
    items: requestGroups.value.pending
  },
  {
    key: 'rejected',
    label: '未通过',
    tone: 'rose',
    icon: 'ph:seal-warning-fill',
    emptyIcon: 'ph:confetti-light',
    emptyText: '现在没有未通过的奖励。',
    items: requestGroups.value.rejected
  },
  {
    key: 'fulfilled',
    label: '已使用',
    tone: 'amber',
    icon: 'ph:check-circle-fill',
    emptyIcon: 'ph:check-fat-light',
    emptyText: '还没有放进已使用里的奖励。',
    items: requestGroups.value.fulfilled
  }
])
const activeRequestModalSection = computed(() => {
  if (!activeRequestModalKey.value) {
    return null
  }

  return statusSections.value.find((group) => group.key === activeRequestModalKey.value) || null
})

function getPendingRedemption(item: ChildRewardItem) {
  return pendingRedemptionMap.value.get(item.reward_id) || null
}

function canRedeemReward(item: ChildRewardItem) {
  return getRewardGap(item, props.currentPoints) === 0 && !getPendingRedemption(item)
}

const redeemableRewards = computed(() => rewardCards.value.filter((item) => canRedeemReward(item)))

function getRedeemHint(item: ChildRewardItem) {
  if (getPendingRedemption(item)) {
    return '这份奖励已经送去家长审核啦，先等等结果。'
  }

  const gap = getRewardGap(item, props.currentPoints)
  if (gap === 0) {
    return '积分已经够啦，现在就能发起兑换。'
  }

  return `还差 ${gap} 分，先继续完成任务吧。`
}

function getRedeemButtonLabel(item: ChildRewardItem) {
  if (getPendingRedemption(item)) {
    return '审核中'
  }

  return getRewardGap(item, props.currentPoints) === 0 ? '立即兑换' : '积分不足'
}

function openRedeemModal() {
  modalStatus.value = { message: '', type: '' }
  showRedeemModal.value = true
}

function closeRedeemModal() {
  showRedeemModal.value = false
}

function openRequestModal(key: RewardStatusSectionKey) {
  activeRequestModalKey.value = key
}

function closeRequestModal() {
  activeRequestModalKey.value = null
}

function handleRedeem(rewardId: string) {
  modalStatus.value = { message: '', type: '' }
  activeRedeemId.value = rewardId

  emit('redeem', rewardId, {
    onSuccess: () => {
      modalStatus.value = { message: '兑换申请已经送给家长啦。', type: 'success' }
      activeRedeemId.value = null
    },
    onError: (err: string) => {
      modalStatus.value = { message: err || '兑换失败，请稍后再试。', type: 'error' }
      activeRedeemId.value = null
    }
  })
}

function getRequestCardDetail(item: RewardRequestCard) {
  if (item.review_remark) {
    return item.review_remark
  }

  if (item.description) {
    return item.description
  }

  if (item.status === 'approved') {
    return '已经通过啦，使用完记得点一下“我已使用”。'
  }

  if (item.status === 'rejected') {
    return '这次没有通过，换个方向再试试。'
  }

  if (item.status === 'fulfilled') {
    return '这份奖励已经顺利放进已使用里啦。'
  }

  return '家长正在查看这份申请，耐心等等就会有结果。'
}

function getRequestRecordTime(item: RewardRequestCard) {
  return formatDateTime(item.requested_at)
}

function getRequestProgressSteps(item: RewardRequestCard): RequestProgressStep[] {
  const status = item.status || 'pending'

  if (status === 'approved') {
    return [
      { key: 'submit', label: '提交', caption: '已提交', state: 'complete', nextActive: true },
      { key: 'review', label: '审核', caption: '已通过', state: 'complete', nextActive: true },
      { key: 'use', label: '使用', caption: '待使用', state: 'current' }
    ]
  }

  if (status === 'fulfilled') {
    return [
      { key: 'submit', label: '提交', caption: '已提交', state: 'complete', nextActive: true },
      { key: 'review', label: '审核', caption: '已通过', state: 'complete', nextActive: true },
      { key: 'use', label: '使用', caption: '已使用', state: 'current' }
    ]
  }

  if (status === 'rejected') {
    return [
      { key: 'submit', label: '提交', caption: '已提交', state: 'complete', nextActive: true },
      { key: 'review', label: '审核', caption: '未通过', state: 'failed', nextActive: false },
      { key: 'use', label: '使用', caption: '未进入', state: 'pending' }
    ]
  }

  return [
    { key: 'submit', label: '提交', caption: '已提交', state: 'complete', nextActive: true },
    { key: 'review', label: '审核', caption: '审核中', state: 'current', nextActive: false },
    { key: 'use', label: '使用', caption: '未开始', state: 'pending' }
  ]
}

function getSafeStackIndex(key: RewardStatusSectionKey, total: number) {
  if (total <= 0) {
    return 0
  }

  return Math.min(stackIndexState.value[key] || 0, total - 1)
}

function setStackIndex(key: RewardStatusSectionKey, nextIndex: number, total: number) {
  if (total <= 0) {
    stackIndexState.value[key] = 0
    return
  }

  const normalizedIndex = ((nextIndex % total) + total) % total
  stackIndexState.value[key] = normalizedIndex
}

function goToNextStackCard(key: RewardStatusSectionKey, total: number) {
  setStackIndex(key, getSafeStackIndex(key, total) + 1, total)
}

function getStackPreviewItems(items: RewardRequestCard[], key: RewardStatusSectionKey): StackedPreviewItem[] {
  const total = items.length
  const visibleCount = Math.min(total, 3)
  const activeIndex = getSafeStackIndex(key, total)
  const previews: StackedPreviewItem[] = []

  for (let depth = visibleCount - 1; depth >= 0; depth -= 1) {
    previews.push({
      item: items[(activeIndex + depth) % total]!,
      depth
    })
  }

  return previews
}

function handleStackTouchStart(key: RewardStatusSectionKey, event: TouchEvent) {
  if (event.touches.length !== 1) {
    return
  }

  const touch = event.touches[0]
  if (!touch) {
    return
  }

  stackGestureState[key].startX = touch.clientX
  stackGestureState[key].startY = touch.clientY
  stackGestureState[key].active = true
}

function handleStackTouchEnd(key: RewardStatusSectionKey, event: TouchEvent, total: number) {
  const gesture = stackGestureState[key]
  if (!gesture.active || event.changedTouches.length !== 1 || total <= 1) {
    gesture.active = false
    return
  }

  gesture.active = false
  const touch = event.changedTouches[0]
  if (!touch) {
    return
  }

  const deltaX = touch.clientX - gesture.startX
  const deltaY = touch.clientY - gesture.startY
  if (deltaX > -64 || Math.abs(deltaY) > 48) {
    return
  }

  goToNextStackCard(key, total)
}
</script>

<template>
  <section class="reward-command">
    <header class="reward-command__sign">
      <div class="reward-command__hero">
        <span class="reward-command__eyebrow">奖励空间</span>
        <h2>努力一点，就有新的奖励</h2>
      </div>

      <div class="reward-command__latest" v-if="pendingCount > 0">
        <span>待审核</span>
        <strong>{{ pendingCount }} 项待审</strong>
        <p>可兑换 {{ redeemableRewards.length }} 项</p>
      </div>
    </header>

    <div class="reward-command__layout">
      <div class="reward-command__main">
        <section class="status-board">
          <div class="status-board__groups">
            <section
              v-for="group in statusSections"
              :key="group.key"
              class="request-group"
              :class="`request-group--${group.tone}`"
            >
              <button
                v-if="group.items.length > 1"
                type="button"
                class="request-group__view-all"
                @click="openRequestModal(group.key)"
              >
                查看全部
              </button>

              <div class="request-group__header" :class="`request-group__header--${group.tone}`">
                <Icon :icon="group.icon" />
                <div>
                  <h4>{{ group.label }}</h4>
                </div>
                <span class="request-group__count">{{ group.items.length }}</span>
              </div>

              <div v-if="group.items.length" class="stack-preview">
                <div
                  class="stack-preview__stage"
                  @touchstart.passive="handleStackTouchStart(group.key, $event)"
                  @touchend.passive="handleStackTouchEnd(group.key, $event, group.items.length)"
                >
                  <div
                    v-for="preview in getStackPreviewItems(group.items, group.key)"
                    :key="`${group.key}-${preview.depth}-${preview.item.request_id}`"
                    class="stack-preview__layer"
                    :class="[
                      `stack-preview__layer--depth-${preview.depth}`,
                      `stack-preview__layer--${group.tone}`,
                      { 'stack-preview__layer--active': preview.depth === 0 }
                    ]"
                  >
                    <article
                      v-if="preview.depth === 0"
                      class="request-card request-card--stack"
                      :class="`request-card--${group.tone}`"
                    >
                      <div class="request-card__side">
                        <div class="request-card__icon" :class="`request-card__icon--${group.tone}`">
                          <img v-if="preview.item.image_url" :src="preview.item.image_url" :alt="preview.item.title" />
                          <Icon v-else :icon="getRewardRequestIcon(preview.item.status)" />
                        </div>
                      </div>

                      <div class="request-card__body">
                        <div class="request-card__topline">
                          <div class="request-card__meta-strip">
                            <span v-if="preview.item.reward_type" class="request-card__type">
                              {{ getRewardTypeLabel(preview.item.reward_type) }}
                            </span>
                            <span
                              class="request-card__time"
                              :title="`最近记录 ${getRequestRecordTime(preview.item)}`"
                            >
                              <Icon icon="ph:clock-countdown-fill" />
                              <strong>{{ getRequestRecordTime(preview.item) }}</strong>
                            </span>
                          </div>
                        </div>

                        <div class="request-card__copy">
                          <div class="request-card__title">
                            <h5>{{ preview.item.title }}</h5>
                          </div>

                          <p class="request-card__reason" :title="getRequestCardDetail(preview.item)">
                            {{ getRequestCardDetail(preview.item) }}
                          </p>
                        </div>

                        <div class="request-card__progress" :class="`request-card__progress--${group.tone}`">
                          <div
                            v-for="(step, index) in getRequestProgressSteps(preview.item)"
                            :key="`${preview.item.request_id}-${step.key}`"
                            class="request-card__progress-step"
                            :class="`request-card__progress-step--${step.state}`"
                          >
                            <span class="request-card__progress-node">{{ index + 1 }}</span>
                            <strong>{{ step.label }}</strong>
                            <span>{{ step.caption }}</span>
                            <i
                              v-if="index < 2"
                              class="request-card__progress-line"
                              :class="{
                                'request-card__progress-line--active': step.nextActive
                              }"
                            />
                          </div>
                        </div>

                        <div class="request-card__actions">
                          <button
                            v-if="group.key === 'approved'"
                            type="button"
                            class="request-card__confirm"
                            :disabled="actionBusy"
                            @click="emit('markUsed', preview.item.request_id)"
                          >
                            我完成了
                          </button>
                        </div>
                      </div>
                    </article>

                    <div
                      v-else
                      class="stack-preview__back-card"
                      :class="`stack-preview__back-card--${group.tone}`"
                    >
                      <div class="stack-preview__back-icon" :class="`stack-preview__back-icon--${group.tone}`">
                        <img v-if="preview.item.image_url" :src="preview.item.image_url" :alt="preview.item.title" />
                        <Icon v-else :icon="getRewardRequestIcon(preview.item.status)" />
                      </div>
                      <div class="stack-preview__back-copy">
                        <strong>{{ preview.item.title }}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="stack-preview__footer">
                  <div v-if="group.items.length > 1" class="stack-preview__dots">
                    <button
                      v-for="(_, index) in group.items"
                      :key="`${group.key}-dot-${index}`"
                      type="button"
                      class="stack-preview__dot"
                      :class="{ 'stack-preview__dot--active': index === getSafeStackIndex(group.key, group.items.length) }"
                      :aria-label="`查看第 ${index + 1} 张卡片`"
                      @click="setStackIndex(group.key, index, group.items.length)"
                    />
                  </div>
                  <span class="stack-preview__count">
                    {{ getSafeStackIndex(group.key, group.items.length) + 1 }} / {{ group.items.length }}
                  </span>
                </div>
              </div>

              <div v-else class="reward-command__empty reward-command__empty--soft reward-command__empty--group">
                <Icon :icon="group.emptyIcon" />
                <p>{{ group.emptyText }}</p>
              </div>
            </section>
          </div>
        </section>
      </div>

      <aside class="reward-command__sidebar">
        <article class="side-panel side-panel--vault">
          <div class="side-panel__title side-panel__title--sky">
            <Icon icon="ph:treasure-chest-fill" />
            <div>
              <h3>兑换奖励入口</h3>
            </div>
          </div>

          <div class="vault-preview">
            <ul v-if="redeemableRewards.length" class="vault-preview__list">
              <li v-for="item in redeemableRewards.slice(0, 3)" :key="item.reward_id">
                <Icon :icon="getRewardVisualIcon(item.reward_type)" />
                <span>{{ item.title }}</span>
              </li>
            </ul>

            <p v-else class="vault-preview__hint">继续攒积分，宝库会越来越热闹。</p>

            <button type="button" class="vault-preview__button" @click="openRedeemModal">
              打开奖励宝库
            </button>
          </div>
        </article>

        <article class="side-panel side-panel--wish">
          <div class="side-panel__title side-panel__title--rose">
            <Icon icon="ph:paper-plane-tilt-fill" />
            <div>
              <h3>提交新愿望</h3>
            </div>
          </div>

          <form class="wish-form" @submit.prevent="emit('submit')">
            <label class="wish-form__field">
              <span>这次想申请什么？</span>
              <input
                :value="title"
                maxlength="30"
                placeholder="比如: 周末去公园探险"
                @input="updateTitle"
              />
            </label>

            <div class="wish-form__presets">
              <button
                v-for="item in wishPresets"
                :key="item.key"
                type="button"
                class="wish-chip"
                :class="[`wish-chip--${item.tone}`, { 'wish-chip--active': isPresetActive(item.value) }]"
                @click="togglePreset(item.value)"
              >
                <Icon :icon="item.icon" />
                <div>
                  <strong>{{ item.label }}</strong>
                  <span>{{ item.value }}</span>
                </div>
              </button>
            </div>

            <div v-if="description" class="wish-form__current">
              <Icon icon="ph:sparkle-fill" />
              <span>这次愿望方向: {{ description }}</span>
            </div>

            <button type="submit" class="wish-form__submit" :disabled="actionBusy || !title.trim()">
              提交新申请
            </button>
          </form>
        </article>
      </aside>
    </div>

    <transition name="fade">
      <div v-if="showRedeemModal" class="redeem-modal-overlay" @click="closeRedeemModal">
        <div class="redeem-modal" @click.stop>
          <button type="button" class="redeem-modal__close" @click="closeRedeemModal">
            <Icon icon="ph:x-bold" />
          </button>

          <div class="redeem-modal__header">
            <span class="redeem-modal__eyebrow">奖励宝库</span>
            <h3>选择现在想兑换的奖励</h3>
            <p>这里展示的是现成奖励。送出的兑换会先显示为“审核中”，不会混进“提交新愿望”的记录里。</p>

            <transition name="fade">
              <div v-if="modalStatus.message" class="redeem-modal__alert" :class="`redeem-modal__alert--${modalStatus.type}`">
                <Icon :icon="modalStatus.type === 'success' ? 'ph:check-circle-fill' : 'ph:warning-circle-fill'" />
                <span>{{ modalStatus.message }}</span>
              </div>
            </transition>
          </div>

          <div class="redeem-modal__list">
            <article
              v-for="item in rewardCards"
              :key="item.reward_id"
              class="reward-option"
              :class="[`reward-option--${getRewardAccent(item.reward_type)}`, { 'reward-option--ready': getRewardGap(item, currentPoints) === 0 }]"
            >
              <div class="reward-option__media" :class="`reward-option__media--${getRewardAccent(item.reward_type)}`">
                <img v-if="item.image_url" :src="item.image_url" :alt="item.title" />
                <Icon v-else :icon="getRewardVisualIcon(item.reward_type)" />
              </div>

              <div class="reward-option__body">
                <div class="reward-option__header">
                  <div>
                    <span class="reward-option__type">{{ getRewardTypeLabel(item.reward_type) }}</span>
                    <h4>{{ item.title }}</h4>
                  </div>
                  <span class="reward-option__cost">
                    <Icon icon="ph:shooting-star-fill" />
                    {{ formatPoints(item.cost_points) }}
                  </span>
                </div>
                <p>{{ getRedeemHint(item) }}</p>
              </div>

              <div class="reward-option__action">
                <button
                  type="button"
                  class="reward-option__button"
                  :class="{ 'reward-option__button--loading': activeRedeemId === item.reward_id }"
                  :disabled="actionBusy || !canRedeemReward(item)"
                  @click="handleRedeem(item.reward_id)"
                >
                  <Icon v-if="activeRedeemId === item.reward_id" icon="ph:spinner-gap-bold" class="loading-spin" />
                  <span v-else>{{ getRedeemButtonLabel(item) }}</span>
                </button>
              </div>
            </article>

            <div v-if="!rewardCards.length" class="reward-command__empty reward-command__empty--modal">
              <Icon icon="ph:treasure-chest-light" />
              <p>宝库里还没有新的奖励。</p>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="activeRequestModalSection" class="redeem-modal-overlay" @click="closeRequestModal">
        <div class="redeem-modal request-collection-modal" @click.stop>
          <button type="button" class="redeem-modal__close" @click="closeRequestModal">
            <Icon icon="ph:x-bold" />
          </button>

          <div class="redeem-modal__header request-collection-modal__header">
            <span class="redeem-modal__eyebrow">{{ activeRequestModalSection.label }}</span>
            <h3>{{ activeRequestModalSection.label }} · 全部卡片</h3>
            <p>这里会把这个状态里的奖励卡片一次展开，想慢慢看或直接处理都更方便。</p>
          </div>

          <div class="request-collection-modal__list">
            <article
              v-for="item in activeRequestModalSection.items"
              :key="`${activeRequestModalSection.key}-${item.request_id}`"
              class="request-card request-card--modal"
              :class="`request-card--${activeRequestModalSection.tone}`"
            >
              <div class="request-card__side">
                <div class="request-card__icon" :class="`request-card__icon--${activeRequestModalSection.tone}`">
                  <img v-if="item.image_url" :src="item.image_url" :alt="item.title" />
                  <Icon v-else :icon="getRewardRequestIcon(item.status)" />
                </div>
              </div>

              <div class="request-card__body">
                <div class="request-card__topline">
                  <div class="request-card__meta-strip">
                    <span v-if="item.reward_type" class="request-card__type">
                      {{ getRewardTypeLabel(item.reward_type) }}
                    </span>
                    <span class="request-card__time" :title="`最近记录 ${getRequestRecordTime(item)}`">
                      <Icon icon="ph:clock-countdown-fill" />
                      <strong>{{ getRequestRecordTime(item) }}</strong>
                    </span>
                  </div>
                </div>

                <div class="request-card__copy">
                  <div class="request-card__title">
                    <h5>{{ item.title }}</h5>
                  </div>

                  <p class="request-card__reason" :title="getRequestCardDetail(item)">{{ getRequestCardDetail(item) }}</p>
                </div>

                <div
                  class="request-card__progress"
                  :class="`request-card__progress--${activeRequestModalSection.tone}`"
                >
                  <div
                    v-for="(step, index) in getRequestProgressSteps(item)"
                    :key="`${item.request_id}-${step.key}`"
                    class="request-card__progress-step"
                    :class="`request-card__progress-step--${step.state}`"
                  >
                    <span class="request-card__progress-node">{{ index + 1 }}</span>
                    <strong>{{ step.label }}</strong>
                    <span>{{ step.caption }}</span>
                    <i
                      v-if="index < 2"
                      class="request-card__progress-line"
                      :class="{
                        'request-card__progress-line--active': step.nextActive
                      }"
                    />
                  </div>
                </div>

                <div class="request-card__actions">
                  <button
                    v-if="activeRequestModalSection.key === 'approved'"
                    type="button"
                    class="request-card__confirm"
                    :disabled="actionBusy"
                    @click="emit('markUsed', item.request_id)"
                  >
                    我完成了
                  </button>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </transition>
  </section>
</template>

<style scoped lang="scss">
@use '../adventure-theme.scss' as theme;

.reward-command {
  @include theme.page-shell;
}

.reward-command__sign {
  @include theme.sign-shell(linear-gradient(135deg, #ffd7a5 0%, #ffb6c7 42%, #ffc2f0 100%), #7b2d4d, #d37a90);
}

.reward-command__sign--simple {
  min-height: 0;
}

.reward-command__hero,
.reward-command__latest {
  position: relative;
  z-index: 1;
}

.reward-command__hero--tight {
  max-width: 540px;
}

.reward-command__hero {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 620px;

  h2 {
    margin: 0;
    font-size: clamp(28px, 4vw, 38px);
    line-height: 1.08;
    font-weight: 900;
  }

  p {
    margin: 0;
    font-size: 15px;
    line-height: 1.7;
    color: rgba(123, 45, 77, 0.82);
    max-width: 540px;
  }
}

.reward-command__eyebrow {
  display: inline-flex;
  width: fit-content;
  padding: 7px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.58);
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.06em;
}

.reward-command__latest {
  @include theme.surface-card(18px 20px, 24px);
  min-width: min(240px, 100%);

  span {
    display: block;
    font-size: 13px;
    font-weight: 900;
    color: #8e4d65;
  }

  strong {
    display: block;
    margin-top: 8px;
    font-size: 24px;
    line-height: 1.15;
    color: #7b2d4d;
  }

  p {
    margin: 8px 0 0;
    font-size: 13px;
    line-height: 1.65;
    color: #945f74;
  }
}

.reward-command__focus {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.focus-card {
  @include theme.surface-card(20px, 28px);
  display: flex;
  flex-direction: column;
  gap: 12px;

  strong {
    font-size: 34px;
    line-height: 1;
    font-weight: 900;
  }

  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.7;
    color: #607892;
  }
}

.focus-card__top {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;

  svg {
    font-size: 18px;
  }
}

.focus-card--mint .focus-card__top { background: rgba(86, 204, 118, 0.14); color: #258145; }
.focus-card--amber .focus-card__top { background: rgba(255, 184, 71, 0.14); color: #9a5b00; }
.focus-card--rose .focus-card__top { background: rgba(255, 137, 164, 0.14); color: #b5355d; }

.focus-card--mint strong { color: #258145; }
.focus-card--amber strong { color: #a95b00; }
.focus-card--rose strong { color: #b5355d; }

.reward-command__layout {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.7fr);
  gap: 24px;
}

.reward-command__main,
.reward-command__sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.status-board,
.side-panel {
  @include theme.surface-card(24px, 30px);
}

.status-board--focused {
  padding-top: 22px;
}

.status-board__title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;

  span {
    display: inline-flex;
    width: fit-content;
    padding: 7px 12px;
    border-radius: 999px;
    background: rgba(255, 220, 183, 0.46);
    color: #8f5500;
    font-size: 12px;
    font-weight: 900;
  }

  h3 {
    margin: 10px 0 0;
    font-size: 28px;
    line-height: 1.08;
    color: #24384c;
  }
}

.status-board__redeem-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 18px;
  border: none;
  border-radius: 18px;
  background: linear-gradient(135deg, #ffc96f 0%, #f59e0b 100%);
  color: #643b00;
  font-size: 15px;
  font-weight: 900;
  box-shadow: 0 8px 0 rgba(224, 139, 0, 0.24);
  cursor: pointer;
  transition: transform 0.15s ease;

  &:hover {
    transform: translateY(-2px);
  }
}

.status-board__groups {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.request-group {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 320px;
  padding: 20px;
  border-radius: 30px;
  border: 1px solid rgba(200, 212, 228, 0.4);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(247, 250, 255, 0.92) 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.request-group--mint {
  border-color: rgba(86, 204, 118, 0.18);
  background: linear-gradient(180deg, rgba(238, 255, 242, 0.96) 0%, rgba(255, 255, 255, 0.94) 42%);
}

.request-group--sky {
  border-color: rgba(105, 184, 255, 0.18);
  background: linear-gradient(180deg, rgba(236, 247, 255, 0.96) 0%, rgba(255, 255, 255, 0.94) 42%);
}

.request-group--rose {
  border-color: rgba(255, 137, 164, 0.18);
  background: linear-gradient(180deg, rgba(255, 241, 245, 0.96) 0%, rgba(255, 255, 255, 0.94) 42%);
}

.request-group--amber {
  border-color: rgba(255, 184, 71, 0.18);
  background: linear-gradient(180deg, rgba(255, 247, 228, 0.96) 0%, rgba(255, 255, 255, 0.94) 42%);
}

.request-group__header,
.side-panel__title {
  @include theme.title-pill(linear-gradient(135deg, #ffd89d 0%, #ffb86d 100%), #7a4300);
  margin-bottom: 18px;
  max-width: calc(100% - 112px);

  h3,
  h4 {
    margin: 0;
    font-size: 20px;
    line-height: 1.1;
  }

  p {
    margin: 3px 0 0;
    font-size: 12px;
    font-weight: 700;
    opacity: 0.82;
  }
}

.request-group__header--mint,
.side-panel__title--mint { @include theme.title-pill(linear-gradient(135deg, #b8f4c1 0%, #6ed183 100%), #245a32); }
.request-group__header--amber,
.side-panel__title--amber { @include theme.title-pill(linear-gradient(135deg, #ffe28f 0%, #ffb444 100%), #704100); }
.request-group__header--sky,
.side-panel__title--sky { @include theme.title-pill(linear-gradient(135deg, #abe7ff 0%, #69b8ff 100%), #1f4f81); }
.request-group__header--rose,
.side-panel__title--rose { @include theme.title-pill(linear-gradient(135deg, #ffd2dc 0%, #ff9bb0 100%), #8e2d4f); }

.request-group__view-all {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 999px;
  padding: 7px 12px;
  min-height: 32px;
  background: rgba(255, 255, 255, 0.82);
  color: #365471;
  font-size: 12px;
  font-weight: 900;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: 0 8px 16px rgba(91, 114, 140, 0.08);
}

.request-group__count {
  min-width: 30px;
  height: 30px;
  padding: 0 9px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.34);
  font-size: 14px;
}

.stack-preview {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 14px;
}

.stack-preview__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.stack-preview__stage {
  position: relative;
  flex: 1;
  min-height: 292px;
  touch-action: pan-y;
  user-select: none;
}

.stack-preview__layer {
  position: absolute;
  inset: 0;
  transition: transform 0.28s ease, opacity 0.28s ease;
}

.stack-preview__layer--depth-0 {
  z-index: 3;
}

.stack-preview__layer--depth-1 {
  z-index: 2;
  transform: translateY(14px) scale(0.97);
  opacity: 0.92;
  pointer-events: none;
}

.stack-preview__layer--depth-2 {
  z-index: 1;
  transform: translateY(28px) scale(0.94);
  opacity: 0.76;
  pointer-events: none;
}

.stack-preview__back-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: end;
  gap: 12px;
  height: 100%;
  padding: 18px;
  border-radius: 26px;
  border: 1px solid rgba(196, 210, 226, 0.26);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(247, 251, 255, 0.94) 100%);
  box-shadow: 0 12px 18px rgba(96, 118, 143, 0.05);
}

.stack-preview__back-card--mint {
  border-color: rgba(86, 204, 118, 0.18);
}

.stack-preview__back-card--sky {
  border-color: rgba(105, 184, 255, 0.18);
}

.stack-preview__back-card--rose {
  border-color: rgba(255, 137, 164, 0.18);
}

.stack-preview__back-card--amber {
  border-color: rgba(255, 184, 71, 0.18);
}

.stack-preview__back-icon {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  overflow: hidden;
  font-size: 22px;
  color: white;
}

.stack-preview__back-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.stack-preview__back-icon--mint { background: linear-gradient(135deg, #a8edaf 0%, #4dbf75 100%); }
.stack-preview__back-icon--amber,
.stack-preview__back-icon--sky { background: linear-gradient(135deg, #9fe1ff 0%, #649cff 100%); }
.stack-preview__back-icon--rose { background: linear-gradient(135deg, #ffb8b0 0%, #f2856a 100%); }

.stack-preview__back-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;

  strong {
    font-size: 15px;
    line-height: 1.3;
    color: #27415a;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.stack-preview__dots {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.stack-preview__dot {
  width: 10px;
  height: 10px;
  border: none;
  border-radius: 999px;
  background: rgba(123, 147, 172, 0.26);
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease;

  &:hover {
    transform: scale(1.08);
  }
}

.stack-preview__dot--active {
  background: linear-gradient(135deg, #6bbcff 0%, #4d7cff 100%);
}

.stack-preview__count {
  font-size: 12px;
  font-weight: 900;
  color: #6a8298;
}

.request-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;
  padding: 16px;
  border-radius: 26px;
  border: 2px solid rgba(196, 210, 226, 0.18);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 251, 255, 0.94) 100%);
  box-shadow: 0 12px 18px rgba(96, 118, 143, 0.08);
}

.request-card--stack {
  position: relative;
  height: 100%;
  min-height: 292px;
}

.request-card--stack .request-card__title h5,
.request-card--stack .request-card__reason {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.request-card--stack .request-card__title h5 {
  -webkit-line-clamp: 2;
}

.request-card--stack .request-card__reason {
  -webkit-line-clamp: 2;
  min-height: calc(14px * 1.7 * 2);
  cursor: help;
}

.request-card--modal {
  min-height: 220px;
}

.request-card--mint {
  border-color: rgba(86, 204, 118, 0.22);
  box-shadow: 0 12px 18px rgba(57, 181, 109, 0.1);
}

.request-card--amber {
  border-color: rgba(255, 184, 71, 0.24);
}

.request-card--rose {
  border-color: rgba(255, 137, 164, 0.22);
}

.request-card__icon {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  font-size: 28px;
  color: white;
  overflow: hidden;
}

.request-card__icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.request-card__side {
  width: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.request-card__icon--mint { background: linear-gradient(135deg, #a8edaf 0%, #4dbf75 100%); }
.request-card__icon--amber,
.request-card__icon--sky { background: linear-gradient(135deg, #9fe1ff 0%, #649cff 100%); }
.request-card__icon--rose { background: linear-gradient(135deg, #ffb8b0 0%, #f2856a 100%); }

.request-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.request-card__topline {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 32px;
}

.request-card--stack .request-card__topline,
.request-card--modal .request-card__topline {
  min-height: 32px;
}

.request-card__actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  min-height: 44px;
  padding-top: 6px;
  margin-top: auto;
}

.request-card--stack .request-card__actions {
  position: absolute;
  right: 16px;
  bottom: 16px;
  min-height: 0;
  padding-top: 0;
  margin-top: 0;
  z-index: 2;
}

.request-card__copy {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.request-card__meta-strip {
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.request-card__time {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(234, 241, 248, 0.92);
  color: #5d7490;
  font-size: 12px;
  font-weight: 900;

  svg {
    flex-shrink: 0;
    font-size: 14px;
    color: #6d86a2;
  }

  strong {
    display: block;
    min-width: 0;
    font-size: 12px;
    line-height: 1.2;
    color: #4f6784;
    font-weight: 900;
  }
}

.request-card__title {
  min-width: 0;

  h5 {
    margin: 0;
    font-size: 20px;
    line-height: 1.15;
    color: #27384d;
    font-weight: 900;
  }
}

.request-card__type {
  display: inline-flex;
  width: fit-content;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(122, 148, 176, 0.14);
  color: #627792;
  font-size: 12px;
  font-weight: 900;
}

.request-card__snapshot {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.request-card__snapshot-item {
  padding: 12px;
  border-radius: 18px;
  background: rgba(244, 248, 252, 0.9);

  span {
    display: block;
    font-size: 11px;
    font-weight: 900;
    color: #7b8fa7;
  }

  strong {
    display: block;
    margin-top: 8px;
    font-size: 15px;
    line-height: 1.3;
    color: #284055;
  }
}

.request-card__reason {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: #607892;
}

.request-card__progress {
  --request-progress-fill-start: rgba(182, 241, 191, 0.9);
  --request-progress-fill-end: rgba(109, 210, 133, 0.96);
  --request-progress-current-start: rgba(205, 246, 212, 0.94);
  --request-progress-current-end: rgba(109, 210, 133, 0.98);
  --request-progress-border: rgba(104, 190, 131, 0.46);
  --request-progress-text: #24593a;
  --request-progress-caption: #4f7f62;
  --request-progress-line: linear-gradient(90deg, rgba(112, 194, 138, 0.84) 0%, rgba(109, 210, 133, 0.82) 100%);
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  min-height: 92px;
  padding: 12px 10px 6px;
  border-radius: 18px;
  background: rgba(246, 249, 253, 0.9);
}

.request-card__progress--mint {
  --request-progress-fill-start: rgba(182, 241, 191, 0.9);
  --request-progress-fill-end: rgba(109, 210, 133, 0.96);
  --request-progress-current-start: rgba(205, 246, 212, 0.94);
  --request-progress-current-end: rgba(109, 210, 133, 0.98);
  --request-progress-border: rgba(104, 190, 131, 0.46);
  --request-progress-text: #24593a;
  --request-progress-caption: #4f7f62;
  --request-progress-line: linear-gradient(90deg, rgba(112, 194, 138, 0.84) 0%, rgba(109, 210, 133, 0.82) 100%);
  background: linear-gradient(180deg, rgba(241, 255, 244, 0.96) 0%, rgba(247, 251, 255, 0.94) 100%);
}

.request-card__progress--sky {
  --request-progress-fill-start: rgba(191, 229, 255, 0.96);
  --request-progress-fill-end: rgba(108, 167, 255, 0.98);
  --request-progress-current-start: rgba(214, 239, 255, 0.98);
  --request-progress-current-end: rgba(108, 167, 255, 0.98);
  --request-progress-border: rgba(112, 179, 246, 0.42);
  --request-progress-text: #173f71;
  --request-progress-caption: #3a6fba;
  --request-progress-line: linear-gradient(90deg, rgba(122, 194, 255, 0.84) 0%, rgba(108, 167, 255, 0.82) 100%);
  background: linear-gradient(180deg, rgba(239, 248, 255, 0.96) 0%, rgba(247, 251, 255, 0.94) 100%);
}

.request-card__progress--rose {
  --request-progress-fill-start: rgba(255, 220, 227, 0.96);
  --request-progress-fill-end: rgba(255, 156, 177, 0.98);
  --request-progress-current-start: rgba(255, 233, 238, 0.98);
  --request-progress-current-end: rgba(255, 156, 177, 0.98);
  --request-progress-border: rgba(239, 138, 161, 0.44);
  --request-progress-text: #8d2f4e;
  --request-progress-caption: #b04f6d;
  --request-progress-line: linear-gradient(90deg, rgba(247, 159, 179, 0.84) 0%, rgba(239, 138, 161, 0.82) 100%);
  background: linear-gradient(180deg, rgba(255, 244, 247, 0.96) 0%, rgba(249, 250, 253, 0.94) 100%);
}

.request-card__progress--amber {
  --request-progress-fill-start: rgba(255, 236, 180, 0.96);
  --request-progress-fill-end: rgba(255, 190, 92, 0.98);
  --request-progress-current-start: rgba(255, 243, 208, 0.98);
  --request-progress-current-end: rgba(255, 190, 92, 0.98);
  --request-progress-border: rgba(232, 171, 73, 0.44);
  --request-progress-text: #7c5310;
  --request-progress-caption: #ab7b2f;
  --request-progress-line: linear-gradient(90deg, rgba(255, 206, 118, 0.84) 0%, rgba(255, 190, 92, 0.82) 100%);
  background: linear-gradient(180deg, rgba(255, 248, 234, 0.96) 0%, rgba(249, 250, 253, 0.94) 100%);
}

.request-card__progress-step {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-width: 0;
  text-align: center;

  strong,
  span {
    display: block;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    font-size: 12px;
    line-height: 1.2;
    color: #57718c;
    font-weight: 900;
  }

  span {
    font-size: 11px;
    line-height: 1.2;
    color: #87a0b9;
    font-weight: 800;
  }
}

.request-card__progress-node {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  border: 2px solid rgba(150, 170, 193, 0.4);
  background: rgba(255, 255, 255, 0.92);
  color: #6f88a3;
  font-size: 12px;
  font-weight: 900;
  position: relative;
  z-index: 1;
}

.request-card__progress-line {
  position: absolute;
  top: 13px;
  left: calc(50% + 18px);
  width: calc(100% - 12px);
  height: 2px;
  border-radius: 999px;
  background: rgba(188, 201, 216, 0.42);
}

.request-card__progress-step--complete .request-card__progress-node {
  border-color: var(--request-progress-border);
  background: linear-gradient(135deg, var(--request-progress-fill-start) 0%, var(--request-progress-fill-end) 100%);
  color: var(--request-progress-text);
}

.request-card__progress-step--current .request-card__progress-node {
  border-color: var(--request-progress-border);
  background: linear-gradient(135deg, var(--request-progress-current-start) 0%, var(--request-progress-current-end) 100%);
  color: var(--request-progress-text);
}

.request-card__progress-step--failed .request-card__progress-node {
  border-color: rgba(242, 128, 150, 0.44);
  background: linear-gradient(135deg, rgba(255, 216, 224, 0.96) 0%, rgba(255, 138, 166, 0.98) 100%);
  color: #8d2f4e;
}

.request-card__progress-step--complete strong,
.request-card__progress-step--current strong,
.request-card__progress-step--failed strong {
  color: #334e69;
}

.request-card__progress-step--complete span {
  color: var(--request-progress-caption);
}

.request-card__progress-step--current span {
  color: var(--request-progress-caption);
}

.request-card__progress-step--failed span {
  color: #b04f6d;
}

.request-card__progress-line--active {
  background: var(--request-progress-line);
}

.request-card__confirm {
  min-width: 96px;
  height: 42px;
  padding: 0 16px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #61df82 0%, #2fb35f 100%);
  color: white;
  font-size: 14px;
  font-weight: 900;
  box-shadow: 0 8px 0 rgba(47, 179, 95, 0.24);
  cursor: pointer;
  white-space: nowrap;

  &:disabled {
    opacity: 0.58;
    cursor: not-allowed;
    box-shadow: none;
  }
}

.request-card--stack .request-card__confirm {
  min-width: 88px;
  height: 38px;
  padding: 0 14px;
  border-radius: 14px;
  font-size: 13px;
}

.vault-preview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.vault-preview__hero {
  padding: 18px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(112, 198, 255, 0.18) 0%, rgba(171, 231, 255, 0.28) 100%);

  strong {
    display: block;
    font-size: 36px;
    line-height: 1;
    color: #1f4f81;
  }

  span {
    display: block;
    margin-top: 8px;
    font-size: 14px;
    font-weight: 800;
    color: #52789f;
  }
}

.vault-preview__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;

  li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 18px;
    background: rgba(247, 251, 255, 0.92);
    color: #2f506e;
    font-size: 14px;
    font-weight: 800;
  }

  svg {
    font-size: 20px;
    color: #4f8cff;
  }
}

.vault-preview__hint {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: #6a7f95;
}

.vault-preview__button,
.wish-form__submit,
.reward-option__button {
  border: none;
  border-radius: 18px;
  font-weight: 900;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
  }
}

.vault-preview__button {
  padding: 15px 16px;
  background: linear-gradient(135deg, #7cc7ff 0%, #5c92ff 100%);
  color: white;
  box-shadow: 0 8px 0 rgba(78, 123, 212, 0.24);
}

.wish-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.wish-form__field {
  display: flex;
  flex-direction: column;
  gap: 10px;

  span {
    font-size: 13px;
    font-weight: 900;
    color: #7c5063;
  }

  input {
    width: 100%;
    border: 2px solid rgba(241, 184, 206, 0.5);
    background: rgba(255, 251, 253, 0.92);
    padding: 14px 16px;
    border-radius: 18px;
    font-size: 16px;
    font-weight: 800;
    color: #3a2f3b;
    outline: none;

    &::placeholder {
      color: #c2a8b7;
    }

    &:focus {
      border-color: rgba(255, 123, 152, 0.7);
      box-shadow: 0 0 0 4px rgba(255, 190, 209, 0.18);
    }
  }
}

.wish-form__presets {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.wish-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 18px;
  border: 2px solid transparent;
  background: white;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  text-align: left;

  svg {
    font-size: 22px;
    flex-shrink: 0;
  }

  div {
    display: flex;
    flex-direction: column;
  }

  strong {
    font-size: 14px;
    color: #2d4157;
  }

  span {
    font-size: 12px;
    color: #7791ac;
    font-weight: 700;
  }

  &:hover {
    transform: translateY(-2px);
  }
}

.wish-chip--sky { background: #f3fbff; color: #2f77a6; }
.wish-chip--rose { background: #fff5f7; color: #cc476d; }
.wish-chip--amber { background: #fff9ef; color: #b56f00; }
.wish-chip--mint { background: #f4fff6; color: #2d8c4f; }

.wish-chip--active {
  border-color: currentColor;
  box-shadow: 0 8px 16px rgba(95, 117, 145, 0.1);
}

.wish-form__current {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 215, 235, 0.35);
  color: #9d4b6d;
  font-size: 13px;
  font-weight: 900;
}

.wish-form__submit {
  padding: 16px;
  background: linear-gradient(135deg, #ff9eb1 0%, #ffcf8f 100%);
  color: #7d2b4f;
  font-size: 17px;
  box-shadow: 0 8px 0 rgba(221, 120, 142, 0.28);

  &:disabled {
    opacity: 0.58;
    cursor: not-allowed;
    box-shadow: 0 4px 0 rgba(221, 120, 142, 0.18);
  }
}

.redeem-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(31, 48, 67, 0.34);
  backdrop-filter: blur(8px);
}

.redeem-modal {
  position: relative;
  width: min(980px, 100%);
  max-height: min(88vh, 920px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 28px;
  border-radius: 30px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.97) 0%, rgba(247, 251, 255, 0.95) 100%);
  box-shadow: 0 28px 56px rgba(44, 72, 110, 0.2);
}

.redeem-modal__close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.82);
  color: #5c728c;
  cursor: pointer;
}

.redeem-modal__header {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 22px;
  padding-right: 52px;

  h3 {
    margin: 0;
    font-size: 30px;
    line-height: 1.08;
    color: #25384d;
  }

  p {
    margin: 0;
    max-width: 680px;
    font-size: 14px;
    line-height: 1.7;
    color: #68809b;
  }
}

.redeem-modal__eyebrow {
  display: inline-flex;
  width: fit-content;
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(255, 220, 183, 0.42);
  color: #8f5500;
  font-size: 12px;
  font-weight: 900;
}

.redeem-modal__alert {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 900;
}

.redeem-modal__alert--success { background: rgba(86, 204, 118, 0.14); color: #258145; }
.redeem-modal__alert--error { background: rgba(255, 137, 164, 0.14); color: #b5355d; }

.redeem-modal__list {
  display: grid;
  flex: 1;
  gap: 14px;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 12px;
  margin-right: -12px;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: rgba(120, 151, 184, 0.62) rgba(214, 228, 242, 0.26);
}

.redeem-modal__list::-webkit-scrollbar,
.request-collection-modal__list::-webkit-scrollbar {
  width: 10px;
}

.redeem-modal__list::-webkit-scrollbar-track,
.request-collection-modal__list::-webkit-scrollbar-track {
  border-radius: 999px;
  background: rgba(214, 228, 242, 0.26);
}

.redeem-modal__list::-webkit-scrollbar-thumb,
.request-collection-modal__list::-webkit-scrollbar-thumb {
  border: 2px solid transparent;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(146, 177, 209, 0.82) 0%, rgba(108, 143, 180, 0.9) 100%);
  background-clip: padding-box;
}

.redeem-modal__list::-webkit-scrollbar-thumb:hover,
.request-collection-modal__list::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(128, 163, 201, 0.94) 0%, rgba(91, 128, 170, 0.98) 100%);
  background-clip: padding-box;
}

.request-collection-modal {
  width: min(1040px, 100%);
}

.request-collection-modal__list {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 12px;
  margin-right: -12px;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: rgba(120, 151, 184, 0.62) rgba(214, 228, 242, 0.26);
}

.reward-option {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  padding: 16px;
  border-radius: 24px;
  border: 2px solid rgba(198, 211, 225, 0.18);
  background: rgba(255, 255, 255, 0.92);
}

.reward-option--ready {
  border-color: rgba(86, 204, 118, 0.24);
  box-shadow: 0 10px 18px rgba(57, 181, 109, 0.1);
}

.reward-option--focus {
  grid-template-columns: auto minmax(0, 1fr);
}

.reward-option__media {
  width: 78px;
  height: 78px;
  border-radius: 24px;
  display: grid;
  place-items: center;
  font-size: 38px;
  color: white;
  overflow: hidden;
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.12);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.reward-option__media--rose { background: linear-gradient(135deg, #ffb4b8 0%, #ff7d8a 100%); }
.reward-option__media--sky { background: linear-gradient(135deg, #8fe0ff 0%, #5e9cff 100%); }
.reward-option__media--mint { background: linear-gradient(135deg, #b2f1b2 0%, #47bc72 100%); }
.reward-option__media--amber { background: linear-gradient(135deg, #ffe07d 0%, #f59e0b 100%); }

.reward-option__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;

  h4 {
    margin: 8px 0 0;
    font-size: 20px;
    line-height: 1.1;
    color: #24384c;
  }
}

.reward-option__type {
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(122, 148, 176, 0.14);
  color: #627792;
  font-size: 12px;
  font-weight: 900;
}

.reward-option__cost {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  color: #ff9d00;
  font-size: 14px;
  font-weight: 900;
}

.reward-option__body p {
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 1.7;
  color: #667c95;
}

.reward-option__button {
  min-width: 132px;
  padding: 14px 18px;
  background: linear-gradient(135deg, #61df82 0%, #2fb35f 100%);
  color: white;
  font-size: 15px;
  box-shadow: 0 8px 0 rgba(47, 179, 95, 0.24);

  &:disabled {
    background: linear-gradient(135deg, #d9e2ed 0%, #c3d0df 100%);
    color: #607892;
    box-shadow: none;
    cursor: not-allowed;
    transform: none;
  }
}

.reward-option__button--loading {
  pointer-events: none;
}

.reward-option__action {
  display: flex;
  justify-content: flex-end;
}

.loading-spin {
  animation: spin 0.8s linear infinite;
}

.reward-command__empty {
  @include theme.empty-state(220px);
}

.reward-command__empty--soft {
  min-height: 160px;
}

.reward-command__empty--group {
  flex: 1;
}

.reward-command__empty--modal {
  min-height: 180px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@include theme.respond-max(tablet) {
  .reward-command__focus,
  .reward-command__layout {
    grid-template-columns: 1fr;
  }

  .status-board__groups {
    grid-template-columns: 1fr;
  }

  .request-collection-modal__list {
    grid-template-columns: 1fr;
  }

  .reward-option {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .reward-option__action {
    grid-column: 1 / -1;
  }
}

@include theme.respond-max(phone) {
  .reward-command__latest {
    width: 100%;
  }

  .request-group {
    min-height: auto;
  }

  .request-group__header,
  .side-panel__title {
    max-width: calc(100% - 104px);
  }

  .request-group__view-all {
    top: 18px;
    right: 18px;
    padding: 6px 11px;
    min-height: 30px;
    font-size: 11px;
  }

  .stack-preview__footer {
    flex-wrap: wrap;
  }

  .stack-preview__stage {
    min-height: 304px;
  }

  .status-board__title,
  .reward-option__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .request-card__snapshot {
    grid-template-columns: 1fr;
  }

  .wish-form__presets {
    grid-template-columns: 1fr;
  }

  .redeem-modal {
    padding: 22px 18px;
    border-radius: 24px;
  }
}

@include theme.respond-max(narrow) {
  .reward-command__hero h2 {
    font-size: clamp(24px, 8vw, 30px);
  }

  .reward-command__hero p,
  .request-card__reason,
  .reward-option__body p {
    font-size: 13px;
    line-height: 1.65;
  }

  .reward-command__latest {
    padding: 14px 16px;
  }

  .focus-card strong {
    font-size: 28px;
  }

  .status-board,
  .side-panel {
    padding: 18px 16px;
  }

  .request-group {
    padding: 18px 16px;
    border-radius: 24px;
  }

  .request-group__header,
  .side-panel__title {
    max-width: calc(100% - 92px);
  }

  .request-group__view-all {
    top: 18px;
    right: 16px;
    padding: 6px 10px;
    min-height: 28px;
    font-size: 11px;
  }

  .stack-preview__stage {
    min-height: 304px;
  }

  .request-card,
  .reward-option {
    padding: 14px;
    border-radius: 20px;
  }

  .request-card__icon,
  .reward-option__media {
    width: 64px;
    height: 64px;
    border-radius: 20px;
  }
}
</style>
