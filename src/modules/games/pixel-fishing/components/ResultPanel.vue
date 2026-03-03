<script setup lang="ts">
/**
 * 像素钓场 — 钓获结果面板
 * 精美多图层设计，展示丰富的鱼类信息
 */
import { computed, ref, onMounted } from 'vue'
import type { Fish, CatchRecord } from '../types'
import { RARITY_COLORS, RARITY_NAMES } from '../constants'
import { SPOTS } from '../data/spots'

const props = defineProps<{
  fish: Fish | null
  record: CatchRecord | null
  isNew: boolean
  success: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const imageLoaded = ref(false)
const imageError = ref(false)

const rarityGlow = computed(() => {
  if (!props.fish) return ''
  const color = RARITY_COLORS[props.fish.rarity]
  return `0 0 60px ${color}40, 0 0 120px ${color}20`
})

const spotName = computed(() => {
  if (!props.record?.spotId) return '未知钓点'
  const spot = SPOTS.find(s => s.id === props.record?.spotId)
  return spot?.name || '未知钓点'
})

const catchTime = computed(() => {
  if (!props.record?.timestamp) return ''
  const date = new Date(props.record.timestamp)
  return date.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

const rarityBgGradient = computed(() => {
  if (!props.fish) return ''
  const color = RARITY_COLORS[props.fish.rarity]
  return `linear-gradient(135deg, ${color}15 0%, transparent 50%, ${color}08 100%)`
})

function onClose() {
  emit('close')
}

function openBaike(url: string | undefined) {
  if (url) {
    window.open(url, '_blank')
  }
}

function handleImageLoad() {
  imageLoaded.value = true
}

function handleImageError() {
  imageError.value = true
}

onMounted(() => {
  imageLoaded.value = false
  imageError.value = false
})
</script>

<template>
  <div class="result-overlay" @click="onClose">
    <!-- 背景粒子装饰 -->
    <div class="bg-particles">
      <span v-for="i in 12" :key="i" class="particle" :style="{ '--delay': i * 0.1 + 's' }" />
    </div>
    
    <div
      class="result-panel"
      :class="[
        success ? 'result-panel--success' : 'result-panel--fail',
        `rarity--${fish?.rarity || 'common'}`
      ]"
      :style="{ '--rarity-glow': rarityGlow, '--rarity-bg': rarityBgGradient }"
      @click.stop
    >
      <template v-if="success && fish && record">
        <!-- 顶部装饰光效 -->
        <div class="panel-glow" />

        <!-- 主内容区域 -->
        <div class="panel-content">
          <!-- 左侧：鱼类照片 -->
          <div class="fish-photo-section">
            <div class="photo-frame">
              <div class="photo-inner">
                <img
                  v-if="fish.imageUrl && !imageError"
                  :src="fish.imageUrl"
                  :alt="fish.name"
                  referrerpolicy="no-referrer"
                  :class="['fish-img', { 'fish-img--loaded': imageLoaded }]"
                  @load="handleImageLoad"
                  @error="handleImageError"
                />
                <div v-else class="photo-placeholder">
                  <span class="placeholder-icon">🐟</span>
                </div>
              </div>
              <!-- 照片装饰边框 -->
              <div class="frame-corner frame-corner--tl" />
              <div class="frame-corner frame-corner--tr" />
              <div class="frame-corner frame-corner--bl" />
              <div class="frame-corner frame-corner--br" />
            </div>
            
            <!-- 新物种标记 -->
            <div v-if="isNew" class="new-badge">
              <span class="new-badge__icon">✦</span>
              <span class="new-badge__text">首次发现</span>
              <span class="new-badge__icon">✦</span>
            </div>
            
            <!-- 稀有度徽章 -->
            <div
              class="rarity-badge"
              :style="{ background: RARITY_COLORS[fish.rarity] }"
            >
              <span class="rarity-badge__gem">◆</span>
              <span class="rarity-badge__text">{{ RARITY_NAMES[fish.rarity] }}</span>
            </div>
          </div>

          <!-- 右侧：详细信息 -->
          <div class="fish-info-section">
            <!-- 鱼名标题 -->
            <div class="fish-header">
              <h2 class="fish-name" :style="{ color: RARITY_COLORS[fish.rarity] }">
                {{ fish.name }}
              </h2>
              <p v-if="fish.scientificName" class="scientific-name">
                {{ fish.scientificName }}
              </p>
            </div>

            <!-- 基础描述 -->
            <p class="fish-desc">{{ fish.description }}</p>

            <!-- 钓获数据卡片 -->
            <div class="catch-data-grid">
              <div class="data-card">
                <span class="data-card__icon">📏</span>
                <div class="data-card__content">
                  <span class="data-card__label">尺寸</span>
                  <span class="data-card__value">{{ record.size }} <small>cm</small></span>
                </div>
              </div>
              <div class="data-card">
                <span class="data-card__icon">⚖️</span>
                <div class="data-card__content">
                  <span class="data-card__label">重量</span>
                  <span class="data-card__value">{{ record.weight }} <small>kg</small></span>
                </div>
              </div>
              <div class="data-card">
                <span class="data-card__icon">💰</span>
                <div class="data-card__content">
                  <span class="data-card__label">价值</span>
                  <span class="data-card__value data-card__value--gold">{{ record.value }}</span>
                </div>
              </div>
              <div class="data-card">
                <span class="data-card__icon">📍</span>
                <div class="data-card__content">
                  <span class="data-card__label">钓点</span>
                  <span class="data-card__value data-card__value--small">{{ spotName }}</span>
                </div>
              </div>
              <div class="data-card">
                <span class="data-card__icon">🕐</span>
                <div class="data-card__content">
                  <span class="data-card__label">时间</span>
                  <span class="data-card__value data-card__value--small">{{ catchTime }}</span>
                </div>
              </div>
              <div v-if="record.combo >= 2" class="data-card">
                <span class="data-card__icon">🔥</span>
                <div class="data-card__content">
                  <span class="data-card__label">连击</span>
                  <span class="data-card__value">{{ record.combo }}连</span>
                </div>
              </div>
            </div>

            <!-- 详细信息 -->
            <div class="detail-section">
              <div v-if="fish.habitat" class="detail-row">
                <span class="detail-row__icon">🏠</span>
                <div class="detail-row__content">
                  <span class="detail-row__label">栖息地</span>
                  <span class="detail-row__value">{{ fish.habitat }}</span>
                </div>
              </div>
              <div v-if="fish.diet" class="detail-row">
                <span class="detail-row__icon">🍽️</span>
                <div class="detail-row__content">
                  <span class="detail-row__label">食性</span>
                  <span class="detail-row__value">{{ fish.diet }}</span>
                </div>
              </div>
            </div>

            <!-- 趣味知识 -->
            <div v-if="fish.funFact" class="fun-fact-card">
              <div class="fun-fact-card__header">
                <span class="fun-fact-card__icon">💡</span>
                <span class="fun-fact-card__title">趣味知识</span>
              </div>
              <p class="fun-fact-card__text">{{ fish.funFact }}</p>
            </div>

            <!-- 操作按钮 -->
            <div class="action-buttons">
              <button
                v-if="fish.baikeUrl"
                class="btn btn--secondary"
                @click="openBaike(fish.baikeUrl)"
              >
                <span class="btn__icon">📖</span>
                <span>百度百科</span>
              </button>
              <button class="btn btn--primary" @click="onClose">
                <span class="btn__icon">▶</span>
                <span>继续钓鱼</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 底部装饰 -->
        <div class="panel-footer">
          <div class="footer-line" />
        </div>
      </template>

      <template v-else>
        <div class="fail-content">
          <div class="fail-icon-wrap">
            <span class="fail-icon">💨</span>
            <div class="fail-ripple" />
          </div>
          <h3 class="fail-title">鱼跑了...</h3>
          <p class="fail-hint">别灰心，下次一定能钓到大鱼！</p>
          <button class="btn btn--fail" @click="onClose">
            <span class="btn__icon">▶</span>
            <span>再来一次</span>
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
// ═══════════════════════════════════════════════════════════════
// 设计变量
// ═══════════════════════════════════════════════════════════════
$rp-bg: rgba(12, 8, 24, 0.96);
$rp-bg-card: rgba(20, 14, 40, 0.8);
$rp-border: rgba(106, 90, 174, 0.2);
$rp-text: #E8E6E0;
$rp-text-dim: rgba(232, 230, 224, 0.55);
$rp-accent: #D4A84B;
$rp-success: #5BB87A;
$rp-error: #E86A6A;
$rp-radius: 12px;
$rp-radius-sm: 8px;

// 稀有度颜色
$rarity-common: #A8A8A8;
$rarity-uncommon: #4CAF50;
$rarity-rare: #5B9BD5;
$rarity-epic: #A855F7;
$rarity-legendary: #F59E0B;

// ═══════════════════════════════════════════════════════════════
// 遮罩层
// ═══════════════════════════════════════════════════════════════
.result-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 25;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  animation: overlay-in 0.4s ease;
}

@keyframes overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

// 背景粒子
.bg-particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: $rp-accent;
  border-radius: 50%;
  opacity: 0;
  animation: particle-float 3s ease-in-out infinite;
  animation-delay: var(--delay);
  
  @for $i from 1 through 12 {
    &:nth-child(#{$i}) {
      left: #{random(100)}%;
      top: #{random(100)}%;
    }
  }
}

