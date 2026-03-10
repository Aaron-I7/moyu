<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import { useSoundEngine } from '../composables/useSoundEngine'
import type { SoundCategory } from '../types'

defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { t } = useI18n({ useScope: 'global' })
const soundEngine = useSoundEngine()
const activeCategory = ref<SoundCategory>('animals')
const enabledExpanded = ref(false)
const favoritesExpanded = ref(true)

const categories = computed<Array<{ id: SoundCategory; icon: string }>>(() => [
  { id: 'animals', icon: 'mdi:paw' },
  { id: 'nature', icon: 'mdi:pine-tree' },
  { id: 'rain', icon: 'mdi:weather-rainy' },
  { id: 'urban', icon: 'mdi:city' },
  { id: 'places', icon: 'mdi:map-marker' },
  { id: 'transport', icon: 'mdi:train' },
  { id: 'things', icon: 'mdi:cube-outline' },
  { id: 'noise', icon: 'mdi:blur' }
])

const filteredSounds = computed(() => {
  return soundEngine.sounds.filter(sound => sound.category === activeCategory.value)
})

const activeSoundsCount = computed(() => {
  return soundEngine.sounds.filter(sound => sound.active).length
})

const activeSounds = computed(() => {
  return soundEngine.sounds.filter(sound => sound.active)
})

const favorites = computed(() => {
  return soundEngine.favoriteMixes.value
})

const activeFingerprint = computed(() => {
  return soundEngine.createFingerprint(soundEngine.getActiveMixSounds())
})

const isFavorited = computed(() => {
  return favorites.value.some((m) => m.fingerprint === activeFingerprint.value)
})

const toggleSound = (id: string) => {
  soundEngine.toggleSound(id)
}

const toggleFavorite = () => {
  soundEngine.toggleFavoriteCurrentMix()
}

const loadFavorite = (id: string) => {
  soundEngine.loadFavoriteMix(id)
}

const deleteFavorite = (id: string) => {
  soundEngine.deleteFavoriteMix(id)
}

const formatFavoriteName = (mix: any) => {
  if (mix.name && String(mix.name).trim()) return String(mix.name)
  if (typeof mix.createdAt === 'number') {
    const d = new Date(mix.createdAt)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mi = String(d.getMinutes()).padStart(2, '0')
    return t('whiteNoise.favoriteDefaultName', { date: `${mm}-${dd} ${hh}:${mi}` })
  }
  return t('whiteNoise.favoriteDefaultName', { date: '--' })
}

const stopAll = () => {
  soundEngine.stopAll(true)
}

const playRandom = () => {
  const count = Math.floor(Math.random() * 5) + 1
  soundEngine.playRandomSounds(count)
}

const getCategoryActiveCount = (categoryId: SoundCategory) => {
  return soundEngine.sounds.filter(s => s.category === categoryId && s.active).length
}
</script>

