/** 像素钓场 — Pinia Store（Composition API 风格） */
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type {
  PlayerState, PlayerSettings, CatchRecord,
  ViewMode, FishingState, Weather, ComboState
} from '../types'
import {
  STORAGE_KEY,
  RARITY_EXP_MULTIPLIER, EXP_PER_LEVEL, MAX_LEVEL
} from '../constants'
import { FISH_DATA, getFishById } from '../data/fish'
import { SPOTS, getUnlockedSpots } from '../data/spots'
import { WEATHER_CONFIG, getRandomWeather } from '../data/weather'
import { useCloudSync } from '@/composables/useCloudSync'

function createDefaultSettings(): PlayerSettings {
  return {
    masterVolume: 0.7,
    bgmVolume: 0.5,
    sfxVolume: 0.8,
    muted: false,
    preferredView: 'third-person'
  }
}

function createDefaultJournal(): Record<string, number> {
  const journal: Record<string, number> = {}
  FISH_DATA.forEach(f => {
    journal[f.id] = 0
  })
  return journal
}

function createDefaultState(): PlayerState {
  return {
    coins: 0,
    level: 1,
    exp: 0,
    totalCatch: 0,
    unlockedSpotIds: ['stream'],
    journal: createDefaultJournal(),
    settings: createDefaultSettings()
  }
}

function loadState(): PlayerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as any // Use any to migrate old data
      
      // Migration logic: if old journal format (object), convert to number
      const migratedJournal: Record<string, number> = {}
      FISH_DATA.forEach(f => {
        const oldEntry = parsed.journal?.[f.id]
        if (typeof oldEntry === 'object' && oldEntry !== null) {
          migratedJournal[f.id] = oldEntry.count || 0
        } else if (typeof oldEntry === 'number') {
          migratedJournal[f.id] = oldEntry
        } else {
          migratedJournal[f.id] = 0
        }
      })
      
      return {
        coins: parsed.coins || 0,
        level: parsed.level || 1,
        exp: parsed.exp || 0,
        totalCatch: parsed.totalCatch || 0,
        unlockedSpotIds: parsed.unlockedSpotIds || ['stream'],
        journal: migratedJournal,
        settings: parsed.settings || createDefaultSettings()
      }
    }
  } catch { /* ignore */ }
  return createDefaultState()
}