@keyframes particle-float {
  0%, 100% { opacity: 0; transform: translateY(0) scale(0.5); }
  50% { opacity: 0.6; transform: translateY(-20px) scale(1); }
}

// ═══════════════════════════════════════════════════════════════
// 主面板
// ═══════════════════════════════════════════════════════════════
.result-panel {
  position: relative;
  width: 92%;
  max-width: 720px;
  max-height: 90vh;
  overflow-y: auto;
  overflow-x: visible;
  background: $rp-bg;
  border: 1px solid $rp-border;
  border-radius: $rp-radius;
  box-shadow: 
    0 8px 60px rgba(0, 0, 0, 0.8),
    0 0 100px rgba(106, 90, 174, 0.1),
    var(--rarity-glow);
  animation: panel-enter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--rarity-bg);
    border-radius: inherit;
    pointer-events: none;
    z-index: 0;
  }
  
  // 稀有度边框发光
  &.rarity--rare { border-color: rgba($rarity-rare, 0.4); }
  &.rarity--epic { border-color: rgba($rarity-epic, 0.4); }
  &.rarity--legendary { 
    border-color: rgba($rarity-legendary, 0.5);
    animation: panel-enter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), legendary-pulse 2s ease-in-out infinite;
  }
}

@keyframes panel-enter {
  0% { 
    opacity: 0; 
    transform: scale(0.85) translateY(30px); 
  }
  100% { 
    opacity: 1; 
    transform: scale(1) translateY(0); 
  }
}

