<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref, computed, watch } from 'vue'
import { useSoundEngine } from '../composables/useSoundEngine'
import { usePomodoro } from '../composables/usePomodoro'
import { useI18n } from 'vue-i18n'
import type { SoundCategory } from '../types'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const soundEngine = useSoundEngine()
const { settings, saveSettings } = usePomodoro()
const { t } = useI18n({ useScope: 'global' })

const categories = computed(() => [
  { id: 'mixes', label: t('whiteNoise.categories.mixes'), icon: 'mdi:playlist-music' },
  { id: 'animals', label: t('whiteNoise.categories.animals'), icon: 'mdi:paw' },
  { id: 'nature', label: t('whiteNoise.categories.nature'), icon: 'mdi:pine-tree' },
  { id: 'rain', label: t('whiteNoise.categories.rain'), icon: 'mdi:weather-rainy' },
  { id: 'urban', label: t('whiteNoise.categories.urban'), icon: 'mdi:city' },
  { id: 'places', label: t('whiteNoise.categories.places'), icon: 'mdi:map-marker' },
  { id: 'transport', label: t('whiteNoise.categories.transport'), icon: 'mdi:train' },
  { id: 'things', label: t('whiteNoise.categories.things'), icon: 'mdi:cube-outline' },
  { id: 'noise', label: t('whiteNoise.categories.noise'), icon: 'mdi:blur' },
  { id: 'help', label: t('whiteNoise.categories.help'), icon: 'mdi:help-circle-outline' },
]) as any

const activeCategory = ref<SoundCategory | 'mixes' | 'help'>('animals')
const newMixName = ref('')
const showSaveInput = ref(false)
const mixToDelete = ref<string | null>(null)
const showActiveSoundsDropdown = ref(false)

// 监听弹窗打开，如果打开时有 active 但未播放的声音，自动恢复播放
// 这解决了在“后台播放”关闭时，离开页面声音停止，但在其他页面打开全局混合器时显示 active 但无声的问题
watch(() => props.show, (val) => {
  if (val) {
    soundEngine.fadeInAll()
  }
})

const filteredSounds = computed(() => {
  if (['mixes', 'help'].includes(activeCategory.value)) return []
  return soundEngine.sounds.filter(s => s.category === activeCategory.value)
})

const activeSounds = computed(() => {
  return soundEngine.sounds.filter(s => s.active)
})

const activeSoundsCount = computed(() => {
  return activeSounds.value.length
})

const isGlobalPlaybackVisible = computed(() => {
  return activeSoundsCount.value > 0 || settings.value.allowGlobalPlayback
})

const handleSoundClick = (id: string) => {
  soundEngine.toggleSound(id)
}

const handleSaveMix = () => {
  if (!newMixName.value.trim()) return
  soundEngine.saveMix(newMixName.value)
  newMixName.value = ''
  showSaveInput.value = false
}

const confirmDeleteMix = () => {
  if (mixToDelete.value) {
    soundEngine.deleteMix(mixToDelete.value)
    mixToDelete.value = null
  }
}

const handleStopAll = () => {
  soundEngine.stopAll(true)
}

