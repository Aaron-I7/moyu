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
import type { ChildRewardsResponse } from '@/features/child-portal/types'

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

const wishPresets = [
  { key: 'outing', label: '出去玩', icon: 'ph:park-fill', tone: 'sky' },
  { key: 'toy', label: '小玩具', icon: 'ph:teddy-bear-fill', tone: 'rose' },
  { key: 'snack', label: '好吃的', icon: 'ph:ice-cream-fill', tone: 'amber' },
  { key: 'together', label: '陪伴', icon: 'ph:hand-heart-fill', tone: 'mint' }
] as const

function updateTitle(event: Event) {
  emit('update:title', (event.target as HTMLInputElement).value)
}

function togglePreset(label: string) {
  emit('update:description', props.description === label ? '' : label)
}

function isPresetActive(label: string) {
  return props.description === label
}
</script>

<template>
  <section class="magic-store">
    <!-- 店铺招牌 -->
    <header class="magic-store__sign">
      <Icon icon="ph:storefront-fill" class="magic-store__sign-icon" />
      <h2>魔法商店</h2>
    </header>

    <div class="magic-store__layout">
      <!-- 宝箱区 -->
      <article class="treasure-wall">
        <div class="section-title">
          <Icon icon="ph:gift-fill" />
          <h3>兑换宝箱</h3>
        </div>

        <div v-if="rewardCards.length" class="treasure-grid">
          <article
            v-for="item in rewardCards"
            :key="item.reward_id"
            class="treasure-item"
            :class="[`treasure-item--${getRewardAccent(item.reward_type)}`, { 'treasure-item--ready': getRewardGap(item, currentPoints) === 0 }]"
          >
            <div class="treasure-item__art">
              <img v-if="item.image_url" :src="item.image_url" :alt="item.title" />
              <Icon v-else :icon="getRewardVisualIcon(item.reward_type)" />
            </div>
            
            <div class="treasure-item__info">
              <span class="treasure-item__type">{{ getRewardTypeLabel(item.reward_type) }}</span>
              <h4>{{ item.title }}</h4>
            </div>

            <div class="treasure-item__action">
              <div class="treasure-item__cost">
                <Icon icon="ph:shooting-star-fill" />
                <strong>{{ formatPoints(item.cost_points) }}</strong>
              </div>
              <div class="treasure-item__status">
                <span v-if="getRewardGap(item, currentPoints) === 0" class="status-ready">可以兑换啦！</span>
                <span v-else class="status-wait">还差 {{ getRewardGap(item, currentPoints) }} 星星</span>
              </div>
              <div class="treasure-item__progress">
                <span :style="{ width: `${Math.max(10, 100 - Math.min(getRewardGap(item, currentPoints) * 10, 90))}%` }" />
              </div>
            </div>
          </article>
        </div>

        <div v-else class="empty-state">
          <Icon icon="ph:treasure-chest-light" />
          <p>商店里暂时没有宝箱</p>
        </div>
      </article>

      <!-- 愿望信箱 -->
      <aside class="wish-sidebar">
        <article class="wish-mailbox">
          <div class="section-title">
            <Icon icon="ph:paper-plane-tilt-fill" />
            <h3>愿望信箱</h3>
          </div>

          <form class="mailbox-form" @submit.prevent="emit('submit')">
            <div class="mailbox-input-wrapper">
              <input
                :value="title"
                maxlength="30"
                placeholder="我想要..."
                @input="updateTitle"
                class="mailbox-input"
              />
            </div>

            <div class="mailbox-presets">
              <button
                v-for="item in wishPresets"
                :key="item.key"
                type="button"
                class="preset-btn"
                :class="[
                  `preset-btn--${item.tone}`,
                  { 'preset-btn--active': isPresetActive(item.label) }
                ]"
                @click="togglePreset(item.label)"
              >
                <Icon :icon="item.icon" />
                <span>{{ item.label }}</span>
              </button>
            </div>

            <button type="submit" class="submit-btn" :disabled="actionBusy || !title">
              投入信箱
            </button>
          </form>
        </article>

        <article class="wish-history">
          <div class="section-title">
            <Icon icon="ph:clock-counter-clockwise-fill" />
            <h3>愿望记录</h3>
          </div>

          <ul v-if="rewardsData?.request_history?.length" class="history-list">
            <li v-for="item in rewardsData.request_history" :key="item.request_id" class="history-item">
              <div class="history-item__icon" :class="`history-item__icon--${getRewardRequestTone(item.status)}`">
                <Icon :icon="getRewardRequestIcon(item.status)" />
              </div>
              <div class="history-item__content">
                <div class="history-item__header">
                  <strong>{{ item.title }}</strong>
                  <span class="history-tag" :class="`history-tag--${getRewardRequestTone(item.status)}`">
                    {{ getRewardRequestStatusLabel(item.status) }}
                  </span>
                </div>
                <p>{{ getRewardRequestSummary(item) }}</p>
              </div>
            </li>
          </ul>

          <div v-else class="empty-state empty-state--small">
            <Icon icon="ph:shooting-star-light" />
            <p>还没许过愿望呢</p>
          </div>
        </article>
      </aside>
    </div>
  </section>