@keyframes legendary-pulse {
  0%, 100% { box-shadow: 0 8px 60px rgba(0, 0, 0, 0.8), 0 0 100px rgba($rarity-legendary, 0.15); }
  50% { box-shadow: 0 8px 60px rgba(0, 0, 0, 0.8), 0 0 120px rgba($rarity-legendary, 0.25); }
}

// 顶部光效
.panel-glow {
  position: absolute;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  height: 200px;
  background: radial-gradient(ellipse, rgba($rp-accent, 0.15) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

// ═══════════════════════════════════════════════════════════════
// 新物种徽章
// ═══════════════════════════════════════════════════════════════
.new-badge {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 28px;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%);
  color: #1A1205;
  border-radius: 24px;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 3px;
  text-transform: uppercase;
  box-shadow: 
    0 6px 30px rgba(255, 215, 0, 0.5),
    0 0 60px rgba(255, 165, 0, 0.3),
    inset 0 2px 0 rgba(255, 255, 255, 0.3);
  animation: badge-glow 2s ease-in-out infinite, badge-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
  border: 2px solid rgba(255, 255, 255, 0.4);
  
  &::before {
    content: '';
    position: absolute;
    inset: -3px;
    background: linear-gradient(135deg, #FFD700, #FFA500, #FFD700);
    border-radius: inherit;
    z-index: -1;
    opacity: 0;
    animation: badge-border-pulse 2s ease-in-out infinite;
  }
}

.new-badge__icon {
  font-size: 14px;
  animation: icon-bounce 1s ease-in-out infinite;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.new-badge__text {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

@keyframes badge-glow {
  0%, 100% {
    box-shadow: 
      0 6px 30px rgba(255, 215, 0, 0.5),
      0 0 60px rgba(255, 165, 0, 0.3),
      inset 0 2px 0 rgba(255, 255, 255, 0.3);
  }
  50% {
    box-shadow: 
      0 8px 40px rgba(255, 215, 0, 0.7),
      0 0 80px rgba(255, 165, 0, 0.5),
      inset 0 2px 0 rgba(255, 255, 255, 0.3);
  }
}

@keyframes badge-border-pulse {
  0%, 100% { opacity: 0; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.05); }
}

@keyframes badge-pop {
  0% { opacity: 0; transform: scale(0.5); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes icon-bounce {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-3px) rotate(180deg); }
}

// ═══════════════════════════════════════════════════════════════
// 主内容区域
// ═══════════════════════════════════════════════════════════════
.panel-content {
  display: flex;
  gap: 24px;
  padding: 28px;
  position: relative;
  z-index: 1;
}

// ═══════════════════════════════════════════════════════════════
// 左侧照片区域
// ═══════════════════════════════════════════════════════════════
.fish-photo-section {
  flex-shrink: 0;
  width: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.photo-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  border-radius: $rp-radius-sm;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.4);
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.4),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05);
}

