<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import {
  getRewardAccent,
  getRewardGap,
  getRewardRequestIcon,
  getRewardRequestStatusLabel,
  getRewardRequestSummary,
  getRewardRequestTone,
  getRewardTypeLabel,
  getRewardVisualIcon,
  sortRewardsForDisplay
} from '@/features/child-portal/helpers'
import { formatPoints } from '@/features/child-portal/format'
import type { ChildRewardItem, ChildRewardsResponse } from '@/features/child-portal/types'

const props = defineProps<{
  actionBusy: boolean
  currentPoints: number
  description: string
  rewardsData: ChildRewardsResponse | null
  title: string
}>()

const emit = defineEmits<{
  submit: []
  'update:description': [value: string]
  'update:title': [value: string]
}>()

const rewardCards = computed(() => sortRewardsForDisplay(props.rewardsData?.rewards || [], props.currentPoints))
const nearThreshold = computed(() => Math.max(20, Math.min(60, Math.round(props.currentPoints * 0.45) || 20)))

const rewardGroups = computed(() => {
  const ready = rewardCards.value.filter((item) => getRewardGap(item, props.currentPoints) === 0)
  const near = rewardCards.value.filter((item) => {
    const gap = getRewardGap(item, props.currentPoints)
    return gap > 0 && gap <= nearThreshold.value
  })
  const longRange = rewardCards.value.filter((item) => getRewardGap(item, props.currentPoints) > nearThreshold.value)

  return [
    {
      key: 'ready',
      title: '现在就能开箱',
      subtitle: '这些宝箱今天已经能带回家了。',
      icon: 'ph:treasure-chest-fill',
      tone: 'mint',
      items: ready
    },
    {
      key: 'near',
      title: '再攒一点就能拿下',
      subtitle: `距离开启只差 ${nearThreshold.value} 星星以内的目标。`,
      icon: 'ph:shooting-star-fill',
      tone: 'amber',
      items: near
    },
    {
      key: 'long-range',
      title: '远方大宝箱',
      subtitle: '这是值得慢慢积累的长期目标。',
      icon: 'ph:mountains-fill',
      tone: 'sky',
      items: longRange
    }
  ]
})

const wishPresets = [
  { key: 'outing', label: '探险出游', value: '出去玩', icon: 'ph:park-fill', tone: 'sky' },
  { key: 'toy', label: '神秘玩具', value: '小玩具', icon: 'ph:teddy-bear-fill', tone: 'rose' },
  { key: 'snack', label: '补给零食', value: '好吃的', icon: 'ph:ice-cream-fill', tone: 'amber' },
  { key: 'together', label: '陪伴时光', value: '陪伴', icon: 'ph:hand-heart-fill', tone: 'mint' }
] as const

const requestStats = computed(() => {
  const history = props.rewardsData?.request_history || []
  return {
    pending: history.filter((item) => item.status === 'pending').length,
    approved: history.filter((item) => item.status === 'approved').length,
    rejected: history.filter((item) => item.status === 'rejected').length
  }
})

function updateTitle(event: Event) {
  emit('update:title', (event.target as HTMLInputElement).value)
}

function togglePreset(value: string) {
  emit('update:description', props.description === value ? '' : value)
}

function isPresetActive(value: string) {
  return props.description === value
}

function getRewardProgress(item: ChildRewardItem) {
  const cost = Math.max(Number(item.cost_points) || 0, 1)
  return Math.max(8, Math.min(100, Math.round((props.currentPoints / cost) * 100)))
}

function getRewardTagline(item: ChildRewardItem) {
  const gap = getRewardGap(item, props.currentPoints)
  if (gap === 0) {
    return '宝箱已经解锁，去首页终点宝库就能打开。'
  }
  if (gap <= nearThreshold.value) {
    return `再收集 ${gap} 星星，就能把它装进背包。`
  }
  return `这是需要耐心积累的远方大奖励，还差 ${gap} 星星。`
}
</script>

