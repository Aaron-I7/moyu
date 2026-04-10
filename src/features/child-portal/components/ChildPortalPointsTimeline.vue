<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import {
  getLedgerAmountText,
  getLedgerIcon,
  getLedgerSummary,
  getLedgerTitle,
  getLedgerTone
} from '@/features/child-portal/helpers'
import type { ChildPointsResponse } from '@/features/child-portal/types'
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

// --- 仪式感时间轴交互逻辑 ---
const isDarkMode = ref(false)
const isRtl = ref(false)
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
    return timeB - timeA // 最新事件置顶
  })
})

const visibleItems = computed(() => {
  return sortedItems.value.slice(0, displayLimit.value)
})

const hasMore = computed(() => displayLimit.value < sortedItems.value.length)
const hiddenCount = computed(() => sortedItems.value.length - displayLimit.value)

const loadMore = async () => {
  loading.value = true
  // 模拟加载延迟，增强仪式感
  await new Promise(resolve => setTimeout(resolve, 600))
  loading.value = false
  displayLimit.value += BATCH_SIZE
}

const collapse = () => {
  displayLimit.value = DEFAULT_LIMIT
  if (viewportRef.value) {
    viewportRef.value.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const expandedItems = ref<string[]>([])
const toggleItem = (id?: string) => {
  if (!id) return
  const idx = expandedItems.value.indexOf(id)
  if (idx > -1) {
    expandedItems.value.splice(idx, 1)
  } else {
    expandedItems.value.push(id)
  }
}
</script>

<template>
  <section class="points-board">
    <header class="points-board__sign">
      <Icon icon="ph:book-bookmark-fill" class="points-board__sign-icon" />
      <h2>星空魔法书</h2>
    </header>

    <div class="points-board__layout">
      <!-- 星星罐与统计徽章区 -->
      <article class="star-jar-section">
        <div class="star-jar">
          <div class="star-jar__glass">
            <div class="star-jar__fill" :style="{ height: jarFill }" />
            <span class="star-jar__spark star-jar__spark--one" />
            <span class="star-jar__spark star-jar__spark--two" />
            <span class="star-jar__spark star-jar__spark--three" />
          </div>
          <div class="star-jar__value">
            <span>当前可用</span>
            <strong>{{ formatPoints(pointsData?.current_points || 0) }}</strong>
          </div>
        </div>

        <div class="points-badges">
          <div class="points-badge points-badge--amber">
            <div class="points-badge__icon">
              <Icon icon="ph:star-four-fill" />
            </div>
            <div class="points-badge__info">
              <span>累计获得</span>
              <strong>{{ formatPoints(pointsData?.total_points_earned || 0) }}</strong>
            </div>
          </div>
          
          <div class="points-badge points-badge--rose">
            <div class="points-badge__icon">
              <Icon icon="ph:shooting-star-fill" />
            </div>
            <div class="points-badge__info">
              <span>累计消耗</span>
              <strong>{{ formatPoints(pointsData?.total_points_spent || 0) }}</strong>
            </div>
          </div>
        </div>
      </article>

      <!-- 轨迹列表 (交互式纵向时间轴) -->
      <article class="magic-log" :class="{ 'magic-log--dark': isDarkMode }" :dir="isRtl ? 'rtl' : 'ltr'">
        <div class="section-title">
          <Icon icon="ph:magic-wand-fill" />
          <h3>魔法轨迹</h3>
          
          <!-- 附加工具栏：深色/RTL开关 -->
          <div class="magic-log__tools">
            <button type="button" @click="isDarkMode = !isDarkMode" class="tool-btn" title="切换深色模式">
              <Icon :icon="isDarkMode ? 'ph:moon-fill' : 'ph:sun-fill'" />
            </button>
            <button type="button" @click="isRtl = !isRtl" class="tool-btn" title="切换排版方向">
              <Icon :icon="isRtl ? 'ph:text-align-right' : 'ph:text-align-left'" />
            </button>
          </div>
        </div>

        <div class="magic-log__viewport" ref="viewportRef">
          <div class="magic-log__container">
            <div class="magic-log__timeline-line"></div>

            <TransitionGroup name="magic-list" tag="ol" class="magic-log__list" appear>
              <li
                v-for="(item, index) in visibleItems"
                :key="item.ledger_id || `log-${index}`"
                class="magic-log__item"
                :style="{ '--stagger-idx': index % BATCH_SIZE }"
              >
                <div class="magic-log__node">
                  <div class="magic-log__node-inner" :class="`magic-log__node--${getLedgerTone(item)}`"></div>
                </div>
                
                <div class="magic-log__card" @click="toggleItem(item.ledger_id)">
                  <div class="magic-log__card-main">
                    <div class="magic-log__icon" :class="`magic-log__icon--${getLedgerTone(item)}`">
                      <Icon :icon="getLedgerIcon(item)" />
                    </div>
                    
                    <div class="magic-log__content">
                      <strong>{{ getLedgerTitle(item) }}</strong>
                      <p>{{ getLedgerSummary(item) }}</p>
                    </div>

                    <div class="magic-log__amount" :class="`magic-log__amount--${getLedgerTone(item)}`">
                      {{ getLedgerAmountText(item) }}
                    </div>
                  </div>
                  
                  <div class="magic-log__details" :class="{ 'magic-log__details--open': expandedItems.includes(item.ledger_id || '') }">
                    <div class="magic-log__details-inner">
                      <p><strong>流水号：</strong>{{ item.ledger_id || '暂无' }}</p>
                      <p v-if="item.remark"><strong>备注：</strong>{{ item.remark }}</p>
                    </div>
                  </div>
                </div>
              </li>

              <!-- 骨架屏占位 -->
              <li v-if="loading" key="skeleton" class="magic-log__item magic-log__skeleton">
                <div class="magic-log__node"><div class="magic-log__node-inner"></div></div>
                <div class="magic-log__card skeleton-card">
                  <div class="skeleton-icon"></div>
                  <div class="skeleton-content">
                    <div class="skeleton-line skeleton-line--short"></div>
                    <div class="skeleton-line skeleton-line--long"></div>
                  </div>
                </div>
              </li>
            </TransitionGroup>

            <div class="magic-log__actions" v-if="sortedItems.length > DEFAULT_LIMIT">
              <button v-if="hasMore && !loading" type="button" class="expand-btn" @click="loadMore">
                <span>展开 {{ hiddenCount }} 条往事</span>
                <Icon icon="ph:arrows-down-up-bold" class="expand-icon" />
              </button>
              <button v-else-if="!hasMore && !loading" type="button" class="expand-btn expand-btn--collapse" @click="collapse">
                <span>收起</span>
                <Icon icon="ph:caret-up-bold" class="expand-icon" />
              </button>
            </div>
            
            <div v-if="!sortedItems.length" class="empty-state">
              <Icon icon="ph:shooting-star-light" />
              <p>还没有星星记录哦</p>
            </div>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped lang="scss">
.points-board {
  display: flex;
  flex-direction: column;
  gap: 24px;
  animation: boardRise 0.4s ease;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.points-board__sign {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%);
  border-radius: 24px;
  border: 4px solid #fff;
  box-shadow: 0 12px 0 rgba(161, 196, 253, 0.4), 0 16px 24px rgba(0,0,0,0.1);
  color: #1f4f81;
  
  .points-board__sign-icon {
    font-size: 40px;
  }
  
  h2 {
    margin: 0;
    font-size: 32px;
    font-weight: 900;
    letter-spacing: 0.05em;
  }
}

.points-board__layout {
  display: grid;
  grid-template-columns: minmax(300px, 0.8fr) minmax(0, 1.2fr);
  gap: 32px;
  align-items: start;
}

.star-jar-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.star-jar {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 252, 255, 0.84) 100%);
  border-radius: 36px;
  border: 4px solid #fff;
  box-shadow: 0 12px 24px rgba(69, 100, 134, 0.08);
}

