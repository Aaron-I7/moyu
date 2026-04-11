<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import {
  getLedgerIcon,
  getLedgerSummary,
  getLedgerTitle,
  getLedgerTone
} from '@/features/child-portal/helpers'
import type { ChildPointsLedgerEntry, ChildPointsResponse } from '@/features/child-portal/types'
import { formatPoints } from '@/features/child-portal/format'

const props = defineProps<{
  pointsData: ChildPointsResponse | null
}>()

const jarFill = computed(() => {
  const current = Number(props.pointsData?.current_points) || 0
  const total = Math.max(
    current,
    Number(props.pointsData?.total_points_earned) || 0,
    60
  )

  return `${Math.round((current / total) * 100)}%`
})

const viewportRef = ref<HTMLElement | null>(null)

const DEFAULT_LIMIT = 5
const BATCH_SIZE = 10

const displayLimit = ref(DEFAULT_LIMIT)
const loading = ref(false)

const sortedItems = computed(() => {
  const items = props.pointsData?.list || []
  return [...items].sort((a, b) => {
    const timeA = new Date(a.record_date || a.created_at || 0).getTime()
    const timeB = new Date(b.record_date || b.created_at || 0).getTime()
    return timeB - timeA
  })
})

const visibleItems = computed(() => sortedItems.value.slice(0, displayLimit.value))
const hasMore = computed(() => displayLimit.value < sortedItems.value.length)
const hiddenCount = computed(() => sortedItems.value.length - displayLimit.value)

const archiveStats = computed(() => [
  {
    key: 'earned',
    label: '旅途中获得',
    value: formatPoints(props.pointsData?.total_points_earned || 0),
    icon: 'ph:star-four-fill',
    tone: 'amber'
  },
  {
    key: 'spent',
    label: '已经兑换掉',
    value: formatPoints(props.pointsData?.total_points_spent || 0),
    icon: 'ph:shooting-star-fill',
    tone: 'rose'
  },
  {
    key: 'records',
    label: '留下的回响',
    value: `${sortedItems.value.length}`,
    icon: 'ph:scroll-fill',
    tone: 'sky'
  }
])

const latestEntry = computed(() => sortedItems.value[0] || null)
const timelineDateFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: 'numeric',
  day: 'numeric'
})
const timelineTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
})

const loadMore = async () => {
  loading.value = true
  await new Promise((resolve) => setTimeout(resolve, 450))
  loading.value = false
  displayLimit.value += BATCH_SIZE
}

