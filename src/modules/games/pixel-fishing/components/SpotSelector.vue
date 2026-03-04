<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePixelFishingStore } from '../stores/pixelFishing'
import { SPOTS } from '../data/spots'

const store = usePixelFishingStore()
const { t } = useI18n()

const emit = defineEmits<{
  select: [spotId: string]
}>()

const UNLOCK_ALL_KEY = 'pixel-fishing-unlock-all'
const savedUnlockAll = localStorage.getItem(UNLOCK_ALL_KEY) === 'true'
const unlockAll = ref(savedUnlockAll)

watch(unlockAll, (val) => {
  localStorage.setItem(UNLOCK_ALL_KEY, String(val))
})

const spots = computed(() =>
  SPOTS.map(spot => ({
    ...spot,
    unlocked: unlockAll.value || store.state.unlockedSpotIds.includes(spot.id),
    progress: Math.min(store.totalCatch / spot.unlockCondition, 1)
  }))
)

function selectSpot(spotId: string) {
  const spot = spots.value.find(s => s.id === spotId)
  if (spot?.unlocked) {
    emit('select', spotId)
  }
}

const difficultyBlocks = (d: number) => d

const envEmoji: Record<string, string> = {
  stream: '🏞️',
  lake: '🌊',
  river: '⛰️',
  coast: '🌅',
  'deep-sea': '🔱'
}

const spotName = (id: string, fallback: string) => t(`pixelFishing.spots.${id}.name`, fallback)
const spotDesc = (id: string, fallback: string) => t(`pixelFishing.spots.${id}.desc`, fallback)
</script>