.star-jar__glass {
  position: relative;
  width: 190px;
  height: 220px;
  overflow: hidden;
  border-radius: 54px 54px 42px 42px;
  border: 10px solid rgba(130, 203, 255, 0.38);
  background: rgba(247, 250, 255, 0.92);
  box-shadow: inset 0 -14px 30px rgba(88, 187, 255, 0.12);
}

.star-jar__fill {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  border-radius: 34px;
  background: linear-gradient(180deg, rgba(255, 214, 114, 0.82) 0%, rgba(99, 197, 111, 0.92) 100%);
  transition: height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.star-jar__spark {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.74);
}

.star-jar__spark--one { top: 36px; left: 42px; width: 14px; height: 14px; }
.star-jar__spark--two { top: 78px; right: 44px; width: 18px; height: 18px; }
.star-jar__spark--three { top: 126px; left: 74px; width: 10px; height: 10px; }

.star-jar__value {
  margin-top: 24px;
  text-align: center;

  span {
    display: block;
    font-size: 16px;
    letter-spacing: 0.14em;
    color: #5d7592;
    font-weight: 800;
  }

  strong {
    display: block;
    margin-top: 8px;
    font-size: 48px;
    line-height: 1;
    color: #236db4;
    text-shadow: 0 4px 12px rgba(35, 109, 180, 0.2);
  }
}