const collapse = () => {
  displayLimit.value = DEFAULT_LIMIT
  if (viewportRef.value) {
    viewportRef.value.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function getEntryEyebrow(entry: ChildPointsLedgerEntry) {
  if (entry.biz_type === 'reward_redeem') {
    return '奖励记录'
  }
  if (entry.biz_type === 'manual_adjust') {
    return '调整记录'
  }
  return '积分记录'
}

function getEntryTaskCategory(entry: ChildPointsLedgerEntry) {
  const extendedEntry = entry as ChildPointsLedgerEntry & {
    task_category?: string
    category?: string
    task_type?: string
  }

  const rawCategory = [
    extendedEntry.task_category,
    extendedEntry.category,
    extendedEntry.task_type
  ].find((value) => typeof value === 'string' && value.trim())

  return rawCategory?.trim() || ''
}

function getEntryDetail(entry: ChildPointsLedgerEntry) {
  if (entry.biz_type === 'reward_redeem') {
    return '这是一条来自藏宝驿站的兑换记录。'
  }
  if (entry.biz_type === 'manual_adjust') {
    return '这是一条家长帮你整理星星背包的记录。'
  }

  return ''
}

function getEntryTimelineDate(entry: ChildPointsLedgerEntry) {
  const rawValue = entry.record_date || entry.created_at
  if (!rawValue) {
    return '待记录'
  }

  const date = new Date(rawValue)
  if (Number.isNaN(date.getTime())) {
    return '待记录'
  }

  return timelineDateFormatter.format(date)
}

function getEntryTimelineTime(entry: ChildPointsLedgerEntry) {
  if (entry.created_at) {
    const time = new Date(entry.created_at)
    if (!Number.isNaN(time.getTime())) {
      return timelineTimeFormatter.format(time)
    }
  }

  return entry.record_date ? '冒险日' : '待定'
}

function getEntryTotalText(entry: ChildPointsLedgerEntry) {
  if (entry.balance_after !== undefined) {
    return formatPoints(entry.balance_after)
  }

  return `${entry.change_type === 'decrease' ? '-' : '+'}${Number(entry.amount) || 0}`
}

function getEntryScoreLabel(entry: ChildPointsLedgerEntry) {
  return entry.balance_after !== undefined ? '当前总分' : '本次变化'
}
</script>

<template>
  <section class="star-archive">
    <header class="star-archive__sign">
      <div class="star-archive__hero">
        <span class="star-archive__eyebrow">冒险世界 · 星轨档案</span>
        <h2>每一颗星星，都在旅途里留下回响</h2>
        <p>这里会记录你一路得到的奖励、花掉的星星，还有每一次完成挑战之后留下的足迹。</p>
      </div>

      <div class="star-archive__latest" v-if="latestEntry">
        <span>最新回响</span>
        <strong>{{ getLedgerTitle(latestEntry) }}</strong>
        <p>{{ getLedgerSummary(latestEntry) }}</p>
      </div>
    </header>

    <div class="star-archive__layout">
      <aside class="star-archive__aside">
        <article class="jar-card">
          <div class="jar-card__glow" />
          <div class="jar-card__glass">
            <div class="jar-card__fill" :style="{ height: jarFill }" />
            <span class="jar-card__spark jar-card__spark--one" />
            <span class="jar-card__spark jar-card__spark--two" />
            <span class="jar-card__spark jar-card__spark--three" />
          </div>
          <div class="jar-card__value">
            <span>当前背包里的星星</span>
            <strong>{{ formatPoints(pointsData?.current_points || 0) }}</strong>
          </div>
        </article>

        <div class="archive-stats">
          <article v-for="item in archiveStats" :key="item.key" class="archive-stat" :class="`archive-stat--${item.tone}`">
            <div class="archive-stat__icon">
              <Icon :icon="item.icon" />
            </div>
            <div class="archive-stat__content">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </article>
        </div>
      </aside>

      <article class="journey-log">
        <div class="journey-log__title">
          <Icon icon="ph:scroll-fill" />
          <div>
            <h3>冒险日志</h3>
            <p>最新的回响排在最前面，左边看时间，中间看记录内容，右边看现在拥有的总分。</p>
          </div>
        </div>

        <div class="journey-log__viewport" ref="viewportRef">
          <div class="journey-log__container">
            <div class="journey-log__line" />

            <TransitionGroup name="journal-list" tag="ol" class="journey-log__list" appear>
              <li
                v-for="(item, index) in visibleItems"
                :key="item.ledger_id || `log-${index}`"
                class="journey-log__item"
                :style="{ '--stagger-idx': index % BATCH_SIZE }"
              >
                <div class="journey-log__stamp">
                  <span>{{ getEntryTimelineDate(item) }}</span>
                  <strong>{{ getEntryTimelineTime(item) }}</strong>
                </div>

                <div class="journey-log__node">
                  <div class="journey-log__node-inner" :class="`journey-log__node-inner--${getLedgerTone(item)}`" />
                </div>

                <article class="journey-card">
                  <div class="journey-card__top">
                    <div class="journey-card__icon" :class="`journey-card__icon--${getLedgerTone(item)}`">
                      <Icon :icon="getLedgerIcon(item)" />
                    </div>

                    <div class="journey-card__content">
                      <div class="journey-card__meta">
                        <span class="journey-card__eyebrow">{{ getEntryEyebrow(item) }}</span>
                        <span v-if="getEntryTaskCategory(item)" class="journey-card__chip">{{ getEntryTaskCategory(item) }}</span>
                      </div>
                      <strong>{{ getLedgerTitle(item) }}</strong>
                      <p v-if="getEntryDetail(item)">{{ getEntryDetail(item) }}</p>
                    </div>

                    <div class="journey-card__score" :class="`journey-card__score--${getLedgerTone(item)}`">
                      <span>{{ getEntryScoreLabel(item) }}</span>
                      <strong>{{ getEntryTotalText(item) }}</strong>
                    </div>
                  </div>
                </article>
              </li>

              <li v-if="loading" key="journal-skeleton" class="journey-log__item journey-log__item--skeleton">
                <div class="journey-log__stamp journey-log__stamp--skeleton">
                  <span class="skeleton-line skeleton-line--stamp-short" />
                  <span class="skeleton-line skeleton-line--stamp-long" />
                </div>
                <div class="journey-log__node"><div class="journey-log__node-inner" /></div>
                <div class="journey-card journey-card--skeleton">
                  <div class="journey-card__icon skeleton-block" />
                  <div class="journey-card__skeleton-lines">
                    <span class="skeleton-line skeleton-line--short" />
                    <span class="skeleton-line skeleton-line--long" />
                  </div>
                </div>
              </li>
            </TransitionGroup>

            <div class="journey-log__actions" v-if="sortedItems.length > DEFAULT_LIMIT">
              <button v-if="hasMore && !loading" type="button" class="journey-log__btn" @click="loadMore">
                继续翻看 {{ hiddenCount }} 条回响
              </button>
              <button v-else-if="!hasMore && !loading" type="button" class="journey-log__btn journey-log__btn--ghost" @click="collapse">
                收起回响
              </button>
            </div>

            <div v-if="!sortedItems.length" class="star-archive__empty">
              <Icon icon="ph:shooting-star-light" />
              <p>星轨档案里还没有新的回响记录。</p>
            </div>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '../adventure-theme.scss' as theme;

.star-archive {
  @include theme.page-shell;
}

.star-archive__sign {
  @include theme.sign-shell(linear-gradient(135deg, #a8d8ff 0%, #8fd6ff 42%, #d8e7ff 100%), #18496c, #76acd9);
}

.star-archive__hero,
.star-archive__latest {
  position: relative;
  z-index: 1;
}

.star-archive__hero {
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
    color: rgba(24, 73, 108, 0.82);
    max-width: 540px;
  }
}

.star-archive__eyebrow {
  display: inline-flex;
  width: fit-content;
  padding: 7px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.58);
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.06em;
}

.star-archive__latest {
  @include theme.surface-card(18px 20px, 24px);
  min-width: 240px;

  span {
    display: block;
    font-size: 13px;
    font-weight: 900;
    color: #5c82a3;
  }

  strong {
    display: block;
    margin-top: 8px;
    font-size: 24px;
    line-height: 1.15;
    color: #1f4f81;
  }

  p {
    margin: 8px 0 0;
    font-size: 13px;
    line-height: 1.65;
    color: #5f7591;
  }
}

.star-archive__layout {
  display: grid;
  grid-template-columns: minmax(300px, 0.74fr) minmax(0, 1.26fr);
  gap: 24px;
  align-items: start;
}

.star-archive__aside {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.jar-card {
  @include theme.surface-card(28px 24px, 34px);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  overflow: hidden;
}

.jar-card__glow {
  position: absolute;
  inset: auto auto -80px -40px;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(144, 216, 255, 0.34) 0%, rgba(144, 216, 255, 0) 74%);
  animation: portalOrbPulse 3.5s ease-in-out infinite;
}

.jar-card__glass {
  position: relative;
  width: 192px;
  height: 228px;
  overflow: hidden;
  border-radius: 58px 58px 42px 42px;
  border: 10px solid rgba(134, 206, 255, 0.38);
  background: rgba(247, 252, 255, 0.94);
  box-shadow: inset 0 -14px 30px rgba(88, 187, 255, 0.12);
}

.jar-card__fill {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  border-radius: 34px;
  background: linear-gradient(180deg, rgba(255, 216, 116, 0.86) 0%, rgba(99, 197, 111, 0.92) 100%);
  transition: height 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.jar-card__spark {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
}

.jar-card__spark--one { top: 36px; left: 42px; width: 14px; height: 14px; }
.jar-card__spark--two { top: 78px; right: 44px; width: 18px; height: 18px; }
.jar-card__spark--three { top: 126px; left: 74px; width: 10px; height: 10px; }

.jar-card__value {
  position: relative;
  z-index: 1;
  margin-top: 24px;

  span {
    display: block;
    font-size: 14px;
    font-weight: 900;
    color: #597493;
    letter-spacing: 0.08em;
  }

  strong {
    display: block;
    margin-top: 8px;
    font-size: 46px;
    line-height: 1;
    color: #236db4;
  }
}

.archive-stats {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.archive-stat {
  @include theme.surface-card(18px 20px, 24px);
  display: flex;
  align-items: center;
  gap: 14px;

  &__icon {
    width: 56px;
    height: 56px;
    border-radius: 20px;
    display: grid;
    place-items: center;
    font-size: 30px;
    color: white;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 2px;

    span {
      font-size: 13px;
      font-weight: 800;
      color: #6a819c;
    }

    strong {
      font-size: 26px;
      line-height: 1.15;
      color: #22384f;
    }
  }
}

.archive-stat--amber .archive-stat__icon { background: linear-gradient(135deg, #ffe082 0%, #ffba34 100%); }
.archive-stat--rose .archive-stat__icon { background: linear-gradient(135deg, #ffbaba 0%, #ff7b89 100%); }
.archive-stat--sky .archive-stat__icon { background: linear-gradient(135deg, #9ae4ff 0%, #67a8ff 100%); }

.journey-log {
  @include theme.surface-card(28px, 34px);
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.journey-log__title {
  display: flex;
  align-items: center;
  gap: 14px;

  svg {
    font-size: 34px;
    color: #3c87d2;
  }

  h3 {
    margin: 0;
    font-size: 24px;
    color: #22384f;
  }

  p {
    margin: 4px 0 0;
    font-size: 13px;
    line-height: 1.6;
    color: #6a819c;
  }
}

.journey-log__viewport {
  max-height: 560px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 12px;
  margin-right: -12px;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: rgba(138, 160, 185, 0.3);
    border-radius: 999px;
  }
}

.journey-log__container {
  position: relative;
  padding: 6px 0;
  --journey-stamp-width: 64px;
  --journey-node-width: 40px;
  --journey-gap: 14px;
}

.journey-log__line {
  position: absolute;
  left: calc(var(--journey-stamp-width) + (var(--journey-node-width) / 2));
  top: 14px;
  bottom: 0;
  width: 3px;
  border-radius: 999px;
  background: linear-gradient(180deg, #63c56f 0%, #42baff 48%, #ff8fa2 100%);
  opacity: 0.86;
  transform: translateX(-50%);
}

.journey-log__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.journey-log__item {
  display: grid;
  grid-template-columns: var(--journey-stamp-width) var(--journey-node-width) minmax(0, 1fr);
  column-gap: var(--journey-gap);
  content-visibility: auto;
  contain-intrinsic-size: 108px;
}

.journal-list-enter-active {
  transition: all 0.55s cubic-bezier(0.215, 0.61, 0.355, 1);
  transition-delay: calc(var(--stagger-idx) * 70ms);
}

.journal-list-enter-from {
  opacity: 0;
  transform: translateY(24px);
}

.journey-log__stamp {
  padding-top: 18px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  text-align: right;

  span {
    font-size: 11px;
    font-weight: 800;
    color: #8ca2b9;
    letter-spacing: 0.04em;
  }

  strong {
    font-size: 14px;
    line-height: 1.05;
    font-weight: 800;
    color: #46627d;
  }
}

.journey-log__stamp--skeleton {
  justify-content: center;
}

.journey-log__node {
  width: var(--journey-node-width);
  display: flex;
  justify-content: center;
  padding-top: 22px;
  flex-shrink: 0;
}

.journey-log__node-inner {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: white;
  border: 3px solid #dce8f5;
  transition: transform 0.2s ease;
}

.journey-log__node-inner--mint { border-color: #63c56f; }
.journey-log__node-inner--rose { border-color: #ff7b89; }

.journey-card {
  flex: 1;
  min-width: 0;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(247, 251, 255, 0.94) 100%);
  border-radius: 26px;
  padding: 18px 18px 18px 20px;
  border: 1px solid rgba(140, 165, 194, 0.2);
  box-shadow: 0 12px 18px rgba(62, 93, 128, 0.06);
  text-align: left;
}

.journey-card__top {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr) minmax(118px, auto);
  align-items: center;
  gap: 14px;
}

.journey-card__icon {
  width: 54px;
  height: 54px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  font-size: 28px;
  color: white;
  flex-shrink: 0;
}

.journey-card__icon--mint { background: linear-gradient(135deg, #a4ecae 0%, #63c56f 100%); }
.journey-card__icon--rose { background: linear-gradient(135deg, #ffbaba 0%, #ff7b89 100%); }

.journey-card__content {
  flex: 1;
  min-width: 0;

  strong {
    display: block;
    margin-top: 6px;
    font-size: 18px;
    color: #22384f;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  p {
    margin: 6px 0 0;
    font-size: 13px;
    line-height: 1.65;
    color: #6a819c;
  }
}

.journey-card__eyebrow {
  display: inline-flex;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(127, 149, 174, 0.12);
  color: #69839c;
  font-size: 11px;
  font-weight: 900;
}

.journey-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.journey-card__chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(123, 146, 171, 0.1);
  color: #57708c;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.02em;
}

.journey-card__score {
  min-width: 118px;
  padding: 12px 14px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
  text-align: right;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);

  span {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.04em;
    color: #6d839a;
  }

  strong {
    font-size: 24px;
    line-height: 1;
    font-weight: 900;
  }
}

.journey-card__score--mint {
  background: linear-gradient(145deg, rgba(165, 236, 174, 0.22) 0%, rgba(228, 250, 231, 0.84) 100%);
  border: 1px solid rgba(99, 197, 111, 0.16);

  strong {
    color: #2e7c43;
  }
}

.journey-card__score--rose {
  background: linear-gradient(145deg, rgba(255, 186, 186, 0.22) 0%, rgba(255, 239, 241, 0.88) 100%);
  border: 1px solid rgba(255, 123, 137, 0.16);

  strong {
    color: #d9485c;
  }
}

.journey-card--skeleton {
  display: flex;
  align-items: center;
  gap: 14px;
  pointer-events: none;
}

.journey-card__skeleton-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-block,
.skeleton-line {
  background: rgba(214, 226, 239, 0.7);
  animation: journalPulse 1.3s ease-in-out infinite;
}

.skeleton-block {
  width: 54px;
  height: 54px;
  border-radius: 18px;
  flex-shrink: 0;
}

.skeleton-line {
  height: 16px;
  border-radius: 999px;
}

.skeleton-line--stamp-short { width: 52px; height: 12px; }
.skeleton-line--stamp-long { width: 64px; height: 18px; }
.skeleton-line--short { width: 42%; }
.skeleton-line--long { width: 72%; }

@keyframes journalPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.journey-log__actions {
  margin-top: 22px;
  display: flex;
  justify-content: center;
}

.journey-log__btn {
  padding: 12px 22px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #95dfff 0%, #66a9ff 100%);
  color: white;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 10px 18px rgba(101, 168, 255, 0.24);
}

.journey-log__btn--ghost {
  background: rgba(105, 184, 255, 0.12);
  color: #2e5a8d;
  box-shadow: none;
}

.star-archive__empty {
  @include theme.empty-state(220px);
}

@media (max-width: 1024px) {
  .star-archive__sign {
    flex-direction: column;
    align-items: stretch;
  }

  .star-archive__layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .star-archive {
    gap: 20px;
  }

  .star-archive__sign,
  .journey-log,
  .jar-card {
    padding-left: 20px;
    padding-right: 20px;
  }

  .journey-log__item {
    column-gap: 12px;
  }

  .journey-log__container {
    --journey-stamp-width: 56px;
    --journey-node-width: 36px;
    --journey-gap: 12px;
  }

  .journey-log__stamp {
    padding-top: 16px;

    span {
      font-size: 11px;
    }

    strong {
      font-size: 15px;
    }
  }

  .journey-card__top {
    grid-template-columns: 54px minmax(0, 1fr);
    align-items: flex-start;
  }

  .journey-card__score {
    grid-column: 1 / -1;
    margin-left: 68px;
    min-width: 0;
    align-items: flex-start;
    text-align: left;
  }
}
</style>