<template>
  <Transition name="drawer">
    <section v-if="show" class="noise-drawer" @click.stop>
      <header class="drawer-header">
        <div class="drawer-title">
          <h3>{{ t('whiteNoise.title') }}</h3>
          <span class="active-count">{{ t('pomodoro.focus.activeSounds', { count: activeSoundsCount }) }}</span>
        </div>
        <div class="drawer-actions">
          <button class="fav-btn" :class="{ active: isFavorited }" :title="t('whiteNoise.favorites')" @click="toggleFavorite">
            <Icon :icon="isFavorited ? 'mdi:heart' : 'mdi:heart-outline'" width="18" />
          </button>
          <button class="stop-btn" @click="stopAll">{{ t('whiteNoise.stopAll') }}</button>
          <button class="close-btn" :title="t('common.close')" @click="emit('close')">
            <Icon icon="mdi:close" width="18" />
          </button>
        </div>
      </header>

      <div class="drawer-body">
        <aside class="drawer-sidebar">
          <div class="random-panel sidebar-panel">
            <button class="random-btn" @click="playRandom">
              <Icon icon="mdi:shuffle-variant" width="18" />
              <span>{{ t('whiteNoise.randomPlay') }}</span>
            </button>
          </div>

          <div class="sidebar-divider"></div>

          <div class="category-title">{{ t('whiteNoise.categoriesTitle') }}</div>
          <button
            v-for="cat in categories"
            :key="cat.id"
            class="category-btn"
            :class="{ active: activeCategory === cat.id }"
            @click="activeCategory = cat.id"
          >
            <span class="category-left">
              <Icon :icon="cat.icon" width="18" />
              <span>{{ t(`whiteNoise.categories.${cat.id}`) }}</span>
            </span>
            <span v-if="getCategoryActiveCount(cat.id) > 0" class="category-badge">{{ getCategoryActiveCount(cat.id) }}</span>
          </button>

          <div class="sidebar-divider"></div>

          <div class="favorites-panel sidebar-panel">
            <button class="favorites-toggle" @click="favoritesExpanded = !favoritesExpanded">
              <span class="favorites-left">
                <Icon icon="mdi:heart-outline" width="18" />
                <span class="favorites-title">{{ t('whiteNoise.favorites') }}</span>
              </span>
              <span class="favorites-right">
                <span class="favorites-badge">{{ favorites.length }}</span>
                <Icon :icon="favoritesExpanded ? 'mdi:chevron-up' : 'mdi:chevron-down'" width="18" />
              </span>
            </button>
            <div v-show="favoritesExpanded" class="favorites-list">
              <div v-if="favorites.length === 0" class="favorites-empty">{{ t('whiteNoise.favoritesEmpty') }}</div>
              <button v-for="mix in favorites" v-else :key="mix.id" class="favorite-row" @click="loadFavorite(mix.id)">
                <span class="favorite-name">{{ formatFavoriteName(mix) }}</span>
                <span class="favorite-actions" @click.stop>
                  <button class="favorite-icon" :title="t('whiteNoise.playFavorite')" @click="loadFavorite(mix.id)">
                    <Icon icon="mdi:play" width="16" />
                  </button>
                  <button class="favorite-icon danger" :title="t('whiteNoise.removeFavorite')" @click="deleteFavorite(mix.id)">
                    <Icon icon="mdi:trash-can-outline" width="16" />
                  </button>
                </span>
              </button>
            </div>
          </div>

          <div v-if="activeSoundsCount > 0" class="enabled-panel sidebar-panel">
            <button class="enabled-toggle" @click="enabledExpanded = !enabledExpanded">
              <span class="enabled-left">
                <Icon icon="mdi:check-circle-outline" width="18" />
                <span class="enabled-title">{{ t('whiteNoise.enabled') }}</span>
              </span>
              <span class="enabled-right">
                <span class="enabled-badge">{{ activeSoundsCount }}</span>
                <Icon :icon="enabledExpanded ? 'mdi:chevron-up' : 'mdi:chevron-down'" width="18" />
              </span>
            </button>
            <div v-show="enabledExpanded" class="enabled-list">
              <label v-for="sound in activeSounds" :key="sound.id" class="enabled-item">
                <input
                  type="checkbox"
                  :checked="sound.active"
                  @change="toggleSound(sound.id)"
                >
                <span class="enabled-name">{{ t(`whiteNoise.sounds.${sound.id}`, sound.label) }}</span>
              </label>
            </div>
          </div>
        </aside>

        <div class="drawer-main">
          <div class="sound-list">
            <button
              v-for="sound in filteredSounds"
              :key="sound.id"
              class="sound-row"
              :class="{ active: sound.active }"
              @click="toggleSound(sound.id)"
            >
              <span class="row-left">
                <span class="row-icon">
                  <Icon :icon="sound.icon" width="18" />
                </span>
                <span class="row-label">{{ t(`whiteNoise.sounds.${sound.id}`, sound.label) }}</span>
              </span>

              <span class="row-right" @click.stop>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  :value="sound.volume"
                  :disabled="!sound.active"
                  @input="soundEngine.setVolume(sound.id, Number(($event.target as HTMLInputElement).value))"
                />
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  </Transition>
</template>

<style scoped lang="scss">
.noise-drawer {
  position: fixed;
  z-index: 120;
  right: 16px;
  top: 16px;
  bottom: 16px;
  width: min(560px, calc(100vw - 20px));
  overflow: hidden;
  background: rgba(7, 10, 20, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  backdrop-filter: blur(12px);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
}

.drawer-body {
  display: flex;
  gap: 12px;
  flex: 1;
  min-height: 0;
}

.drawer-sidebar {
  width: 220px;
  flex: 0 0 220px;
  padding: 10px 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.sidebar-panel {
  width: 100%;
}

.random-btn {
  width: 100%;
  border: none;
  background: rgba(20, 184, 166, 0.12);
  color: rgba(167, 243, 208, 0.95);
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  border-radius: 14px;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(20, 184, 166, 0.2);
  }
}

.random-panel {
  border: none;
  background: transparent;
}

.category-title {
  margin-top: 4px;
  padding: 0 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.58);
}