<template>
  <section class="treasure-station">
    <header class="treasure-station__sign">
      <div class="treasure-station__hero">
        <span class="treasure-station__eyebrow">冒险世界 · 藏宝驿站</span>
        <h2>把星星花在最想要的宝箱上</h2>
        <p>先盯住最近能开启的目标，再把远方大宝箱慢慢收进旅途清单里。</p>
      </div>

      <div class="treasure-station__meta">
        <div class="treasure-station__points">
          <Icon icon="ph:shooting-star-fill" />
          <div>
            <span>当前星星</span>
            <strong>{{ formatPoints(currentPoints) }}</strong>
          </div>
        </div>

        <div class="treasure-station__wish-stats">
          <span><Icon icon="ph:paper-plane-tilt-fill" /> 等回应 {{ requestStats.pending }}</span>
          <span><Icon icon="ph:seal-check-fill" /> 已实现 {{ requestStats.approved }}</span>
        </div>
      </div>
    </header>

    <div class="treasure-station__layout">
      <div class="treasure-station__routes">
        <section
          v-for="group in rewardGroups"
          :key="group.key"
          v-show="group.items.length"
          class="station-panel"
        >
          <div class="station-panel__title" :class="`station-panel__title--${group.tone}`">
            <Icon :icon="group.icon" />
            <div>
              <h3>{{ group.title }}</h3>
              <p>{{ group.subtitle }}</p>
            </div>
            <span>{{ group.items.length }}</span>
          </div>

          <div class="treasure-grid">
            <article
              v-for="item in group.items"
              :key="item.reward_id"
              class="treasure-card"
              :class="[`treasure-card--${getRewardAccent(item.reward_type)}`, { 'treasure-card--ready': getRewardGap(item, currentPoints) === 0 }]"
            >
              <div class="treasure-card__crest" :class="`treasure-card__crest--${getRewardAccent(item.reward_type)}`">
                <img v-if="item.image_url" :src="item.image_url" :alt="item.title" />
                <Icon v-else :icon="getRewardVisualIcon(item.reward_type)" />
              </div>

              <div class="treasure-card__body">
                <span class="treasure-card__type">{{ getRewardTypeLabel(item.reward_type) }}</span>
                <h4>{{ item.title }}</h4>
                <p>{{ getRewardTagline(item) }}</p>
              </div>

              <div class="treasure-card__footer">
                <div class="treasure-card__cost">
                  <Icon icon="ph:shooting-star-fill" />
                  <strong>{{ formatPoints(item.cost_points) }}</strong>
                </div>
                <div class="treasure-card__status">
                  <span v-if="getRewardGap(item, currentPoints) === 0" class="status-pill status-pill--mint">今天就能开启</span>
                  <span v-else-if="getRewardGap(item, currentPoints) <= nearThreshold" class="status-pill status-pill--amber">差 {{ getRewardGap(item, currentPoints) }} 星</span>
                  <span v-else class="status-pill status-pill--sky">长期目标</span>
                </div>
                <div class="treasure-card__progress">
                  <span :style="{ width: `${getRewardProgress(item)}%` }" />
                </div>
              </div>
            </article>
          </div>
        </section>

        <div v-if="!rewardCards.length" class="treasure-station__empty">
          <Icon icon="ph:treasure-chest-light" />
          <p>藏宝驿站今天还没有摆出新的宝箱。</p>
        </div>
      </div>

      <aside class="treasure-station__sidebar">
        <article class="station-panel station-panel--wish">
          <div class="station-panel__title station-panel__title--rose">
            <Icon icon="ph:paper-plane-tilt-fill" />
            <div>
              <h3>许愿驿站</h3>
              <p>把最想要的愿望交给旅途信使。</p>
            </div>
          </div>

          <form class="wish-form" @submit.prevent="emit('submit')">
            <label class="wish-form__field">
              <span>想许什么愿？</span>
              <input
                :value="title"
                maxlength="30"
                placeholder="比如：一次特别的冒险奖励"
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

            <div class="wish-form__current" v-if="description">
              <Icon icon="ph:sparkle-fill" />
              <span>这次愿望方向：{{ description }}</span>
            </div>

            <button type="submit" class="wish-form__submit" :disabled="actionBusy || !title">
              把愿望送出去
            </button>
          </form>
        </article>

        <article class="station-panel station-panel--history">
          <div class="station-panel__title station-panel__title--sky">
            <Icon icon="ph:scroll-fill" />
            <div>
              <h3>家长回音墙</h3>
              <p>看看愿望已经走到哪一步了。</p>
            </div>
          </div>

          <div class="history-stats">
            <span class="history-stats__pill history-stats__pill--sky">等待 {{ requestStats.pending }}</span>
            <span class="history-stats__pill history-stats__pill--mint">通过 {{ requestStats.approved }}</span>
            <span class="history-stats__pill history-stats__pill--rose">暂缓 {{ requestStats.rejected }}</span>
          </div>

          <ul v-if="rewardsData?.request_history?.length" class="echo-list">
            <li v-for="item in rewardsData.request_history" :key="item.request_id" class="echo-card">
              <div class="echo-card__icon" :class="`echo-card__icon--${getRewardRequestTone(item.status)}`">
                <Icon :icon="getRewardRequestIcon(item.status)" />
              </div>
              <div class="echo-card__content">
                <div class="echo-card__header">
                  <strong>{{ item.title }}</strong>
                  <span class="echo-card__tag" :class="`echo-card__tag--${getRewardRequestTone(item.status)}`">
                    {{ getRewardRequestStatusLabel(item.status) }}
                  </span>
                </div>
                <p>{{ getRewardRequestSummary(item) }}</p>
              </div>
            </li>
          </ul>

          <div v-else class="treasure-station__empty treasure-station__empty--small">
            <Icon icon="ph:shooting-star-light" />
            <p>回音墙上还没有新的消息。</p>
          </div>
        </article>
      </aside>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '../adventure-theme.scss' as theme;