<template>
  <div class="spot-selector">
    <div class="spot-header">
      <h2 class="spot-title">
        <span class="title-icon">🎣</span>
        {{ t('pixelFishing.selector.title') }}
      </h2>
      <p class="spot-subtitle">
        {{ t('pixelFishing.selector.explored') }} {{ store.state.unlockedSpotIds.length }}/{{ SPOTS.length }}
      </p>
    </div>

    <div class="unlock-switch">
      <label class="switch-label">
        <input type="checkbox" v-model="unlockAll" class="switch-input" />
        <span class="switch-slider" />
        <span class="switch-text">{{ unlockAll ? t('pixelFishing.selector.unlockedAll') : t('pixelFishing.selector.unlockAll') }}</span>
      </label>
    </div>

    <div class="spot-grid">
      <div
        v-for="(spot, index) in spots"
        :key="spot.id"
        class="spot-card"
        :class="{
          'spot-card--locked': !spot.unlocked,
          'spot-card--unlocked': spot.unlocked
        }"
        :style="{ '--delay': `${index * 60}ms` }"
        @click="selectSpot(spot.id)"
      >
        <div class="card-scene-preview" :class="`scene--${spot.environmentType}`">
          <div class="scene-sky" />
          <div class="scene-water" />
          <div class="scene-ground" />
          <span class="scene-emoji">{{ envEmoji[spot.environmentType] || '🐟' }}</span>
        </div>

        <div class="card-body">
          <div class="card-name-row">
            <h3 class="card-name">{{ spotName(spot.id, spot.name) }}</h3>
            <div class="difficulty-dots">
              <span
                v-for="n in 5"
                :key="n"
                class="diff-dot"
                :class="{ 'diff-dot--active': n <= difficultyBlocks(spot.difficulty) }"
              />
            </div>
          </div>
          <p class="card-desc">{{ spotDesc(spot.id, spot.description) }}</p>
          <div class="card-tags">
            <span class="tag tag--fish">🐟 {{ spot.availableFishIds.length }} {{ t('pixelFishing.selector.species') }}</span>
            <span class="tag tag--diff">⚡ Lv.{{ spot.difficulty }}</span>
          </div>
        </div>

        <div v-if="!spot.unlocked" class="card-lock">
          <span class="lock-icon">🔒</span>
          <span class="lock-need">{{ t('pixelFishing.selector.unlockNeed') }} {{ spot.unlockCondition }} {{ t('pixelFishing.selector.fishCount') }}</span>
          <div class="lock-bar">
            <div class="lock-bar-fill" :style="{ width: `${spot.progress * 100}%` }" />
          </div>
          <span class="lock-progress">{{ store.totalCatch }}/{{ spot.unlockCondition }}</span>
        </div>

        <div v-if="spot.unlocked" class="card-enter">
          <span class="enter-arrow">▶</span>
        </div>
      </div>
    </div>

    <div class="stat-bar">
      <div class="stat-item">
        <span class="stat-icon">🐟</span>
        <span class="stat-label">{{ t('pixelFishing.selector.total') }}</span>
        <span class="stat-val">{{ store.totalCatch }}</span>
      </div>
      <div class="stat-divider" />
      <div class="stat-item">
        <span class="stat-icon">📖</span>
        <span class="stat-label">{{ t('pixelFishing.selector.journal') }}</span>
        <span class="stat-val">{{ store.caughtCount }}/{{ store.totalFishSpecies }}</span>
      </div>
      <div class="stat-divider" />
      <div class="stat-item">
        <span class="stat-icon">💰</span>
        <span class="stat-label">{{ t('pixelFishing.selector.coins') }}</span>
        <span class="stat-val">{{ store.coins }}</span>
      </div>
      <div class="stat-divider" />
      <div class="stat-item">
        <span class="stat-icon">⭐</span>
        <span class="stat-label">{{ t('pixelFishing.selector.level') }}</span>
        <span class="stat-val">Lv.{{ store.level }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
$primary: var(--color-primary);
$secondary: var(--color-secondary);
$accent: var(--color-accent);
$bg: var(--color-background);
$surface: var(--color-surface);
$text: var(--color-text);
$text-secondary: var(--color-text-secondary);
$border: var(--color-border);
$success: var(--color-success);

.spot-selector {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 20px;
  background: $bg;
  width: 100%;
  min-height: calc(100vh - 56px);
  overflow-y: auto;
}

.spot-header {
  text-align: center;
  margin-bottom: 20px;
}

.spot-title {
  font-size: 24px;
  font-weight: 700;
  color: $text;
  letter-spacing: 4px;
  margin-bottom: 6px;
}

.title-icon {
  display: inline-block;
  animation: bob 2s ease-in-out infinite;
}

@keyframes bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.spot-subtitle {
  font-size: 13px;
  color: $text-secondary;
}

.unlock-switch {
  margin-bottom: 20px;
}

.switch-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 8px 16px;
  background: $surface;
  border: 1px solid $border;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.switch-label:hover {
  border-color: $primary;
}

.switch-input {
  display: none;
}

.switch-slider {
  position: relative;
  width: 40px;
  height: 22px;
  background: $border;
  border-radius: 11px;
  transition: background 0.2s ease;
  
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    background: white;
    border-radius: 50%;
    transition: transform 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
}

.switch-input:checked + .switch-slider {
  background: $primary;
  
  &::after {
    transform: translateX(18px);
  }
}

.switch-text {
  font-size: 13px;
  color: $text-secondary;
}

.spot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
  width: 100%;
  max-width: 900px;
}

.spot-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: $surface;
  border: 1px solid $border;
  border-radius: 12px;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.15s, border-color 0.2s, box-shadow 0.2s;
  animation: card-enter 0.35s ease both;
  animation-delay: var(--delay);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  &--unlocked:hover {
    border-color: $primary;
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(16, 185, 129, 0.15);

    .card-enter {
      opacity: 1;
      transform: translateX(0);
    }

    .scene-emoji {
      transform: scale(1.1);
    }
  }

  &--locked {
    cursor: not-allowed;
    opacity: 0.85;
  }
}

@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
}