const toggleGlobalPlayback = () => {
  settings.value.allowGlobalPlayback = !settings.value.allowGlobalPlayback
  saveSettings()
}
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="modal-overlay" @click="emit('close')">
      <div class="modal-content" @click.stop>
        <header>
          <div class="header-title">
            <h3>{{ t('whiteNoise.title') }}</h3>
            <div class="active-badge-wrapper" v-if="activeSoundsCount > 0">
              <button class="active-badge" @click="showActiveSoundsDropdown = !showActiveSoundsDropdown">
                {{ activeSoundsCount }} active
                <Icon :icon="showActiveSoundsDropdown ? 'mdi:chevron-up' : 'mdi:chevron-down'" width="16" />
              </button>
              
              <Transition name="fade">
                <div v-if="showActiveSoundsDropdown" class="active-sounds-dropdown">
                  <div v-for="sound in activeSounds" :key="sound.id" class="active-sound-item">
                    <span class="sound-name">{{ t('whiteNoise.sounds.' + sound.id, sound.label) }}</span>
                    <button class="remove-btn" @click="handleSoundClick(sound.id)">
                      <Icon icon="mdi:close" width="16" />
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
          <div class="header-actions">
            <button 
              v-if="isGlobalPlaybackVisible"
              class="global-playback-btn"
              :class="{ active: settings.allowGlobalPlayback }"
              @click="toggleGlobalPlayback"
              :title="t('whiteNoise.settings.globalPlaybackDesc')"
            >
              <Icon :icon="settings.allowGlobalPlayback ? 'mdi:play-circle' : 'mdi:play-circle-outline'" width="20" />
              <span>{{ t('whiteNoise.settings.globalPlayback') }}</span>
            </button>
            <button 
              v-if="activeSoundsCount > 0"
              class="stop-all-btn" 
              @click="handleStopAll"
              :title="t('whiteNoise.stopAll')"
            >
              <Icon icon="mdi:stop" width="20" />
              <span>{{ t('whiteNoise.stopAll') }}</span>
            </button>
            <button class="close-btn" @click="emit('close')">
              <Icon icon="mdi:close" width="24" />
            </button>
          </div>
        </header>

        <div class="modal-body">
          <aside class="sidebar">
            <div 
              v-for="cat in categories" 
              :key="cat.id"
              class="category-item"
              :class="{ active: activeCategory === cat.id }"
              @click="activeCategory = cat.id"
            >
              <Icon :icon="cat.icon" width="20" />
              <span>{{ cat.label }}</span>
            </div>
          </aside>

          <main class="main-content">
            <!-- Mixes View -->
            <div v-if="activeCategory === 'mixes'" class="mixes-view">
              <div class="mixes-header">
                <h4>{{ t('whiteNoise.mixes.title') }}</h4>
                <button 
                  v-if="!showSaveInput"
                  class="save-btn" 
                  :disabled="activeSoundsCount === 0"
                  @click="showSaveInput = true"
                >
                  <Icon icon="mdi:plus" width="18" />
                  {{ t('whiteNoise.mixes.saveCurrent') }}
                </button>
              </div>

              <div v-if="showSaveInput" class="save-input-group">
                <input 
                  v-model="newMixName" 
                  type="text" 
                  :placeholder="t('whiteNoise.mixes.placeholder')"
                  @keyup.enter="handleSaveMix"
                  autoFocus
                />
                <button class="confirm-btn" @click="handleSaveMix">{{ t('whiteNoise.mixes.save') }}</button>
                <button class="cancel-btn" @click="showSaveInput = false">{{ t('whiteNoise.mixes.cancel') }}</button>
              </div>

              <div class="mix-list">
                <div v-if="soundEngine.savedMixes.value.length === 0" class="empty-state">
                  <Icon icon="mdi:playlist-remove" width="48" />
                  <p>{{ t('whiteNoise.mixes.empty') }}</p>
                  <p class="sub">{{ t('whiteNoise.mixes.emptySub') }}</p>
                </div>

                <div 
                  v-for="mix in soundEngine.savedMixes.value" 
                  :key="mix.id" 
                  class="mix-card"
                >
                  <div class="mix-info">
                    <span class="mix-name">{{ mix.name }}</span>
                    <span class="mix-details">{{ mix.sounds.length }} sounds</span>
                  </div>
                  <div class="mix-actions">
                    <button class="play-btn" @click="soundEngine.loadMix(mix.id)" :title="t('whiteNoise.mixes.load')">
                      <Icon icon="mdi:play" width="20" />
                    </button>
                    <button class="delete-btn" @click="mixToDelete = mix.id" :title="t('whiteNoise.mixes.delete')">
                      <Icon icon="mdi:delete-outline" width="18" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Help View -->
            <div v-else-if="activeCategory === 'help'" class="help-view">
              <h4>{{ t('whiteNoise.help.title') }}</h4>
              <div class="help-section">
                <div class="help-item">
                  <Icon icon="mdi:cursor-default-click" width="24" />
                  <div>
                    <h5>{{ t('whiteNoise.help.toggleTitle') }}</h5>
                    <p>{{ t('whiteNoise.help.toggleDesc') }}</p>
                  </div>
                </div>
                <div class="help-item">
                  <Icon icon="mdi:volume-high" width="24" />
                  <div>
                    <h5>{{ t('whiteNoise.help.volumeTitle') }}</h5>
                    <p>{{ t('whiteNoise.help.volumeDesc') }}</p>
                  </div>
                </div>
                <div class="help-item">
                  <Icon icon="mdi:content-save" width="24" />
                  <div>
                    <h5>{{ t('whiteNoise.help.saveTitle') }}</h5>
                    <p>{{ t('whiteNoise.help.saveDesc') }}</p>
                  </div>
                </div>
                <div class="help-item">
                  <Icon icon="mdi:stop" width="24" />
                  <div>
                    <h5>{{ t('whiteNoise.help.globalTitle') }}</h5>
                    <p>{{ t('whiteNoise.help.globalDesc') }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sounds Grid View -->
            <div v-else class="sound-grid">
              <div 
                v-for="sound in filteredSounds" 
                :key="sound.id" 
                class="sound-card"
                :class="{ active: sound.active }"
                @click="handleSoundClick(sound.id)"
              >
                <div class="icon-wrapper">
                  <Icon :icon="sound.icon" width="32" />
                </div>
                <span class="sound-label">{{ t('whiteNoise.sounds.' + sound.id) }}</span>
                
                <div class="volume-control" @click.stop>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01"
                    :value="sound.volume"
                    :disabled="!sound.active"
                    @input="soundEngine.setVolume(sound.id, Number(($event.target as HTMLInputElement).value))"
                  />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <Transition name="fade">
        <div v-if="mixToDelete" class="confirm-overlay" @click.stop>
          <div class="confirm-modal">
            <h4>{{ t('whiteNoise.mixes.confirmTitle') }}</h4>
            <p>{{ t('whiteNoise.mixes.confirmMessage') }}</p>
            <div class="confirm-actions">
              <button class="cancel-btn" @click="mixToDelete = null">{{ t('whiteNoise.mixes.cancel') }}</button>
              <button class="delete-btn" @click="confirmDeleteMix">{{ t('whiteNoise.mixes.delete') }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(4px);
  padding: 20px;
}

.modal-content {
  background: var(--color-surface);
  width: 100%;
  max-width: 900px;
  height: 80vh;
  border-radius: 24px;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  z-index: 10;
  
  .header-title {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: var(--color-text);
  }
}

.active-badge-wrapper {
  position: relative;
}

.active-badge {
  background: var(--color-primary);
  color: white;
  font-size: 12px;
  padding: 4px 8px 4px 12px;
  border-radius: 12px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
}

.active-sounds-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 8px;
  min-width: 200px;
  box-shadow: var(--shadow-lg);
  z-index: 20;
  max-height: 300px;
  overflow-y: auto;

  .active-sound-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-radius: 8px;
    
    &:hover {
      background: var(--color-background);
    }

    .sound-name {
      font-size: 13px;
      color: var(--color-text);
      font-weight: 500;
    }

    .remove-btn {
      background: none;
      border: none;
      color: var(--color-text-secondary);
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
      }
    }
  }
}