export const usePixelFishingStore = defineStore('pixel-fishing', () => {
  const state = ref<PlayerState>(loadState())

  const currentSpotId = ref<string | null>(null)
  const fishingState = ref<FishingState>('spot-select')
  const viewMode = ref<ViewMode>(state.value.settings.preferredView)
  const currentFishId = ref<string | null>(null)
  const currentWeather = ref<Weather>(getRandomWeather())
  const combo = ref<ComboState>({
    count: 0,
    multiplier: 1,
    lastTiming: null,
    timings: []
  })

  const coins = computed(() => state.value.coins)
  const level = computed(() => state.value.level)
  const exp = computed(() => state.value.exp)
  const totalCatch = computed(() => state.value.totalCatch)
  const expToNextLevel = computed(() => EXP_PER_LEVEL * state.value.level)
  const expProgress = computed(() => state.value.exp / expToNextLevel.value)

  const unlockedSpots = computed(() =>
    getUnlockedSpots(state.value.totalCatch)
  )

  const currentSpot = computed(() =>
    currentSpotId.value ? SPOTS.find(s => s.id === currentSpotId.value) : null
  )

  const journalEntries = computed(() => {
    return FISH_DATA.map(fish => {
      const count = state.value.journal[fish.id] || 0
      return {
        fishId: fish.id,
        caught: count > 0,
        count,
        maxSize: 0,
        maxWeight: 0,
        firstCaughtAt: null
      }
    })
  })
  
  const caughtCount = computed(() => Object.values(state.value.journal).filter(c => c > 0).length)
  const totalFishSpecies = computed(() => FISH_DATA.length)
  const journalProgress = computed(() => caughtCount.value / totalFishSpecies.value)
  const catchHistory = computed(() => [] as CatchRecord[]) // 移除历史记录，返回空数组兼容接口

  const weatherConfig = computed(() => WEATHER_CONFIG[currentWeather.value])
  const { pushData } = useCloudSync()

  function save() {
    try {
      // 存储时仅保存 journal 的计数信息
      const dataToSave = {
        ...state.value,
        // catchHistory: [] // 确保不保存历史记录
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
      pushData('pixel-fishing', dataToSave)
    } catch { /* quota exceeded etc */ }
  }

  function selectSpot(spotId: string) {
    currentSpotId.value = spotId
    fishingState.value = 'idle'
    currentWeather.value = getRandomWeather()
  }

  function backToSpotSelect() {
    currentSpotId.value = null
    fishingState.value = 'spot-select'
    currentFishId.value = null
  }

  function setFishingState(s: FishingState) {
    fishingState.value = s
  }

  function setCurrentFish(fishId: string | null) {
    currentFishId.value = fishId
  }

  function toggleView() {
    viewMode.value = viewMode.value === 'first-person' ? 'third-person' : 'first-person'
    state.value.settings.preferredView = viewMode.value
    save()
  }

  function updateCombo(newCombo: ComboState) {
    combo.value = { ...newCombo }
  }

  function resetCombo() {
    combo.value = {
      count: 0,
      multiplier: 1,
      lastTiming: null,
      timings: []
    }
  }

  function recordCatch(
    fishId: string,
    size: number,
    weight: number,
    timingResults: string[] = []
  ): CatchRecord {
    const fish = getFishById(fishId)
    if (!fish) throw new Error(`Fish not found: ${fishId}`)

    const baseValue = fish.value
    const comboMultiplier = combo.value.multiplier
    const finalValue = Math.round(baseValue * comboMultiplier)

    const record: CatchRecord = {
      fishId,
      size,
      weight,
      value: finalValue,
      spotId: currentSpotId.value ?? 'unknown',
      timestamp: Date.now(),
      combo: combo.value.count,
      timing: timingResults as any
    }

    state.value.coins += finalValue

    const expGain = finalValue * (RARITY_EXP_MULTIPLIER[fish.rarity] ?? 1)
    addExp(expGain)

    state.value.totalCatch++

    // Simplified journal update: just increment count
    const currentCount = state.value.journal[fishId] || 0
    state.value.journal[fishId] = currentCount + 1

    // Removed catchHistory updates

    checkUnlocks()

    save()
    return record
  }

  function addExp(amount: number) {
    state.value.exp += amount
    while (
      state.value.exp >= EXP_PER_LEVEL * state.value.level &&
      state.value.level < MAX_LEVEL
    ) {
      state.value.exp -= EXP_PER_LEVEL * state.value.level
      state.value.level++
    }
  }

  function checkUnlocks() {
    const unlockable = SPOTS.filter(
      s => state.value.totalCatch >= s.unlockCondition &&
        !state.value.unlockedSpotIds.includes(s.id)
    )
    unlockable.forEach(s => state.value.unlockedSpotIds.push(s.id))
  }

  function updateSettings(partial: Partial<PlayerSettings>) {
    Object.assign(state.value.settings, partial)
    save()
  }

  function resetData() {
    state.value = createDefaultState()
    currentSpotId.value = null
    fishingState.value = 'spot-select'
    currentFishId.value = null
    resetCombo()
    save()
  }

  return {
    state,
    currentSpotId,
    fishingState,
    viewMode,
    currentFishId,
    currentWeather,
    combo,
    coins,
    level,
    exp,
    totalCatch,
    expToNextLevel,
    expProgress,
    unlockedSpots,
    currentSpot,
    journalEntries,
    caughtCount,
    totalFishSpecies,
    journalProgress,
    catchHistory,
    weatherConfig,
    save,
    selectSpot,
    backToSpotSelect,
    setFishingState,
    setCurrentFish,
    toggleView,
    updateCombo,
    resetCombo,
    recordCatch,
    updateSettings,
    resetData
  }
})