.card-scene-preview {
  position: relative;
  height: 70px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .scene-sky, .scene-water, .scene-ground {
    flex: 1;
  }
}

.scene--stream {
  .scene-sky { background: linear-gradient(180deg, #87CEEB, #E0F4FF); }
  .scene-water { background: linear-gradient(180deg, #5BA8C8, #3A7A98); }
  .scene-ground { background: #8B7355; flex: 0.25; }
}

.scene--lake {
  .scene-sky { background: linear-gradient(180deg, #B8A8D8, #D8C8E8); }
  .scene-water { background: linear-gradient(180deg, #4A8A9A, #2A5A6A); }
  .scene-ground { background: #5A7A5A; flex: 0.25; }
}

.scene--river {
  .scene-sky { background: linear-gradient(180deg, #A8C8D8, #C8E0E8); }
  .scene-water { background: linear-gradient(180deg, #4A8AA8, #2A5A78); }
  .scene-ground { background: #6A5A4A; flex: 0.25; }
}

.scene--coast {
  .scene-sky { background: linear-gradient(180deg, #FFB070, #FFD090); }
  .scene-water { background: linear-gradient(180deg, #3A7A98, #1A4A68); }
  .scene-ground { background: #B8A080; flex: 0.25; }
}

.scene--deep-sea {
  .scene-sky { background: linear-gradient(180deg, #1A1A3A, #2A2A4A); }
  .scene-water { background: linear-gradient(180deg, #0A1A2A, #050A10); }
  .scene-ground { background: #0A0A1A; flex: 0.25; }
}

.scene-emoji {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 24px;
  filter: drop-shadow(1px 1px 0 rgba(0, 0, 0, 0.2));
  transition: transform 0.2s;
}

.card-body {
  padding: 12px;
  flex: 1;
}

.card-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.card-name {
  font-size: 14px;
  font-weight: 600;
  color: $text;
  letter-spacing: 1px;
}

.difficulty-dots {
  display: flex;
  gap: 3px;
}

.diff-dot {
  width: 7px;
  height: 7px;
  background: $border;
  border-radius: 50%;

  &--active {
    background: $accent;
  }
}

.card-desc {
  font-size: 11px;
  color: $text-secondary;
  line-height: 1.5;
  margin-bottom: 8px;
}

.card-tags {
  display: flex;
  gap: 6px;
}

.tag {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  color: $text-secondary;
  background: rgba(0, 0, 0, 0.04);

  &--fish { color: $secondary; background: rgba(59, 130, 246, 0.1); }
  &--diff { color: $accent; background: rgba(245, 158, 11, 0.1); }
}

.card-lock {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(2px);
  z-index: 2;
}

.lock-icon {
  font-size: 24px;
}

.lock-need {
  font-size: 11px;
  color: $text-secondary;
}

.lock-bar {
  width: 80px;
  height: 6px;
  background: $border;
  border-radius: 3px;
  overflow: hidden;
}

.lock-bar-fill {
  height: 100%;
  background: $primary;
  transition: width 0.3s;
}

.lock-progress {
  font-size: 10px;
  color: $text-secondary;
}

.card-enter {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%) translateX(4px);
  opacity: 0;
  transition: opacity 0.2s, transform 0.2s;
  color: $primary;
  font-size: 14px;
}

.enter-arrow {
  animation: arrow-pulse 1s ease infinite;
}

@keyframes arrow-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.stat-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 24px;
  padding: 10px 16px;
  background: $surface;
  border: 1px solid $border;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  animation: slide-up 0.4s ease 0.3s both;
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(10px); }
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-icon {
  font-size: 13px;
}

.stat-label {
  font-size: 10px;
  color: $text-secondary;
}

.stat-val {
  font-size: 13px;
  font-weight: 600;
  color: $primary;
}

.stat-divider {
  width: 1px;
  height: 16px;
  background: $border;
  margin: 0 8px;
}
</style>
