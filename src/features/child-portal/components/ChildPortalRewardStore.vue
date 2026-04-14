<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { formatPoints } from '@/features/child-portal/format'
import {
  getRewardAccent,
  getRewardGap,
  getRewardRequestIcon,
  getRewardRequestStatusLabel,
  getRewardRequestSummary,
  getRewardTypeLabel,
  getRewardVisualIcon,
  sortRewardsForDisplay
} from '@/features/child-portal/helpers'
import type {
  ChildRewardItem,
  ChildRewardRequestItem,
  ChildRewardsResponse
} from '@/features/child-portal/types'

type ModalStatus = '' | 'success' | 'error'

interface RewardRequestCard extends ChildRewardRequestItem {
  image_url?: string
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
const activeRedeemId = ref<string | null>(null)
const modalStatus = ref<{ message: string; type: ModalStatus }>({ message: '', type: '' })

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

const pendingCount = computed(() => requestCards.value.filter((item) => item.status === 'pending').length)
const usableRequests = computed(() => requestCards.value.filter((item) => item.status === 'approved'))
const rejectedRequests = computed(() => requestCards.value.filter((item) => item.status === 'rejected'))
const usedRequests = computed(() => requestCards.value.filter((item) => item.status === 'fulfilled'))
const redeemableRewards = computed(() => rewardCards.value.filter((item) => getRewardGap(item, props.currentPoints) === 0))

function getRedeemHint(item: ChildRewardItem) {
  const gap = getRewardGap(item, props.currentPoints)
  if (gap === 0) {
    return '积分已经够啦，现在就能发起兑换。'
  }

  return `还差 ${gap} 分，先继续完成任务吧。`
}

function openRedeemModal() {
  modalStatus.value = { message: '', type: '' }
  showRedeemModal.value = true
}

function closeRedeemModal() {
  showRedeemModal.value = false
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
</script>

<template>
  <section class="reward-command">
    <header class="reward-command__sign">
      <div class="reward-command__hero">
        <span class="reward-command__eyebrow">奖励空间</span>
        <h2>奖励现在分成三类，一眼就能看懂</h2>
        <p>待使用、未通过、已使用会分开摆放。待确认的奖励不会混进去，只在上方轻提醒。</p>
      </div>

      <div class="reward-command__meta">
        <div class="reward-command__points">
          <Icon icon="ph:shooting-star-fill" />
          <div>
            <span>当前积分</span>
            <strong>{{ formatPoints(currentPoints) }}</strong>
          </div>
        </div>

        <button type="button" class="reward-command__redeem-entry" @click="openRedeemModal">
          <span class="reward-command__redeem-copy">
            <strong>兑换奖励</strong>
            <small>现在能兑换 {{ redeemableRewards.length }} 个奖励</small>
          </span>
          <Icon icon="ph:treasure-chest-fill" />
        </button>

        <div v-if="pendingCount" class="reward-command__pending-tip">
          <Icon icon="ph:paper-plane-tilt-fill" />
          <span>{{ pendingCount }} 个奖励正在等待家长确认</span>
        </div>
      </div>
    </header>

    <section class="reward-command__focus">
      <article class="focus-card focus-card--mint">
        <div class="focus-card__top">
          <Icon icon="ph:seal-check-fill" />
          <span>待使用</span>
        </div>
        <strong>{{ usableRequests.length }}</strong>
        <p>{{ usableRequests[0]?.title ? `最近可用: ${usableRequests[0].title}` : '还没有进入待使用的奖励。' }}</p>
      </article>

      <article class="focus-card focus-card--rose">
        <div class="focus-card__top">
          <Icon icon="ph:seal-warning-fill" />
          <span>未通过</span>
        </div>
        <strong>{{ rejectedRequests.length }}</strong>
        <p>{{ rejectedRequests[0]?.review_remark || '未通过的奖励会在这里告诉你原因。' }}</p>
      </article>

      <article class="focus-card focus-card--amber">
        <div class="focus-card__top">
          <Icon icon="ph:check-circle-fill" />
          <span>已使用</span>
        </div>
        <strong>{{ usedRequests.length }}</strong>
        <p>{{ usedRequests[0]?.title ? `最近使用: ${usedRequests[0].title}` : '已经用过的奖励会收进这里。' }}</p>
      </article>
    </section>

    <div class="reward-command__layout">
      <div class="reward-command__main">
        <section class="status-board">
          <div class="status-board__title">
            <div>
              <span>奖励记录</span>
              <h3>状态只保留你最关心的三种</h3>
            </div>
            <button type="button" class="status-board__redeem-button" @click="openRedeemModal">
              兑换奖励
              <Icon icon="ph:arrow-right-bold" />
            </button>
          </div>

          <div v-if="requestCards.length" class="status-board__groups">
            <section class="request-group">
              <div class="request-group__header request-group__header--mint">
                <Icon icon="ph:seal-check-fill" />
                <div>
                  <h4>待使用</h4>
                  <p>这些奖励已经通过，可以在用完后点一下“我已使用”。</p>
                </div>
                <span>{{ usableRequests.length }}</span>
              </div>

              <div v-if="usableRequests.length" class="request-grid">
                <article
                  v-for="item in usableRequests"
                  :key="item.request_id"
                  class="request-card request-card--mint"
                >
                  <div class="request-card__icon request-card__icon--mint">
                    <img v-if="item.image_url" :src="item.image_url" :alt="item.title" />
                    <Icon v-else :icon="getRewardRequestIcon(item.status)" />
                  </div>

                  <div class="request-card__body">
                    <div class="request-card__header">
                      <div class="request-card__title">
                        <span v-if="item.reward_type" class="request-card__type">{{ getRewardTypeLabel(item.reward_type) }}</span>
                        <h5>{{ item.title }}</h5>
                      </div>
                      <span class="request-card__status request-card__status--mint">待使用</span>
                    </div>

                    <p class="request-card__reason">{{ item.review_remark || '已经准备好了，使用完再把它放进“已使用”。' }}</p>

                    <div class="request-card__footer">
                      <span class="request-card__summary">{{ getRewardRequestSummary(item) }}</span>
                      <button
                        type="button"
                        class="request-card__action"
                        :disabled="actionBusy"
                        @click="emit('markUsed', item.request_id)"
                      >
                        我已使用
                      </button>
                    </div>
                  </div>
                </article>
              </div>

              <div v-else class="reward-command__empty reward-command__empty--soft">
                <Icon icon="ph:gift-light" />
                <p>现在还没有进入待使用的奖励。</p>
              </div>
            </section>

            <section class="request-group">
              <div class="request-group__header request-group__header--rose">
                <Icon icon="ph:seal-warning-fill" />
                <div>
                  <h4>未通过</h4>
                  <p>这次为什么没通过，会直接写在卡片上。</p>
                </div>
                <span>{{ rejectedRequests.length }}</span>
              </div>

              <div v-if="rejectedRequests.length" class="request-grid">
                <article
                  v-for="item in rejectedRequests"
                  :key="item.request_id"
                  class="request-card request-card--rose"
                >
                  <div class="request-card__icon request-card__icon--rose">
                    <Icon :icon="getRewardRequestIcon(item.status)" />
                  </div>

                  <div class="request-card__body">
                    <div class="request-card__header">
                      <div class="request-card__title">
                        <span v-if="item.reward_type" class="request-card__type">{{ getRewardTypeLabel(item.reward_type) }}</span>
                        <h5>{{ item.title }}</h5>
                      </div>
                      <span class="request-card__status request-card__status--rose">{{ getRewardRequestStatusLabel(item.status) }}</span>
                    </div>

                    <p class="request-card__reason">{{ item.review_remark || '这次没有通过，换个方向再试试。' }}</p>
                  </div>
                </article>
              </div>

              <div v-else class="reward-command__empty reward-command__empty--soft">
                <Icon icon="ph:confetti-light" />
                <p>现在没有未通过的奖励。</p>
              </div>
            </section>

            <section class="request-group">
              <div class="request-group__header request-group__header--amber">
                <Icon icon="ph:check-circle-fill" />
                <div>
                  <h4>已使用</h4>
                  <p>已经收下的奖励会安静地放在这里。</p>
                </div>
                <span>{{ usedRequests.length }}</span>
              </div>

              <div v-if="usedRequests.length" class="request-grid">
                <article
                  v-for="item in usedRequests"
                  :key="item.request_id"
                  class="request-card request-card--amber"
                >
                  <div class="request-card__icon request-card__icon--amber">
                    <Icon :icon="getRewardRequestIcon(item.status)" />
                  </div>

                  <div class="request-card__body">
                    <div class="request-card__header">
                      <div class="request-card__title">
                        <span v-if="item.reward_type" class="request-card__type">{{ getRewardTypeLabel(item.reward_type) }}</span>
                        <h5>{{ item.title }}</h5>
                      </div>
                      <span class="request-card__status request-card__status--amber">{{ getRewardRequestStatusLabel(item.status) }}</span>
                    </div>

                    <p class="request-card__reason">{{ item.review_remark || '这份奖励已经顺利使用过啦。' }}</p>
                  </div>
                </article>
              </div>

              <div v-else class="reward-command__empty reward-command__empty--soft">
                <Icon icon="ph:check-fat-light" />
                <p>还没有放进已使用里的奖励。</p>
              </div>
            </section>
          </div>

          <div v-else class="reward-command__empty">
            <Icon icon="ph:gift-light" />
            <p>你还没有奖励记录，先提交一个愿望或者去兑换现成奖励吧。</p>
          </div>
        </section>
      </div>

      <aside class="reward-command__sidebar">
        <article class="side-panel side-panel--vault">
          <div class="side-panel__title side-panel__title--sky">
            <Icon icon="ph:treasure-chest-fill" />
            <div>
              <h3>兑换奖励入口</h3>
              <p>现成奖励在这里，提交愿望在下面。</p>
            </div>
          </div>

          <div class="vault-preview">
            <div class="vault-preview__hero">
              <strong>{{ redeemableRewards.length }}</strong>
              <span>个奖励现在就能兑换</span>
            </div>

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
              <p>想申请一个新的奖励，也可以继续发给家长。</p>
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
            <p>这里展示的是现成奖励。兑换后会进入家长审核，不会混进“提交新愿望”的记录里。</p>

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
                  :disabled="actionBusy || getRewardGap(item, currentPoints) > 0"
                  @click="handleRedeem(item.reward_id)"
                >
                  <Icon v-if="activeRedeemId === item.reward_id" icon="ph:spinner-gap-bold" class="loading-spin" />
                  <span v-else>{{ getRewardGap(item, currentPoints) === 0 ? '立即兑换' : '积分不足' }}</span>
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
.reward-command__meta {
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
  max-width: 660px;

  h2 {
    margin: 0;
    font-size: clamp(28px, 4vw, 38px);
    line-height: 1.06;
    font-weight: 900;
  }

  p {
    margin: 0;
    max-width: 560px;
    font-size: 15px;
    line-height: 1.75;
    color: rgba(123, 45, 77, 0.82);
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

.reward-command__meta {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: min(280px, 100%);
}

.reward-command__points {
  @include theme.surface-card(18px 20px, 24px);
  display: flex;
  align-items: center;
  gap: 14px;

  svg {
    font-size: 34px;
    color: #ff9d00;
  }

  span {
    display: block;
    font-size: 13px;
    font-weight: 800;
    color: #8b5670;
  }

  strong {
    display: block;
    margin-top: 4px;
    font-size: 32px;
    line-height: 1;
    color: #8a2d51;
  }
}

.reward-command__redeem-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border: none;
  border-radius: 22px;
  background: linear-gradient(135deg, #7cc7ff 0%, #55a7ff 45%, #9be5e1 100%);
  color: white;
  box-shadow: 0 12px 24px rgba(77, 132, 203, 0.22);
  cursor: pointer;
  text-align: left;
  transition: transform 0.18s ease, box-shadow 0.18s ease;

  svg {
    font-size: 34px;
    flex-shrink: 0;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 28px rgba(77, 132, 203, 0.24);
  }
}

.reward-command__redeem-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;

  strong {
    font-size: 17px;
    line-height: 1.2;
    font-weight: 900;
  }

  small {
    font-size: 13px;
    opacity: 0.9;
  }
}

.reward-command__pending-tip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(124, 199, 255, 0.16);
  color: #2b6a9b;
  font-size: 13px;
  font-weight: 800;

  svg {
    font-size: 18px;
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
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.request-group__header,
.side-panel__title {
  @include theme.title-pill(linear-gradient(135deg, #ffd89d 0%, #ffb86d 100%), #7a4300);
  margin-bottom: 18px;

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

  span:last-child {
    min-width: 30px;
    height: 30px;
    padding: 0 9px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    background: rgba(255, 255, 255, 0.34);
    font-size: 14px;
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

.request-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.request-grid--usable {
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.request-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 16px;
  padding: 18px;
  border-radius: 26px;
  border: 2px solid rgba(196, 210, 226, 0.18);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 251, 255, 0.94) 100%);
  box-shadow: 0 12px 18px rgba(96, 118, 143, 0.08);
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
}

.request-card__icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.request-card__icon--mint { background: linear-gradient(135deg, #a8edaf 0%, #4dbf75 100%); }
.request-card__icon--amber,
.request-card__icon--sky { background: linear-gradient(135deg, #9fe1ff 0%, #649cff 100%); }
.request-card__icon--rose { background: linear-gradient(135deg, #ffb8b0 0%, #f2856a 100%); }

.request-card__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.request-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.request-card__title {
  min-width: 0;

  h5 {
    margin: 8px 0 0;
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

.request-card__status {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  padding: 7px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
}

.request-card__status--mint { background: rgba(86, 204, 118, 0.14); color: #258145; }
.request-card__status--amber,
.request-card__status--sky { background: rgba(105, 184, 255, 0.14); color: #2e5a8d; }
.request-card__status--rose { background: rgba(255, 137, 164, 0.14); color: #b5355d; }

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

.request-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
}

.request-card__summary {
  display: inline-flex;
  width: fit-content;
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(255, 226, 194, 0.34);
  color: #8d5c1d;
  font-size: 12px;
  font-weight: 900;
}

.request-card__action {
  padding: 11px 16px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #61df82 0%, #2fb35f 100%);
  color: white;
  font-size: 14px;
  font-weight: 900;
  box-shadow: 0 8px 0 rgba(47, 179, 95, 0.24);
  cursor: pointer;
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
  overflow: auto;
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
  flex-direction: column;
  gap: 10px;
  margin-bottom: 22px;

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
  gap: 14px;
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
  .reward-command__sign {
    flex-direction: column;
    align-items: stretch;
  }

  .reward-command__focus,
  .reward-command__layout {
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
  .status-board__title,
  .request-card__header,
  .request-card__footer,
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

  .focus-card strong {
    font-size: 28px;
  }

  .status-board,
  .side-panel {
    padding: 18px 16px;
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
