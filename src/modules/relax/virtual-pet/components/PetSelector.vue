<template>
  <div class="pet-selector">
    <div class="selector-content">
      <header class="selector-header">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
            <path d="M4.5 9.5C3.67 9.5 3 8.83 3 8s.67-1.5 1.5-1.5S6 7.17 6 8s-.67 1.5-1.5 1.5zm5-2C8.67 7.5 8 6.83 8 6s.67-1.5 1.5-1.5S11 5.17 11 6s-.67 1.5-1.5 1.5zm5 0C13.67 7.5 13 6.83 13 6s.67-1.5 1.5-1.5S16 5.17 16 6s-.67 1.5-1.5 1.5zm5 2C18.67 9.5 18 8.83 18 8s.67-1.5 1.5-1.5S21 7.17 21 8s-.67 1.5-1.5 1.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-.29.02-.58.05-.86 2.36-1.05 4.23-2.98 5.21-5.37C11.07 8.33 14.05 10 17.42 10c.78 0 1.53-.09 2.25-.26.21.71.33 1.47.33 2.26 0 4.42-3.58 8-8 8z"/>
          </svg>
        </div>
        <h1 class="title">选择你的伙伴</h1>
        <p class="subtitle">选择一只可爱的宠物开始陪伴之旅</p>
      </header>

      <div class="pet-grid">
        <button
          v-for="pet in petOptions"
          :key="pet.type"
          class="pet-card"
          :class="{ selected: selectedPet === pet.type }"
          @click="selectPet(pet.type)"
        >
          <div class="pet-preview">
            <component
              :is="pet.component"
              state="happy"
              :color="pet.color"
              :accent-color="pet.accentColor"
            />
          </div>
          <div class="pet-info">
            <span class="pet-name">{{ pet.defaultName }}</span>
            <span class="pet-type-label">{{ pet.label }}</span>
          </div>
          <div class="pet-traits">
            <span v-for="trait in pet.traits" :key="trait" class="trait-tag">{{ trait }}</span>
          </div>
        </button>
      </div>

      <div class="name-section" v-if="selectedPet">
        <label for="pet-name" class="name-label">给你的宠物起个名字</label>
        <input
          id="pet-name"
          v-model="customName"
          type="text"
          class="name-input"
          :placeholder="defaultName"
          maxlength="8"
        />
      </div>

      <button
        class="confirm-btn"
        :disabled="!selectedPet"
        @click="confirm"
      >
        <span class="btn-icon">🐾</span>
        开始陪伴
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PetType } from '../stores/pet'
import { PET_CONFIGS } from '../stores/pet'
import CatPet from './pets/CatPet.vue'
import DogPet from './pets/DogPet.vue'
import RabbitPet from './pets/RabbitPet.vue'

const emit = defineEmits<{
  (e: 'select', type: PetType, name: string): void
}>()

const selectedPet = ref<PetType | null>(null)
const customName = ref('')

const petOptions = [
  {
    type: 'cat' as PetType,
    label: '猫咪',
    defaultName: PET_CONFIGS.cat.name,
    color: PET_CONFIGS.cat.color,
    accentColor: PET_CONFIGS.cat.accentColor,
    component: CatPet,
    traits: ['活泼', '独立', '爱撒娇'],
  },
  {
    type: 'dog' as PetType,
    label: '狗狗',
    defaultName: PET_CONFIGS.dog.name,
    color: PET_CONFIGS.dog.color,
    accentColor: PET_CONFIGS.dog.accentColor,
    component: DogPet,
    traits: ['忠诚', '热情', '爱玩耍'],
  },
  {
    type: 'rabbit' as PetType,
    label: '兔子',
    defaultName: PET_CONFIGS.rabbit.name,
    color: PET_CONFIGS.rabbit.color,
    accentColor: PET_CONFIGS.rabbit.accentColor,
    component: RabbitPet,
    traits: ['温顺', '可爱', '爱干净'],
  },
]

const defaultName = computed(() => {
  if (!selectedPet.value) return ''
  return PET_CONFIGS[selectedPet.value].name
})

function selectPet(type: PetType) {
  selectedPet.value = type
}

function confirm() {
  if (!selectedPet.value) return
  const name = customName.value.trim() || defaultName.value
  emit('select', selectedPet.value, name)
}
</script>

<style scoped lang="scss">
.pet-selector {
  min-height: calc(100vh - 56px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  padding-top: 80px;
  background: var(--color-background);
}

.selector-content {
  width: 100%;
  max-width: 800px;
}

.selector-header {
  text-align: center;
  margin-bottom: 40px;
}

.header-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: var(--color-primary);
  border-radius: 50%;
  color: white;
  margin-bottom: 16px;
  box-shadow: var(--shadow);
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 8px;
}

.subtitle {
  font-size: 16px;
  color: var(--color-text-secondary);
  margin: 0;
}

.pet-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 32px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.pet-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px;
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: var(--transition);
  box-shadow: var(--shadow);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    border-color: var(--color-primary);
  }

  &.selected {
    border-color: var(--color-primary);
    background: var(--color-surface);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2), var(--shadow);
  }
}

.pet-preview {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;

  :deep(svg) {
    width: 72px;
    height: 72px;
  }
}

.pet-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
}

.pet-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
}

.pet-type-label {
  font-size: 13px;
  color: var(--color-primary);
  font-weight: 500;
}

.pet-traits {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}

.trait-tag {
  font-size: 11px;
  padding: 4px 10px;
  background: var(--color-background);
  color: var(--color-text-secondary);
  border-radius: 12px;
  border: 1px solid var(--color-border);
}

.name-section {
  width: 100%;
  max-width: 400px;
  margin: 0 auto 24px;
}

.name-label {
  display: block;
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
  text-align: center;
}

.name-input {
  width: 100%;
  padding: 14px 20px;
  font-size: 16px;
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius);
  color: var(--color-text);
  text-align: center;
  outline: none;
  transition: var(--transition);

  &::placeholder {
    color: var(--color-text-secondary);
  }

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  }
}

.confirm-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 16px 32px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  background: var(--color-primary);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: var(--transition);
  box-shadow: var(--shadow);

  .btn-icon {
    font-size: 18px;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    background: var(--color-border);
    cursor: not-allowed;
    color: var(--color-text-secondary);
  }
}
</style>
