<script setup lang="ts">
/**
 * 像素钓场 — 鱼类图鉴
 * 像素风暗色百科面板
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePixelFishingStore } from '../stores/pixelFishing'
import { FISH_DATA } from '../data/fish'
import { SPOTS } from '../data/spots'
import { RARITY_COLORS, RARITY_NAMES } from '../constants'

const emit = defineEmits<{
  close: []
}>()

const store = usePixelFishingStore()
const { t, locale } = useI18n()

type FilterTab = 'all' | 'stream' | 'lake' | 'river' | 'coast' | 'deep-sea'
const activeTab = ref<FilterTab>('all')
const selectedFish = ref<typeof filteredFish.value[0] | null>(null)

const tabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: t('pixelFishing.journal.all') },
  ...SPOTS.map(s => ({ key: s.id as FilterTab, label: t(`pixelFishing.spots.${s.id}.name`, s.name) }))
]

const filteredFish = computed(() => {
  let list = FISH_DATA
  if (activeTab.value !== 'all') {
    list = list.filter(f => f.spotIds.includes(activeTab.value))
  }
  return list.map(f => ({
    ...f,
    entry: store.state.journal[f.id],
    caught: store.state.journal[f.id]?.caught ?? false
  }))
})

const stats = computed(() => ({
  total: FISH_DATA.length,
  caught: store.caughtCount,
  pct: Math.round(store.journalProgress * 100)
}))

function formatWeight(w: number) {
  return w >= 1 ? `${w.toFixed(1)} kg` : `${(w * 1000).toFixed(0)} g`
}

function selectFish(fish: typeof filteredFish.value[0]) {
  if (fish.caught) {
    selectedFish.value = fish
  }
}

function closeDetail() {
  selectedFish.value = null
}

function handleImageError(event: Event) {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}

function openBaike(url: string | undefined) {
  if (url) {
    window.open(url, '_blank')
  }
}

function displayFishName(name: string, scientificName?: string): string {
  if (locale.value === 'en') {
    return scientificName || name
  }
  return name
}

function displayFishDesc(desc: string): string {
  if (locale.value === 'en') {
    return t('pixelFishing.journal.descFallback')
  }
  return desc
}

function displayFishMeta(label: 'habitat' | 'diet' | 'funFact', value?: string): string {
  if (!value) return ''
  if (locale.value !== 'en') return value
  if (label === 'habitat') return 'Localized habitat details are being prepared.'
  if (label === 'diet') return 'Localized diet details are being prepared.'
  return 'Localized fun facts are being prepared.'
}

function rarityLabel(rarity: keyof typeof RARITY_NAMES): string {
  if (locale.value !== 'en') return RARITY_NAMES[rarity] || 'Common'
  const map: Record<keyof typeof RARITY_NAMES, string> = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary'
  }
  return map[rarity] || 'Common'
}
</script>

<template>
  <div class="journal-overlay" @click="emit('close')">
    <div class="journal-panel" @click.stop>
      <!-- 头部 -->
      <div class="journal-header">
        <div class="header-left">
          <span class="header-icon">📖</span>
          <h2 class="journal-title">{{ t('pixelFishing.journal.title') }}</h2>
        </div>
        <div class="header-right">
          <span class="progress-text">
            {{ stats.caught }}<span class="progress-dim">/{{ stats.total }}</span>
          </span>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${stats.pct}%` }" />
          </div>
          <span class="progress-pct">{{ stats.pct }}%</span>
          <button class="close-btn" @click="emit('close')">✕</button>
        </div>
      </div>

      <!-- 筛选栏 -->
      <div class="journal-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- 鱼种列表 -->
      <div class="journal-grid">
        <div
          v-for="fish in filteredFish"
          :key="fish.id"
          class="fish-row"
          :class="{ 'fish-row--uncaught': !fish.caught, 'fish-row--selected': selectedFish?.id === fish.id }"
          @click="selectFish(fish)"
        >
          <div
            class="fish-icon-box"
            :style="{ borderColor: fish.caught ? RARITY_COLORS[fish.rarity] : '#2a3a4f' }"
          >
            <img
              v-if="fish.caught && fish.imageUrl"
              :src="fish.imageUrl"
              :alt="displayFishName(fish.name, fish.scientificName)"
              class="fish-img"
              @error="handleImageError"
            />
            <span v-else-if="fish.caught" class="fish-emoji">🐟</span>
            <span v-else class="fish-unknown">?</span>
          </div>
          <div class="fish-info">
            <div class="fish-name-row">
              <span class="fish-name">{{ fish.caught ? displayFishName(fish.name, fish.scientificName) : t('pixelFishing.journal.unknown') }}</span>
              <span
                v-if="fish.caught"
                class="fish-rarity"
                :style="{ color: RARITY_COLORS[fish.rarity] }"
              >
                {{ rarityLabel(fish.rarity) }}
              </span>
            </div>
            <template v-if="fish.caught && fish.entry">
              <p class="fish-desc">{{ displayFishDesc(fish.description) }}</p>
              <div class="fish-stats">
                <span>× {{ fish.entry.count }}</span>
                <span>📏 {{ fish.entry.maxSize?.toFixed(1) }} cm</span>
                <span>⚖ {{ formatWeight(fish.entry.maxWeight ?? 0) }}</span>
              </div>
            </template>
            <p v-else class="fish-not-caught">{{ t('pixelFishing.journal.notCaught') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 鱼类详情弹窗 -->
    <div
      v-if="selectedFish"
      class="detail-overlay"
      @click="closeDetail"
    >
      <div class="detail-panel" @click.stop>
        <button class="detail-close" @click="closeDetail">✕</button>
        
        <!-- 鱼类照片 -->
        <div class="detail-photo">
          <img
            v-if="selectedFish.imageUrl"
            :src="selectedFish.imageUrl"
            :alt="displayFishName(selectedFish.name, selectedFish.scientificName)"
            @error="handleImageError"
          />
        </div>

        <!-- 鱼类信息 -->
        <div class="detail-info">
          <h3 class="detail-name" :style="{ color: RARITY_COLORS[selectedFish.rarity] }">
            {{ displayFishName(selectedFish.name, selectedFish.scientificName) }}
          </h3>
          <p v-if="selectedFish.scientificName" class="detail-scientific">
            {{ selectedFish.scientificName }}
          </p>
          <p class="detail-desc">{{ displayFishDesc(selectedFish.description) }}</p>

          <div class="detail-stats">
            <div class="detail-stat">
              <span class="detail-stat__label">{{ t('pixelFishing.journal.rarity') }}</span>
              <span class="detail-stat__value" :style="{ color: RARITY_COLORS[selectedFish.rarity] }">
                {{ rarityLabel(selectedFish.rarity) }}
              </span>
            </div>
            <div class="detail-stat">
              <span class="detail-stat__label">{{ t('pixelFishing.journal.sizeRange') }}</span>
              <span class="detail-stat__value">{{ selectedFish.sizeRange[0] }}-{{ selectedFish.sizeRange[1] }} cm</span>
            </div>
            <div class="detail-stat">
              <span class="detail-stat__label">{{ t('pixelFishing.journal.weightRange') }}</span>
              <span class="detail-stat__value">{{ formatWeight(selectedFish.weightRange[0]) }} - {{ formatWeight(selectedFish.weightRange[1]) }}</span>
            </div>
            <div v-if="selectedFish.entry" class="detail-stat">
              <span class="detail-stat__label">{{ t('pixelFishing.journal.catchCount') }}</span>
              <span class="detail-stat__value">{{ selectedFish.entry.count }} {{ t('pixelFishing.journal.countUnit') }}</span>
            </div>
          </div>

          <div v-if="selectedFish.habitat || selectedFish.diet" class="detail-extra">
            <p v-if="selectedFish.habitat"><strong>{{ t('pixelFishing.journal.habitat') }}：</strong>{{ displayFishMeta('habitat', selectedFish.habitat) }}</p>
            <p v-if="selectedFish.diet"><strong>{{ t('pixelFishing.journal.diet') }}：</strong>{{ displayFishMeta('diet', selectedFish.diet) }}</p>
          </div>

          <p v-if="selectedFish.funFact" class="detail-funfact">
            💡 {{ displayFishMeta('funFact', selectedFish.funFact) }}
          </p>

          <button
            v-if="selectedFish.baikeUrl"
            class="detail-baike"
            @click="openBaike(selectedFish.baikeUrl)"
          >
            📖 {{ t('pixelFishing.journal.moreInfo') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
$fj-bg: rgba(15, 10, 31, 0.94);
$fj-border: rgba(106, 90, 174, 0.2);
$fj-text: #E2E0D8;
$fj-text-dim: rgba(226, 224, 216, 0.5);
$fj-accent: #C8A04A;
$fj-primary: #6A5AAE;
$fj-radius: 6px;

.journal-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;
  background: rgba(0, 0, 0, 0.55);
  animation: fade-in 0.2s ease;
}

@keyframes fade-in {
  from { opacity: 0; }
}

.journal-panel {
  width: 90%;
  max-width: 620px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  background: $fj-bg;
  border: 1px solid $fj-border;
  border-radius: $fj-radius;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.6);
  overflow: hidden;
  animation: panel-slide 0.3s ease;
  backdrop-filter: blur(6px);
}

@keyframes panel-slide {
  from { opacity: 0; transform: translateY(16px); }
}

// ── 头部 ──
.journal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid $fj-border;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 18px;
}

.journal-title {
  font-size: 16px;
  font-weight: 700;
  color: $fj-text;
  letter-spacing: 3px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-text {
  font-size: 14px;
  font-weight: 700;
  color: $fj-accent;
}

.progress-dim {
  color: $fj-text-dim;
  font-weight: 400;
}

.progress-bar {
  width: 50px;
  height: 6px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid $fj-border;
  border-radius: $fj-radius;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: $fj-accent;
  transition: width 0.3s;
}

.progress-pct {
  font-size: 11px;
  color: $fj-text-dim;
}

.close-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid $fj-border;
  border-radius: $fj-radius;
  color: $fj-text-dim;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
  margin-left: 4px;

  &:hover {
    color: $fj-text;
    border-color: $fj-accent;
  }
}

// ── 筛选栏 ──
.journal-tabs {
  display: flex;
  gap: 2px;
  padding: 8px 14px;
  overflow-x: auto;
  border-bottom: 1px solid $fj-border;
  flex-shrink: 0;
}

.tab-btn {
  padding: 5px 12px;
  font-size: 11px;
  font-weight: 600;
  font-family: inherit;
  color: $fj-text-dim;
  background: none;
  border: 1px solid transparent;
  border-radius: $fj-radius;
  cursor: pointer;
  white-space: nowrap;
  letter-spacing: 1px;
  transition: color 0.15s, border-color 0.15s;

  &--active {
    color: $fj-text;
    border-color: $fj-accent;
    background: rgba(200, 160, 74, 0.08);
  }

  &:hover:not(.tab-btn--active) {
    color: $fj-text;
  }
}

// ── 列表 ──
.journal-grid {
  flex: 1;
  overflow-y: auto;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.fish-row {
  display: flex;
  gap: 12px;
  padding: 8px 10px;
  border: 1px solid $fj-border;
  border-radius: $fj-radius;
  background: rgba(106, 90, 174, 0.05);
  transition: background 0.15s;

  &:hover {
    background: rgba(106, 90, 174, 0.1);
  }

  &--uncaught {
    opacity: 0.45;
  }
}

.fish-icon-box {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid $fj-border;
  border-radius: $fj-radius;
  font-size: 18px;
  overflow: hidden;
}

.fish-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fish-unknown {
  color: $fj-text-dim;
  font-weight: 700;
  font-size: 16px;
}

.fish-info {
  flex: 1;
  min-width: 0;
}

.fish-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.fish-name {
  font-size: 13px;
  font-weight: 700;
  color: $fj-text;
  letter-spacing: 1px;
}

.fish-rarity {
  font-size: 10px;
  letter-spacing: 0.5px;
}

.fish-desc {
  font-size: 10px;
  color: $fj-text-dim;
  line-height: 1.5;
  margin-bottom: 3px;
}

.fish-stats {
  display: flex;
  gap: 12px;
  font-size: 10px;
  color: $fj-text-dim;
}

.fish-not-caught {
  font-size: 11px;
  color: $fj-text-dim;
  opacity: 0.5;
  font-style: italic;
}

.fish-row--selected {
  background: rgba(200, 160, 74, 0.15);
  border-color: rgba(200, 160, 74, 0.3);
}

// ── 详情弹窗 ──
.detail-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  z-index: 40;
  animation: fade-in 0.2s ease;
}

.detail-panel {
  position: relative;
  width: 90%;
  max-width: 400px;
  max-height: 85vh;
  overflow-y: auto;
  background: $fj-bg;
  border: 1px solid $fj-border;
  border-radius: $fj-radius;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6);
  animation: panel-slide 0.3s ease;
}

.detail-close {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid $fj-border;
  border-radius: $fj-radius;
  color: $fj-text-dim;
  font-size: 14px;
  cursor: pointer;
  z-index: 1;

  &:hover {
    color: $fj-text;
    border-color: $fj-accent;
  }
}

.detail-photo {
  width: 100%;
  height: 200px;
  background: rgba(0, 0, 0, 0.3);
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.detail-info {
  padding: 16px;
}

.detail-name {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 2px;
  margin: 0 0 4px;
}

.detail-scientific {
  font-size: 12px;
  font-style: italic;
  color: $fj-text-dim;
  margin: 0 0 12px;
}

.detail-desc {
  font-size: 12px;
  color: $fj-text-dim;
  line-height: 1.6;
  margin: 0 0 16px;
  padding-left: 10px;
  border-left: 2px solid $fj-border;
}

.detail-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.detail-stat {
  padding: 10px;
  background: rgba(106, 90, 174, 0.08);
  border: 1px solid $fj-border;
  border-radius: $fj-radius;

  &__label {
    display: block;
    font-size: 10px;
    color: $fj-text-dim;
    margin-bottom: 4px;
  }

  &__value {
    font-size: 13px;
    font-weight: 600;
    color: $fj-text;
  }
}

.detail-extra {
  margin-bottom: 12px;
  font-size: 11px;
  color: $fj-text-dim;
  line-height: 1.6;

  p {
    margin: 4px 0;
  }

  strong {
    color: $fj-text;
  }
}

.detail-funfact {
  font-size: 11px;
  color: rgba(200, 160, 74, 0.9);
  line-height: 1.6;
  padding: 10px;
  background: rgba(200, 160, 74, 0.08);
  border: 1px solid rgba(200, 160, 74, 0.2);
  border-radius: $fj-radius;
  margin: 0 0 12px;
}

.detail-baike {
  width: 100%;
  padding: 10px;
  background: rgba(106, 90, 174, 0.15);
  border: 1px solid rgba(106, 90, 174, 0.3);
  border-radius: $fj-radius;
  color: $fj-text;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(106, 90, 174, 0.25);
    border-color: rgba(106, 90, 174, 0.5);
  }
}
</style>