</template>

<style scoped lang="scss">
.magic-store {
  display: flex;
  flex-direction: column;
  gap: 24px;
  animation: storeRise 0.4s ease;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.magic-store__sign {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%);
  border-radius: 24px;
  border: 4px solid #fff;
  box-shadow: 0 12px 0 rgba(255, 154, 158, 0.3), 0 16px 24px rgba(0,0,0,0.1);
  color: #8c2a3e;
  
  .magic-store__sign-icon {
    font-size: 40px;
  }
  
  h2 {
    margin: 0;
    font-size: 32px;
    font-weight: 900;
    letter-spacing: 0.05em;
  }
}

.magic-store__layout {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(300px, 0.6fr);
  gap: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  color: #2c3e50;
  
  svg { font-size: 28px; color: #ff9100; }
  h3 { margin: 0; font-size: 22px; font-weight: 900; }
}

.treasure-wall,
.wish-mailbox,
.wish-history {
  background: rgba(255,255,255,0.9);
  border-radius: 24px;
  padding: 24px;
  border: 3px solid rgba(255,255,255,0.8);
  box-shadow: 0 12px 24px rgba(0,0,0,0.06);
}

.wish-sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.treasure-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.treasure-item {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 20px;
  padding: 16px;
  border: 3px solid rgba(0,0,0,0.05);
  box-shadow: 0 8px 0 rgba(0,0,0,0.05);
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-4px);
  }
}

.treasure-item--ready {
  border-color: #4cdb5e;
  box-shadow: 0 8px 0 rgba(76, 219, 94, 0.3), 0 0 20px rgba(76, 219, 94, 0.2);
  animation: pulseReady 2s infinite;
}

@keyframes pulseReady {
  0% { box-shadow: 0 8px 0 rgba(76, 219, 94, 0.3), 0 0 0 0 rgba(76, 219, 94, 0.4); }
  70% { box-shadow: 0 8px 0 rgba(76, 219, 94, 0.3), 0 0 0 15px rgba(76, 219, 94, 0); }
  100% { box-shadow: 0 8px 0 rgba(76, 219, 94, 0.3), 0 0 0 0 rgba(76, 219, 94, 0); }
}

.treasure-item__art {
  width: 100px;
  height: 100px;
  margin: 0 auto 12px;
  border-radius: 24px;
  background: #f8f9fa;
  display: grid;
  place-items: center;
  font-size: 50px;
  box-shadow: inset 0 4px 8px rgba(0,0,0,0.05);
  
  img { width: 100%; height: 100%; object-fit: cover; border-radius: 24px; }
}

