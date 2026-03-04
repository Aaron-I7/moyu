<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePetStore } from './stores/pet'
import BaseButton from '@/components/common/BaseButton.vue'
import PetSelector from './components/PetSelector.vue'
import PetRoom from './components/PetRoom.vue'
import PetDisplay from './components/PetDisplay.vue'
import SpeechBubble from './components/SpeechBubble.vue'
import StatusBars from './components/StatusBars.vue'
import ActionPanel from './components/ActionPanel.vue'
import InteractionLog from './components/InteractionLog.vue'
import ConfirmModal from './components/ConfirmModal.vue'
import MoyuStats from './components/MoyuStats.vue'

const pet = usePetStore()
const { locale } = useI18n()
const isEn = computed(() => locale.value === 'en')
const showSelector = ref(!pet.type)
const showResetModal = ref(false)

const name = computed(() => pet.name)
const hunger = computed(() => pet.hunger)
const happiness = computed(() => pet.happiness)
const energy = computed(() => pet.energy)
const cleanliness = computed(() => pet.cleanliness)
const petState = computed(() => pet.petState)
const canFeed = computed(() => pet.canFeed)
const canPlay = computed(() => pet.canPlay)
const canPet = computed(() => pet.canPet)
const canSleep = computed(() => pet.canSleep)
const canBath = computed(() => pet.canBath)
const displayName = computed(() => {
  if (locale.value !== 'en') return name.value
  if (name.value === '小咪') return 'Mochi'
  if (name.value === '旺财') return 'Buddy'
  if (name.value === '雪球') return 'Snow'
  return name.value
})
const petTypeName = computed(() => {
  if (!pet.type) return ''
  if (locale.value === 'en') {
    if (pet.type === 'cat') return 'Cat'
    if (pet.type === 'dog') return 'Dog'
    return 'Rabbit'
  }
  return pet.petConfig.name
})
const workStatusText = computed(() => (pet.isWorkingHours ? (isEn.value ? 'Break Time' : '摸鱼中') : (isEn.value ? 'Rest Time' : '休息中')))

function handlePetSelect(type: string, customName: string) {
  pet.selectPet(type as any, customName)
  showSelector.value = false
  pet.startTimer()
}

function handleResetClick() {
  showResetModal.value = true
}

function confirmReset() {
  showResetModal.value = false
  pet.stopTimer()
  pet.reset()
  showSelector.value = true
}

function cancelReset() {
  showResetModal.value = false
}

onMounted(() => {
  if (!showSelector.value) {
    pet.startTimer()
  }
})

onUnmounted(() => pet.stopTimer())
</script>

<template>
  <div class="pet-page">
    <PetSelector v-if="showSelector" @select="handlePetSelect" />

    <div v-else class="pet-container">
      <div class="main-area">
        <header class="pet-header">
          <div class="pet-info">
            <h1 class="pet-name">{{ displayName }}</h1>
            <span class="pet-type">{{ petTypeName }}</span>
          </div>
          <div class="header-actions">
            <div class="moyu-status-badge" :class="{ working: pet.isWorkingHours }">
              <span class="status-icon">{{ pet.isWorkingHours ? '🐟' : '🌙' }}</span>
              <span class="status-text">{{ workStatusText }}</span>
            </div>
            <div class="day-badge">
              <span class="day-label">{{ isEn ? 'DAY' : '天数' }}</span>
              <span class="day-num">{{ Math.floor(pet.age / 6) + 1 }}</span>
            </div>
            <BaseButton
              :icon="true"
              class="reset-btn"
              @click="handleResetClick"
              :title="isEn ? 'Reselect Pet' : '重新选择宠物'"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
              </svg>
            </BaseButton>
          </div>
        </header>

        <PetRoom>
          <div class="speech-area">
            <SpeechBubble :state="petState" :pet-type="pet.type!" />
          </div>

          <div class="pet-area">
            <PetDisplay
              v-if="pet.type"
              :pet-type="pet.type"
              :state="petState"
              :color="pet.petConfig.color"
              :accent-color="pet.petConfig.accentColor"
              @tap="pet.petAction()"
            />
          </div>
        </PetRoom>

        <div class="status-section">
          <StatusBars
            :hunger="hunger"
            :happiness="happiness"
            :energy="energy"
            :cleanliness="cleanliness"
          />
        </div>

        <div class="action-section">
          <ActionPanel
            :pet-type="pet.type!"
            :can-feed="canFeed"
            :can-play="canPlay"
            :can-pet="canPet"
            :can-sleep="canSleep"
            :can-bath="canBath"
            :is-sleeping="pet.activeAction === 'sleeping'"
            @feed="pet.feed()"
            @play="pet.play()"
            @pet="pet.petAction()"
            @sleep="pet.sleep()"
            @wake-up="pet.wakeUp()"
            @bath="pet.bath()"
            @special="pet.specialAction()"
          />
        </div>
      </div>

      <aside class="side-panel">
        <MoyuStats :is-working="pet.isWorkingHours" />
        <InteractionLog :interactions="pet.recentInteractions" :count="pet.interactionCount" />
      </aside>
    </div>

    <ConfirmModal
      :visible="showResetModal"
      :title="isEn ? 'Reselect Pet' : '重新选择宠物'"
      :message="isEn ? 'Do you want to reselect your pet? Current data will be cleared.' : '确定要重新选择宠物吗？当前宠物的所有数据将被清除。'"
      @confirm="confirmReset"
      @cancel="cancelReset"
    />
  </div>
</template>

<style scoped lang="scss">
.pet-page {
  min-height: calc(100vh - 56px);
  padding: 24px;
  padding-top: 80px;
  background: var(--color-background);
  position: relative;
}

.pet-container {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.main-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.pet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: var(--color-surface);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  border: 1px solid var(--color-border);
}

.pet-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pet-name {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.pet-type {
  font-size: 14px;
  color: var(--color-primary);
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.moyu-status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--color-background);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);

  &.working {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border-color: transparent;
    animation: pulse 2s ease-in-out infinite;
  }
}

.status-icon {
  font-size: 16px;
}

.status-text {
  white-space: nowrap;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.day-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
  border-radius: var(--border-radius);
  font-weight: 700;
  box-shadow: var(--shadow);
}

.day-label {
  font-size: 10px;
  opacity: 0.9;
}

.day-num {
  font-size: 18px;
  line-height: 1;
}

.reset-btn {
  width: 44px;
  height: 44px;
}

.speech-area {
  display: flex;
  justify-content: center;
  padding-top: 16px;
}

.pet-area {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}

.status-section {
  flex-shrink: 0;
}

.action-section {
  flex-shrink: 0;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 900px) {
    order: -1;
  }
}
</style>