.global-playback-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--color-background);
    color: var(--color-text);
  }

  &.active {
    background: color-mix(in srgb, var(--color-primary) 10%, transparent);
    color: var(--color-primary);
    border-color: var(--color-primary);
  }
}

.stop-all-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #ef4444;
    color: white;
  }
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s;
  
  &:hover {
    background: var(--color-background);
    color: var(--color-text);
  }
}

.modal-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 200px;
  background: var(--color-background);
  border-right: 1px solid var(--color-border);
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;

  .category-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    color: var(--color-text-secondary);
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;

    &:hover {
      background: var(--color-surface);
      color: var(--color-text);
    }

    &.active {
      background: color-mix(in srgb, var(--color-primary) 10%, transparent);
      color: var(--color-primary);
    }
  }
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.sound-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}

.sound-card {
  position: relative;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;

  &:hover {
    transform: translateY(-2px);
    border-color: var(--color-primary);
    box-shadow: var(--shadow-sm);
  }

  &.active {
    background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
    border-color: var(--color-primary);
    
    .icon-wrapper {
      color: var(--color-primary);
      transform: scale(1.1);
    }
    
    .sound-label {
      color: var(--color-primary);
      font-weight: 600;
    }
    
    .volume-control {
      opacity: 1;
      pointer-events: auto;
    }
  }
}

.icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  transition: all 0.3s ease;
  box-shadow: inset 0 0 0 1px var(--color-border);
}