.sidebar-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 8px 4px;
}

.drawer-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.fav-btn {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.86);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &.active {
    background: rgba(239, 68, 68, 0.16);
    border-color: rgba(239, 68, 68, 0.38);
    color: rgba(252, 165, 165, 0.95);
  }
}

.drawer-title {
  display: flex;
  align-items: center;
  gap: 10px;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #fff;
  }
}

.active-count {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.82);
  background: rgba(255, 255, 255, 0.12);
}

.stop-btn {
  border: none;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  background: rgba(239, 68, 68, 0.18);
  color: #fca5a5;
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.86);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.category-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.76);
  border-radius: 12px;
  padding: 10px 10px;
  font-size: 12px;
  cursor: pointer;
  text-align: left;

  &.active {
    background: rgba(20, 184, 166, 0.18);
    border-color: rgba(20, 184, 166, 0.6);
    color: rgba(167, 243, 208, 0.95);
  }
}

.category-left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.category-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  font-size: 11px;
  background: rgba(20, 184, 166, 0.2);
  color: rgba(167, 243, 208, 0.95);
}

.drawer-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.favorites-panel {
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  overflow: hidden;
}

.favorites-toggle {
  width: 100%;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.favorites-left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.favorites-title {
  font-size: 13px;
  font-weight: 600;
}

.favorites-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.72);
}

.favorites-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 12px;
  background: rgba(239, 68, 68, 0.14);
  color: rgba(252, 165, 165, 0.95);
}

.favorites-list {
  padding: 8px 12px 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 132px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.24) transparent;
}

.favorites-list::-webkit-scrollbar {
  width: 8px;
}

.favorites-list::-webkit-scrollbar-track {
  background: transparent;
}

.favorites-list::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  border: 2px solid transparent;
  background-clip: padding-box;
}

.favorites-empty {
  padding: 8px 6px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}

.favorite-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
  color: rgba(255, 255, 255, 0.86);
  text-align: left;
}

.favorite-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  line-height: 1.25;
  font-size: 13px;
}

.favorite-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.favorite-icon {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.86);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &.danger {
    background: rgba(239, 68, 68, 0.14);
    border-color: rgba(239, 68, 68, 0.28);
    color: rgba(252, 165, 165, 0.95);
  }
}

.enabled-panel {
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  overflow: hidden;
}

.enabled-toggle {
  width: 100%;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.enabled-left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.enabled-title {
  font-size: 13px;
  font-weight: 600;
}

.enabled-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.72);
}

.enabled-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 12px;
  background: rgba(20, 184, 166, 0.18);
  color: rgba(167, 243, 208, 0.95);
}

.enabled-list {
  padding: 8px 12px 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 128px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.24) transparent;
}

.enabled-list::-webkit-scrollbar {
  width: 8px;
}

.enabled-list::-webkit-scrollbar-track {
  background: transparent;
}

.enabled-list::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  border: 2px solid transparent;
  background-clip: padding-box;
}

.enabled-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.84);
  font-size: 13px;
  cursor: pointer;
}

.enabled-item input[type="checkbox"] {
  width: 14px;
  height: 14px;
}

.enabled-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  line-height: 1.25;
}

.sound-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 6px;
  padding-bottom: 10px;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.28) transparent;
}

.sound-list::-webkit-scrollbar {
  width: 8px;
}

.sound-list::-webkit-scrollbar-track {
  background: transparent;
}

.sound-list::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.26);
  border: 2px solid transparent;
  background-clip: padding-box;
}

.sound-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
  background-clip: padding-box;
}

.sound-row {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.86);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;

  &.active {
    border-color: rgba(20, 184, 166, 0.7);
    background: rgba(20, 184, 166, 0.16);
  }
}

.row-left {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.row-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.9);
  flex: 0 0 32px;
}

.row-label {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-right {
  width: 140px;
  flex: 0 0 140px;
}

.row-right input[type="range"] {
  width: 100%;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.24s ease, opacity 0.2s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
  transform: translateX(18px);
}
</style>