.treasure-station {
  @include theme.page-shell;
}

.treasure-station__sign {
  @include theme.sign-shell(linear-gradient(135deg, #ffcf9a 0%, #ffa2ac 48%, #ffd5f0 100%), #7a2842, #da7f8c);
}

.treasure-station__hero,
.treasure-station__meta {
  position: relative;
  z-index: 1;
}

.treasure-station__hero {
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
    color: rgba(122, 40, 66, 0.8);
    max-width: 520px;
  }
}

.treasure-station__eyebrow {
  display: inline-flex;
  width: fit-content;
  padding: 7px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.58);
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.06em;
}

.treasure-station__meta {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 240px;
}

.treasure-station__points {
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

.treasure-station__wish-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;

  span {
    @include theme.stat-chip;
    color: #7c5063;
    font-size: 13px;
    font-weight: 900;
  }
}

.treasure-station__layout {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.65fr);
  gap: 24px;
}

.treasure-station__routes,
.treasure-station__sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.station-panel {
  @include theme.surface-card(24px, 30px);
}

.station-panel__title {
  @include theme.title-pill(linear-gradient(135deg, #ffd89d 0%, #ffb86d 100%), #7a4300);
  margin-bottom: 18px;
  width: auto;

  h3 {
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

.station-panel__title--mint { @include theme.title-pill(linear-gradient(135deg, #b8f4c1 0%, #6ed183 100%), #245a32); }
.station-panel__title--amber { @include theme.title-pill(linear-gradient(135deg, #ffe28f 0%, #ffb444 100%), #704100); }
.station-panel__title--sky { @include theme.title-pill(linear-gradient(135deg, #abe7ff 0%, #69b8ff 100%), #1f4f81); }
.station-panel__title--rose { @include theme.title-pill(linear-gradient(135deg, #ffd2dc 0%, #ff9bb0 100%), #8e2d4f); }

.treasure-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.treasure-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px;
  border-radius: 26px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 248, 249, 0.94) 100%);
  border: 2px solid rgba(255, 188, 198, 0.22);
  box-shadow: 0 12px 18px rgba(106, 78, 95, 0.08);
  transition: transform 0.18s ease;

  &:hover {
    transform: translateY(-3px);
  }
}

.treasure-card--ready {
  box-shadow: 0 12px 18px rgba(57, 181, 109, 0.14), 0 0 0 4px rgba(99, 197, 111, 0.08);
}

.treasure-card__crest {
  width: 88px;
  height: 88px;
  border-radius: 28px;
  display: grid;
  place-items: center;
  font-size: 42px;
  color: white;
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.12);
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.treasure-card__crest--rose { background: linear-gradient(135deg, #ffb4b8 0%, #ff7d8a 100%); }
.treasure-card__crest--sky { background: linear-gradient(135deg, #8fe0ff 0%, #5e9cff 100%); }
.treasure-card__crest--mint { background: linear-gradient(135deg, #b2f1b2 0%, #47bc72 100%); }
.treasure-card__crest--amber { background: linear-gradient(135deg, #ffe07d 0%, #f59e0b 100%); }

.treasure-card__body {
  display: flex;
  flex-direction: column;
  gap: 8px;

  h4 {
    margin: 0;
    font-size: 20px;
    line-height: 1.15;
    color: #263a4f;
    font-weight: 900;
  }

  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.65;
    color: #6a7f95;
  }
}

.treasure-card__type {
  display: inline-flex;
  width: fit-content;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(122, 148, 176, 0.14);
  color: #627792;
  font-size: 12px;
  font-weight: 900;
}

.treasure-card__footer {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.treasure-card__cost {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #ff9d00;
  font-size: 18px;

  strong {
    font-size: 22px;
    line-height: 1;
    font-weight: 900;
  }
}

.treasure-card__progress {
  height: 10px;
  border-radius: 999px;
  background: rgba(116, 138, 163, 0.12);
  overflow: hidden;

  span {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #ffa73c 0%, #62d27d 100%);
    transition: width 0.25s ease;
  }
}

.status-pill {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
}

.status-pill--mint { background: rgba(86, 204, 118, 0.14); color: #258145; }
.status-pill--amber { background: rgba(255, 184, 71, 0.14); color: #9a5b00; }
.status-pill--sky { background: rgba(105, 184, 255, 0.14); color: #2e5a8d; }

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
  border-radius: 18px;
  border: none;
  background: linear-gradient(135deg, #ff9eb1 0%, #ffcf8f 100%);
  color: #7d2b4f;
  font-size: 17px;
  font-weight: 900;
  box-shadow: 0 8px 0 rgba(221, 120, 142, 0.28);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  &:active:not(:disabled) {
    transform: translateY(4px);
    box-shadow: 0 4px 0 rgba(221, 120, 142, 0.28);
  }

  &:disabled {
    opacity: 0.58;
    cursor: not-allowed;
    box-shadow: 0 4px 0 rgba(221, 120, 142, 0.18);
  }
}

.history-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.history-stats__pill {
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
}

.history-stats__pill--sky { background: rgba(105, 184, 255, 0.14); color: #2e5a8d; }
.history-stats__pill--mint { background: rgba(86, 204, 118, 0.14); color: #258145; }
.history-stats__pill--rose { background: rgba(255, 137, 164, 0.14); color: #b5355d; }

.echo-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.echo-card {
  display: flex;
  gap: 12px;
  padding: 14px;
  border-radius: 22px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 251, 255, 0.92) 100%);
  border: 1px solid rgba(145, 168, 198, 0.18);

  &__icon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    color: white;
    font-size: 22px;
    flex-shrink: 0;
  }

  &__icon--sky { background: linear-gradient(135deg, #92dcff 0%, #68a8ff 100%); }
  &__icon--mint { background: linear-gradient(135deg, #a4ecae 0%, #63c56f 100%); }
  &__icon--rose { background: linear-gradient(135deg, #ffb8b0 0%, #f2856a 100%); }

  &__content {
    flex: 1;
    min-width: 0;

    p {
      margin: 6px 0 0;
      font-size: 13px;
      line-height: 1.65;
      color: #667c95;
    }
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;

    strong {
      font-size: 15px;
      color: #24384c;
    }
  }

  &__tag {
    padding: 5px 9px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 900;
    white-space: nowrap;
  }

  &__tag--sky { background: rgba(105, 184, 255, 0.14); color: #2e5a8d; }
  &__tag--mint { background: rgba(86, 204, 118, 0.14); color: #258145; }
  &__tag--rose { background: rgba(255, 137, 164, 0.14); color: #b5355d; }
}

.treasure-station__empty {
  @include theme.empty-state(220px);
}

.treasure-station__empty--small {
  min-height: 140px;
}

@media (max-width: 1024px) {
  .treasure-station__sign {
    flex-direction: column;
    align-items: stretch;
  }

  .treasure-station__layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .treasure-station {
    gap: 20px;
  }

  .treasure-station__sign {
    padding: 24px 20px;
  }

  .wish-form__presets,
  .treasure-grid {
    grid-template-columns: 1fr;
  }
}
</style>