.sound-label {
  font-size: 14px;
  color: var(--color-text-secondary);
  text-align: center;
  transition: color 0.2s;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.volume-control {
  width: 100%;
  height: 24px;
  display: flex;
  align-items: center;
  opacity: 0.3;
  pointer-events: none;
  transition: opacity 0.2s;

  input[type="range"] {
    width: 100%;
    height: 4px;
    background: var(--color-border);
    border-radius: 2px;
    outline: none;
    appearance: none;
    cursor: pointer;
    
    &::-webkit-slider-thumb {
      appearance: none;
      width: 16px;
      height: 16px;
      background: var(--color-primary);
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      transition: transform 0.1s;
      
      &:hover {
        transform: scale(1.2);
      }
    }
  }
}

/* Mixes View Styles */
.mixes-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.mixes-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h4 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }
}

.save-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.2s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    opacity: 0.9;
  }
}

.save-input-group {
  display: flex;
  gap: 8px;
  background: var(--color-background);
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--color-border);

  input {
    flex: 1;
    background: transparent;
    border: 1px solid var(--color-border);
    padding: 8px 12px;
    border-radius: 6px;
    color: var(--color-text);

    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }
  }

  button {
    padding: 6px 16px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-weight: 500;
  }

  .confirm-btn {
    background: var(--color-primary);
    color: white;
  }

  .cancel-btn {
    background: transparent;
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: var(--color-text-secondary);
  text-align: center;
  background: var(--color-background);
  border-radius: 16px;
  border: 1px dashed var(--color-border);

  .sub {
    font-size: 14px;
    opacity: 0.8;
    margin-top: 4px;
  }
}

.mix-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mix-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  transition: all 0.2s;

  &:hover {
    border-color: var(--color-primary);
  }

  .mix-name {
    font-weight: 600;
    color: var(--color-text);
    display: block;
  }

  .mix-details {
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  .mix-actions {
    display: flex;
    gap: 8px;

    button {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .play-btn {
      background: color-mix(in srgb, var(--color-primary) 10%, transparent);
      color: var(--color-primary);

      &:hover {
        background: var(--color-primary);
        color: white;
      }
    }

    .delete-btn {
      background: transparent;
      color: var(--color-text-secondary);

      &:hover {
        background: rgba(255, 0, 0, 0.1);
        color: #ef4444;
      }
    }
  }
}

/* Settings View Styles - Removed */

/* Help View Styles */
.help-view {
  padding: 0 12px;
  
  h4 {
    font-size: 20px;
    margin-bottom: 24px;
    color: var(--color-text);
  }
}

.help-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.help-item {
  display: flex;
  gap: 16px;
  background: var(--color-background);
  padding: 20px;
  border-radius: 16px;
  border: 1px solid var(--color-border);

  svg {
    color: var(--color-primary);
    flex-shrink: 0;
  }

  h5 {
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text);
  }

  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: var(--color-text-secondary);
  }
}

/* Confirm Overlay */
.confirm-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.confirm-modal {
  background: var(--color-surface);
  padding: 24px;
  border-radius: 16px;
  width: 90%;
  max-width: 320px;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border);
  animation: pop-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);

  h4 {
    margin: 0 0 12px 0;
    font-size: 18px;
    color: var(--color-text);
  }

  p {
    margin: 0 0 24px 0;
    font-size: 14px;
    line-height: 1.5;
    color: var(--color-text-secondary);
  }
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  button {
    padding: 8px 16px;
    border-radius: 8px;
    border: none;
    font-weight: 500;
    cursor: pointer;
    font-size: 14px;
  }

  .cancel-btn {
    background: transparent;
    color: var(--color-text);
    border: 1px solid var(--color-border);

    &:hover {
      background: var(--color-background);
    }
  }

  .delete-btn {
    background: #ef4444;
    color: white;

    &:hover {
      opacity: 0.9;
    }
  }
}

@keyframes pop-in {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
  
  .modal-content {
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  
  .modal-content {
    transform: scale(0.95) translateY(10px);
  }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .modal-body {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
    padding: 12px;

    .category-item {
      white-space: nowrap;
      flex-shrink: 0;
    }
  }
  
  .modal-content {
    height: 90vh;
  }
}
</style>