.treasure-item--rose .treasure-item__art { color: #ff725c; background: #fff1f0; }
.treasure-item--sky .treasure-item__art { color: #42baff; background: #f0f9ff; }
.treasure-item--mint .treasure-item__art { color: #4cdb5e; background: #f0fdf4; }
.treasure-item--amber .treasure-item__art { color: #ffaa00; background: #fffcf0; }

.treasure-item__info {
  text-align: center;
  margin-bottom: 16px;
  
  h4 {
    margin: 8px 0 0;
    font-size: 20px;
    font-weight: 900;
    color: #2c3e50;
  }
}

.treasure-item__type {
  display: inline-block;
  padding: 4px 10px;
  background: #f1f5f9;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  color: #64748b;
}

.treasure-item__action {
  margin-top: auto;
  background: #f8f9fa;
  border-radius: 16px;
  padding: 12px;
}

.treasure-item__cost {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #ff9100;
  font-size: 20px;
  
  strong { font-weight: 900; }
}

.treasure-item__status {
  text-align: center;
  margin: 8px 0;
  font-size: 13px;
  font-weight: 800;
  
  .status-ready { color: #28a745; }
  .status-wait { color: #8da2b5; }
}

.treasure-item__progress {
  height: 10px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
  
  span {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #ffaa00, #4cdb5e);
    border-radius: 999px;
    transition: width 0.3s ease;
  }
}

.mailbox-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mailbox-input-wrapper {
  background: #f8f9fa;
  padding: 8px;
  border-radius: 20px;
  border: 2px solid #e2e8f0;
}

.mailbox-input {
  width: 100%;
  border: none;
  background: transparent;
  padding: 12px;
  font-size: 18px;
  font-weight: 800;
  color: #2c3e50;
  outline: none;
  
  &::placeholder { color: #cbd5e1; }
}

.mailbox-presets {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.preset-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border-radius: 16px;
  border: none;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
  
  svg { font-size: 20px; }
}

.preset-btn--sky { background: #f0f9ff; color: #0284c7; }
.preset-btn--rose { background: #fff1f2; color: #e11d48; }
.preset-btn--amber { background: #fffbeb; color: #d97706; }
.preset-btn--mint { background: #f0fdf4; color: #16a34a; }

.preset-btn--active {
  transform: translateY(-2px);
  box-shadow: inset 0 0 0 2px currentColor;
}

.submit-btn {
  padding: 16px;
  border-radius: 16px;
  border: none;
  background: linear-gradient(135deg, #ff9a9e, #fecfef);
  color: #8c2a3e;
  font-size: 18px;
  font-weight: 900;
  box-shadow: 0 6px 0 rgba(255, 154, 158, 0.4);
  cursor: pointer;
  transition: all 0.1s;
  
  &:active:not(:disabled) {
    transform: translateY(4px);
    box-shadow: 0 2px 0 rgba(255, 154, 158, 0.4);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: 0 2px 0 rgba(255, 154, 158, 0.4);
    transform: translateY(4px);
  }
}

.history-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 16px;
}

.history-item__icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 20px;
  color: white;
  flex-shrink: 0;
}

.history-item__icon--sky { background: linear-gradient(135deg, #92dcff, #68a8ff); }
.history-item__icon--mint { background: linear-gradient(135deg, #a4ecae, #63c56f); }
.history-item__icon--rose { background: linear-gradient(135deg, #ffc58f, #f1865e); }

.history-item__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  
  p {
    margin: 0;
    font-size: 13px;
    color: #64748b;
    font-weight: 700;
  }
}

.history-item__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  strong { font-size: 15px; color: #1e293b; }
}

.history-tag {
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 900;
}

.history-tag--sky { background: #e0f2fe; color: #0284c7; }
.history-tag--mint { background: #dcfce7; color: #16a34a; }
.history-tag--rose { background: #ffe4e6; color: #e11d48; }

.empty-state {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #94a3b8;
  font-weight: 800;
  
  svg { font-size: 48px; }
}

.empty-state--small {
  min-height: 120px;
  svg { font-size: 32px; }
}

@keyframes storeRise {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 900px) {
  .magic-store__layout { grid-template-columns: 1fr; }
  .wish-sidebar { flex-direction: row; flex-wrap: wrap; }
  .wish-mailbox, .wish-history { flex: 1; min-width: 300px; }
}

@media (max-width: 600px) {
  .wish-sidebar { flex-direction: column; }
  .treasure-grid { grid-template-columns: 1fr 1fr; }
}
</style>