.points-badges {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.points-badge {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 24px;
  border: 4px solid #fff;
  box-shadow: 0 8px 16px rgba(0,0,0,0.06);
  
  &__icon {
    width: 56px;
    height: 56px;
    border-radius: 18px;
    display: grid;
    place-items: center;
    font-size: 32px;
    background: rgba(255,255,255,0.6);
  }
  
  &__info {
    display: flex;
    flex-direction: column;
    
    span {
      font-size: 14px;
      font-weight: 800;
      opacity: 0.8;
    }
    
    strong {
      font-size: 28px;
      line-height: 1.2;
    }
  }
}

.points-badge--amber {
  background: linear-gradient(135deg, #ffe082 0%, #ffbd39 100%);
  color: #7a4b00;
  
  .points-badge__icon { color: #d97706; }
}

.points-badge--rose {
  background: linear-gradient(135deg, #ffbaba 0%, #ff7b89 100%);
  color: #8c2a3e;
  
  .points-badge__icon { color: #e11d48; }
}

.magic-log {
  /* 基础变量 */
  --ml-bg: rgba(255, 255, 255, 0.8);
  --ml-card-bg: #ffffff;
  --ml-text-main: #2c3e50;
  --ml-text-sub: #8aa0b9;
  --ml-shadow: 0 12px 24px rgba(69, 100, 134, 0.08);
  --ml-card-shadow: 0 4px 12px rgba(0,0,0,0.04);
  --ml-card-hover: 0 8px 24px rgba(0,0,0,0.08);
  --ml-line-bg: linear-gradient(180deg, #63c56f, #42baff, #ff7b89);
  --ml-node-border: #e2e8f0;
  --ml-skeleton-bg: #f1f5f9;
  
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: var(--ml-bg);
  border-radius: 36px;
  padding: 32px;
  border: 4px solid var(--ml-card-bg);
  box-shadow: var(--ml-shadow);
  transition: all 0.4s ease;
  
  /* 深色模式 */
  &--dark {
    --ml-bg: rgba(30, 41, 59, 0.9);
    --ml-card-bg: #0f172a;
    --ml-text-main: #f8fafc;
    --ml-text-sub: #94a3b8;
    --ml-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
    --ml-card-shadow: 0 4px 12px rgba(0,0,0,0.2);
    --ml-card-hover: 0 8px 24px rgba(0,0,0,0.4);
    --ml-node-border: #334155;
    --ml-skeleton-bg: #1e293b;
    border-color: #334155;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--ml-text-main);
  
  svg { font-size: 32px; color: #42baff; }
  h3 { margin: 0; font-size: 24px; font-weight: 900; flex: 1; }
}

.magic-log__tools {
  display: flex;
  gap: 8px;
  
  .tool-btn {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    background: var(--ml-card-bg);
    border: 1px solid var(--ml-node-border);
    color: var(--ml-text-sub);
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      color: #42baff;
      border-color: #42baff;
    }
  }
}

.magic-log__viewport {
  max-height: 500px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 16px;
  margin-right: -16px;
  
  /* 滚动条美化 */
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { 
    background: rgba(138, 160, 185, 0.3); 
    border-radius: 6px; 
  }
}

.magic-log__container {
  position: relative;
  padding: 12px 0;
}

.magic-log__timeline-line {
  position: absolute;
  left: 25px;
  top: 16px;
  bottom: 0;
  width: 2px;
  background: var(--ml-line-bg);
  background-size: 100% 200%;
  border-radius: 2px;
  z-index: 0;
  animation: magicPulse 3s ease-in-out infinite alternate;
}

@keyframes magicPulse {
  0% { background-position: 0% 0%; opacity: 0.5; box-shadow: 0 0 4px rgba(66, 186, 255, 0.2); }
  100% { background-position: 0% 100%; opacity: 1; box-shadow: 0 0 12px rgba(66, 186, 255, 0.6); }
}

/* RTL适配 */
.magic-log[dir="rtl"] {
  .magic-log__viewport {
    padding-right: 0;
    padding-left: 16px;
    margin-right: 0;
    margin-left: -16px;
  }
  .magic-log__timeline-line {
    left: auto;
    right: 25px;
  }
  .magic-log__card {
    text-align: right;
  }
  .section-title {
    flex-direction: row-reverse;
  }
}

.magic-log__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.magic-log__item {
  display: flex;
  gap: 20px;
  /* 虚拟滚动原生优化：跳过屏幕外渲染 */
  content-visibility: auto;
  contain-intrinsic-size: 100px;
}

/* Vue 渐进披露动画 */
.magic-list-enter-active {
  transition: all 0.6s cubic-bezier(0.215, 0.61, 0.355, 1);
  transition-delay: calc(var(--stagger-idx) * 80ms);
}
.magic-list-enter-from {
  opacity: 0;
  transform: translateY(30px);
}
.magic-list-leave-active {
  transition: all 0.3s ease-in;
}
.magic-list-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.magic-log__node {
  width: 52px;
  display: flex;
  justify-content: center;
  padding-top: 22px;
  flex-shrink: 0;
  position: relative;
  z-index: 2;
}

.magic-log__node-inner {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--ml-card-bg);
  border: 3px solid var(--ml-node-border);
  transition: all 0.3s;
}

.magic-log__item:hover .magic-log__node-inner {
  transform: scale(1.4);
}
.magic-log__node--mint { border-color: #63c56f; }
.magic-log__node--rose { border-color: #ff7b89; }

.magic-log__card {
  flex: 1;
  min-width: 0;
  background: var(--ml-card-bg);
  border-radius: 24px;
  padding: 16px 20px;
  box-shadow: var(--ml-card-shadow);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  border: 1px solid var(--ml-node-border);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--ml-card-hover);
  }
}

.magic-log__card-main {
  display: flex;
  align-items: center;
  gap: 16px;
}

.magic-log__icon {
  width: 52px;
  height: 52px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  font-size: 28px;
  color: white;
  flex-shrink: 0;
}

.magic-log__icon--mint { background: linear-gradient(135deg, #a4ecae 0%, #63c56f 100%); }
.magic-log__icon--rose { background: linear-gradient(135deg, #ffbaba 0%, #ff7b89 100%); }

.magic-log__content {
  flex: 1;
  min-width: 0;
  
  strong {
    display: block;
    font-size: 18px;
    color: var(--ml-text-main);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  p {
    margin: 4px 0 0;
    font-size: 14px;
    color: var(--ml-text-sub);
  }
}

.magic-log__amount {
  font-size: 24px;
  font-weight: 900;
  white-space: nowrap;
}

.magic-log__amount--mint { color: #2e7c43; }
.magic-log__amount--rose { color: #e11d48; }

/* 展开抽屉 */
.magic-log__details {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.215, 0.61, 0.355, 1);
}

.magic-log__details--open {
  max-height: 100px;
  opacity: 1;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed var(--ml-node-border);
}

.magic-log__details-inner {
  font-size: 13px;
  color: var(--ml-text-sub);
  p { margin: 0 0 6px; }
  strong { color: var(--ml-text-main); }
}

/* 骨架屏 */
.skeleton-card {
  display: flex;
  align-items: center;
  gap: 16px;
  pointer-events: none;
}
.skeleton-icon {
  width: 52px;
  height: 52px;
  border-radius: 18px;
  background: var(--ml-skeleton-bg);
  animation: pulse 1.5s infinite;
}
.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.skeleton-line {
  height: 16px;
  background: var(--ml-skeleton-bg);
  border-radius: 8px;
  animation: pulse 1.5s infinite;
}
.skeleton-line--short { width: 40%; }
.skeleton-line--long { width: 70%; }

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

/* 展开按钮 */
.magic-log__actions {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 2;
}

.expand-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 999px;
  background: var(--ml-card-bg);
  border: 1px solid var(--ml-node-border);
  color: var(--ml-text-main);
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: var(--ml-card-shadow);
  transition: all 0.3s;
  
  &:hover {
    color: #42baff;
    border-color: #42baff;
    transform: translateY(-2px);
  }
}

.expand-icon {
  font-size: 16px;
}

/* 适配移动端 */
@media (max-width: 600px) {
  .magic-log__item { gap: 12px; }
  .magic-log__timeline-line { left: 17px; }
  .magic-log[dir="rtl"] .magic-log__timeline-line { right: 17px; }
  .magic-log__node { width: 36px; }
  .magic-log__card { padding: 12px 16px; }
  .magic-log__icon { width: 40px; height: 40px; font-size: 20px; }
  .magic-log__amount { font-size: 18px; }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #8aa0b9;
  text-align: center;
  background: #fff;
  border-radius: 24px;
  
  svg { font-size: 64px; margin-bottom: 16px; opacity: 0.5; }
  p { font-size: 18px; font-weight: 800; margin: 0; }
}

@keyframes boardRise {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 980px) {
  .points-board__layout {
    grid-template-columns: 1fr;
  }
  
  .points-badges {
    flex-direction: row;
    
    .points-badge {
      flex: 1;
      padding: 16px;
      
      &__icon {
        width: 48px;
        height: 48px;
        font-size: 24px;
      }
      
      &__info strong {
        font-size: 24px;
      }
    }
  }
}

@media (max-width: 600px) {
  .points-badges {
    flex-direction: column;
  }
  
  .magic-log__item {
    padding: 16px;
  }
}
</style>