.photo-inner {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fish-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.5s ease;
  
  &--loaded {
    opacity: 1;
  }
}

.photo-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(106, 90, 174, 0.1) 0%, rgba(106, 90, 174, 0.05) 100%);
}

.placeholder-icon {
  font-size: 64px;
  opacity: 0.3;
}

// 照片装饰角
.frame-corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid rgba($rp-accent, 0.5);
  
  &--tl { top: 6px; left: 6px; border-right: none; border-bottom: none; }
  &--tr { top: 6px; right: 6px; border-left: none; border-bottom: none; }
  &--bl { bottom: 6px; left: 6px; border-right: none; border-top: none; }
  &--br { bottom: 6px; right: 6px; border-left: none; border-top: none; }
}

// 稀有度徽章
.rarity-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

.rarity-badge__gem {
  font-size: 8px;
}

// ═══════════════════════════════════════════════════════════════
// 右侧信息区域
// ═══════════════════════════════════════════════════════════════
.fish-info-section {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// 鱼名标题
.fish-header {
  text-align: left;
}

.fish-name {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 3px;
  margin: 0;
  line-height: 1.2;
  text-shadow: 0 2px 10px currentColor;
}

.scientific-name {
  margin: 6px 0 0;
  font-size: 13px;
  font-style: italic;
  color: $rp-text-dim;
  letter-spacing: 0.5px;
}

// 基础描述
.fish-desc {
  font-size: 13px;
  color: $rp-text-dim;
  line-height: 1.7;
  margin: 0;
  padding-left: 12px;
  border-left: 2px solid $rp-border;
}

// ═══════════════════════════════════════════════════════════════
// 钓获数据网格
// ═══════════════════════════════════════════════════════════════
.catch-data-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.data-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: $rp-bg-card;
  border: 1px solid $rp-border;
  border-radius: $rp-radius-sm;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(106, 90, 174, 0.1);
    border-color: rgba(106, 90, 174, 0.3);
  }
}

.data-card__icon {
  font-size: 18px;
  flex-shrink: 0;
}

.data-card__content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.data-card__label {
  font-size: 10px;
  color: $rp-text-dim;
  letter-spacing: 0.5px;
}

.data-card__value {
  font-size: 15px;
  font-weight: 700;
  color: $rp-text;
  
  small {
    font-size: 11px;
    font-weight: 400;
    opacity: 0.7;
  }
  
  &--gold { color: $rp-accent; }
  &--small { font-size: 12px; }
}

// ═══════════════════════════════════════════════════════════════
// 详细信息
// ═══════════════════════════════════════════════════════════════
.detail-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(106, 90, 174, 0.05);
  border-radius: $rp-radius-sm;
}

.detail-row__icon {
  font-size: 14px;
  flex-shrink: 0;
  margin-top: 2px;
}

.detail-row__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-row__label {
  font-size: 10px;
  color: $rp-text-dim;
  letter-spacing: 0.5px;
}

.detail-row__value {
  font-size: 12px;
  color: $rp-text;
  line-height: 1.5;
}

// ═══════════════════════════════════════════════════════════════
// 趣味知识卡片
// ═══════════════════════════════════════════════════════════════
.fun-fact-card {
  padding: 14px;
  background: linear-gradient(135deg, rgba($rp-accent, 0.1) 0%, rgba($rp-accent, 0.05) 100%);
  border: 1px solid rgba($rp-accent, 0.2);
  border-radius: $rp-radius-sm;
}

.fun-fact-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.fun-fact-card__icon {
  font-size: 14px;
}

.fun-fact-card__title {
  font-size: 11px;
  font-weight: 600;
  color: $rp-accent;
  letter-spacing: 1px;
}

.fun-fact-card__text {
  font-size: 12px;
  color: rgba($rp-text, 0.85);
  line-height: 1.7;
  margin: 0;
}

// ═══════════════════════════════════════════════════════════════
// 操作按钮
// ═══════════════════════════════════════════════════════════════
.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: auto;
}

.btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: $rp-radius-sm;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &__icon {
    font-size: 12px;
  }
  
  &--primary {
    background: linear-gradient(135deg, $rp-accent 0%, #E8C547 100%);
    color: #1A1205;
    box-shadow: 0 4px 20px rgba($rp-accent, 0.3);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba($rp-accent, 0.4);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
  
  &--secondary {
    background: rgba(106, 90, 174, 0.15);
    color: $rp-text;
    border: 1px solid rgba(106, 90, 174, 0.3);
    
    &:hover {
      background: rgba(106, 90, 174, 0.25);
      border-color: rgba(106, 90, 174, 0.5);
    }
  }
  
  &--fail {
    background: rgba($rp-error, 0.15);
    color: $rp-text;
    border: 1px solid rgba($rp-error, 0.3);
    
    &:hover {
      background: rgba($rp-error, 0.25);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// 底部装饰
// ═══════════════════════════════════════════════════════════════
.panel-footer {
  padding: 0 28px 16px;
  position: relative;
  z-index: 1;
}

.footer-line {
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba($rp-accent, 0.3), transparent);
  border-radius: 1px;
}

// ═══════════════════════════════════════════════════════════════
// 失败状态
// ═══════════════════════════════════════════════════════════════
.fail-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 32px;
  text-align: center;
}

.fail-icon-wrap {
  position: relative;
  margin-bottom: 16px;
}

.fail-icon {
  font-size: 72px;
  display: block;
  animation: fail-icon-float 2s ease-in-out infinite;
}

.fail-ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100px;
  height: 100px;
  transform: translate(-50%, -50%);
  border: 2px solid rgba($rp-error, 0.3);
  border-radius: 50%;
  animation: ripple-expand 2s ease-out infinite;
}

@keyframes fail-icon-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes ripple-expand {
  0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
}

.fail-title {
  font-size: 24px;
  font-weight: 700;
  color: $rp-error;
  letter-spacing: 3px;
  margin: 0 0 8px;
}

.fail-hint {
  font-size: 13px;
  color: $rp-text-dim;
  margin: 0 0 24px;
}

// ═══════════════════════════════════════════════════════════════
// 响应式设计
// ═══════════════════════════════════════════════════════════════
@media (max-width: 700px) {
  .panel-content {
    flex-direction: column;
    padding: 24px 20px;
  }
  
  .fish-photo-section {
    width: 100%;
    max-width: 280px;
  }
  
  .fish-name {
    font-size: 24px;
  }
  
  .catch-data-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .result-panel {
    width: 96%;
    max-height: 95vh;
  }
  
  .panel-content {
    padding: 20px 16px;
    gap: 16px;
  }
  
  .fish-photo-section {
    max-width: 220px;
  }
  
  .fish-name {
    font-size: 22px;
  }
  
  .catch-data-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  
  .data-card {
    padding: 10px;
  }
  
  .data-card__value {
    font-size: 14px;
  }
}

// 滚动条样式
.result-panel::-webkit-scrollbar {
  width: 6px;
}

.result-panel::-webkit-scrollbar-track {
  background: transparent;
}

.result-panel::-webkit-scrollbar-thumb {
  background: rgba(106, 90, 174, 0.3);
  border-radius: 3px;
  
  &:hover {
    background: rgba(106, 90, 174, 0.5);
  }
}
</style>
