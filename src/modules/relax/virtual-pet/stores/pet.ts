import { defineStore } from 'pinia'
import { useCloudSync } from '@/composables/useCloudSync'

const STORAGE_KEY = 'moyu-virtual-pet-v3'

export type PetType = 'cat' | 'dog' | 'rabbit'

export interface InteractionRecord {
  id: string
  action: string
  timestamp: number
  detail?: string
}

export interface MoyuStats {
  totalMinutes: number
  todayMinutes: number
  todayDate: string
  workTimeInteractions: number
  streakDays: number
  lastVisitDate: string
}

export interface PetData {
  type: PetType | null
  name: string
  hunger: number
  happiness: number
  energy: number
  cleanliness: number
  age: number
  activeAction: string | null
  interactions: InteractionRecord[]
  lastSaved: number
  moyuStats: MoyuStats
}

export const PET_CONFIGS: Record<PetType, { name: string; color: string; accentColor: string }> = {
  cat: { name: '小咪', color: '#f97316', accentColor: '#c2410c' },
  dog: { name: '旺财', color: '#a16207', accentColor: '#713f12' },
  rabbit: { name: '雪球', color: '#f1f5f9', accentColor: '#cbd5e1' },
}

const DEFAULT_MOYU_STATS: MoyuStats = {
  totalMinutes: 0,
  todayMinutes: 0,
  todayDate: '',
  streakDays: 0,
  lastVisitDate: '',
  workTimeInteractions: 0,
}

const DEFAULTS: PetData = {
  type: null,
  name: '',
  hunger: 80,
  happiness: 80,
  energy: 80,
  cleanliness: 80,
  age: 0,
  activeAction: null,
  interactions: [],
  lastSaved: Date.now(),
  moyuStats: { ...DEFAULT_MOYU_STATS },
}

function clamp(val: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, val))
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return '刚刚'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0]!
}

function isWorkTime(): boolean {
  const hour = new Date().getHours()
  return hour >= 9 && hour < 18
}

export const usePetStore = defineStore('virtual-pet', {
  state: (): PetData => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '')
      if (saved && saved.lastSaved) {
        const elapsedSeconds = (Date.now() - saved.lastSaved) / 1000
        const ticks = Math.floor(elapsedSeconds / 10)
        if (ticks > 0) {
          if (saved.activeAction === 'sleeping') {
            saved.energy = clamp(saved.energy + ticks * 8)
            saved.hunger = clamp(saved.hunger - ticks * 0.3)
            if (saved.energy >= 100) saved.activeAction = null
          } else {
            saved.hunger = clamp(saved.hunger - ticks * 1.2)
            saved.happiness = clamp(saved.happiness - ticks * 0.8)
            saved.energy = clamp(saved.energy - ticks * 0.5)
            saved.cleanliness = clamp(saved.cleanliness - ticks * 0.4)
          }
        }
        saved.lastSaved = Date.now()
        if (!saved.interactions) saved.interactions = []
        if (!saved.moyuStats) saved.moyuStats = { ...DEFAULT_MOYU_STATS }
        return saved
      }
    } catch {
      // ignore
    }
    return { ...DEFAULTS }
  },

  getters: {
    petState: (state): string => {
      if (state.activeAction) return state.activeAction
      if (state.energy < 15) return 'tired'
      if (state.hunger < 20) return 'hungry'
      if (state.happiness >= 85) return 'happy'
      return 'idle'
    },
    canFeed: (state): boolean => state.activeAction !== 'sleeping',
    canPlay: (state): boolean => state.activeAction !== 'sleeping' && state.energy >= 15,
    canPet: (state): boolean => state.activeAction !== 'sleeping',
    canSleep: (state): boolean => state.activeAction !== 'sleeping',
    canBath: (state): boolean => state.activeAction !== 'sleeping',
    petConfig: (state) => state.type ? PET_CONFIGS[state.type] : PET_CONFIGS.cat,
    recentInteractions: (state) => {
      return state.interactions.slice(-20).reverse().map(r => ({
        ...r,
        timeAgo: formatTimeAgo(r.timestamp)
      }))
    },
    interactionCount: (state) => state.interactions.length,
    isWorkingHours: () => isWorkTime(),
    moyuStatus: (): string => {
      if (isWorkTime()) return '摸鱼中'
      return '休息中'
    },
    formattedTodayTime: (state): string => {
      const minutes = state.moyuStats.todayMinutes
      if (minutes < 60) return `${minutes}分钟`
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
    },
    formattedTotalTime: (state): string => {
      const minutes = state.moyuStats.totalMinutes
      if (minutes < 60) return `${minutes}分钟`
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return `${hours}小时`
      const days = Math.floor(hours / 24)
      const remainHours = hours % 24
      return remainHours > 0 ? `${days}天${remainHours}小时` : `${days}天`
    },
  },

  actions: {
    _timer: null as ReturnType<typeof setInterval> | null,
    _moyuTimer: null as ReturnType<typeof setInterval> | null,

    addInteraction(action: string, detail?: string) {
      this.interactions.push({
        id: generateId(),
        action,
        timestamp: Date.now(),
        detail,
      })
      if (this.interactions.length > 100) {
        this.interactions = this.interactions.slice(-100)
      }

      if (isWorkTime()) {
        this.moyuStats.workTimeInteractions++
      }
    },

    updateMoyuTime() {
      const today = getTodayStr()
      if (this.moyuStats.todayDate !== today) {
        const lastDate = this.moyuStats.lastVisitDate
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        if (lastDate === yesterdayStr) {
          this.moyuStats.streakDays++
        } else if (lastDate !== today) {
          this.moyuStats.streakDays = 1
        }

        this.moyuStats.todayDate = today
        this.moyuStats.todayMinutes = 0
      }

      this.moyuStats.todayMinutes++
      this.moyuStats.totalMinutes++
      this.moyuStats.lastVisitDate = today
      this.save()
    },

    selectPet(type: PetType, customName?: string) {
      this.type = type
      this.name = customName || PET_CONFIGS[type].name
      this.hunger = 80
      this.happiness = 80
      this.energy = 80
      this.cleanliness = 80
      this.age = 0
      this.activeAction = null
      this.interactions = []
      this.addInteraction('adopt', `领养了${PET_CONFIGS[type].name}`)
      this.save()
    },

    feed() {
      if (!this.canFeed) return
      this.activeAction = 'eating'
      this.hunger = clamp(this.hunger + 25)
      this.happiness = clamp(this.happiness + 5)
      this.energy = clamp(this.energy - 2)
      this.addInteraction('feed', '喂食')
      setTimeout(() => {
        if (this.activeAction === 'eating') this.activeAction = null
        this.save()
      }, 3000)
    },

    play() {
      if (!this.canPlay) return
      this.activeAction = 'playing'
      this.happiness = clamp(this.happiness + 20)
      this.energy = clamp(this.energy - 20)
      this.hunger = clamp(this.hunger - 8)
      this.addInteraction('play', '玩耍')
      setTimeout(() => {
        if (this.activeAction === 'playing') this.activeAction = null
        this.save()
      }, 3000)
    },

    petAction() {
      if (!this.canPet) return
      this.happiness = clamp(this.happiness + 12)
      this.addInteraction('pet', '抚摸')
      this.save()
    },

    specialAction() {
      if (this.activeAction === 'sleeping') return
      
      const actionDetails: Record<PetType, string> = {
        cat: '用羽毛逗猫',
        dog: '带狗狗散步',
        rabbit: '喂胡萝卜',
      }
      
      if (!this.type) return
      
      this.activeAction = 'special'
      this.happiness = clamp(this.happiness + 25)
      this.energy = clamp(this.energy - 15)
      this.hunger = clamp(this.hunger - 5)
      this.addInteraction('special', actionDetails[this.type])
      
      setTimeout(() => {
        if (this.activeAction === 'special') this.activeAction = null
        this.save()
      }, 4000)
    },

    sleep() {
      if (!this.canSleep) return
      this.activeAction = 'sleeping'
      this.addInteraction('sleep', '开始睡觉')
      this.save()
    },

    wakeUp() {
      if (this.activeAction !== 'sleeping') return
      this.activeAction = null
      this.addInteraction('wakeUp', '醒来')
      this.save()
    },

    bath() {
      if (!this.canBath) return
      this.activeAction = 'bathing'
      this.cleanliness = clamp(this.cleanliness + 35)
      this.happiness = clamp(this.happiness + 5)
      this.addInteraction('bath', '洗澡')
      setTimeout(() => {
        if (this.activeAction === 'bathing') this.activeAction = null
        this.save()
      }, 3000)
    },

    tick() {
      this.age++

      if (this.activeAction === 'sleeping') {
        this.energy = clamp(this.energy + 8)
        this.hunger = clamp(this.hunger - 0.3)
        if (this.energy >= 100) this.activeAction = null
      } else {
        this.hunger = clamp(this.hunger - 1.2)
        this.happiness = clamp(this.happiness - 0.8)
        this.energy = clamp(this.energy - 0.5)
        this.cleanliness = clamp(this.cleanliness - 0.4)

        if (this.energy <= 0) {
          this.activeAction = 'sleeping'
          this.addInteraction('autoSleep', '体力耗尽，自动入睡')
        }
      }

      this.save()
    },

    save() {
      const { pushData } = useCloudSync()
      this.lastSaved = Date.now()
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.$state))
        pushData('virtual-pet', this.$state)
      } catch {
        // ignore
      }
    },

    startTimer() {
      this._timer = window.setInterval(() => this.tick(), 10000)
      this._moyuTimer = window.setInterval(() => this.updateMoyuTime(), 60000)
      this.updateMoyuTime()
    },

    stopTimer() {
      if (this._timer) {
        clearInterval(this._timer)
        this._timer = null
      }
      if (this._moyuTimer) {
        clearInterval(this._moyuTimer)
        this._moyuTimer = null
      }
    },

    reset() {
      this.stopTimer()
      this.$patch({
        type: null,
        name: '',
        hunger: 80,
        happiness: 80,
        energy: 80,
        cleanliness: 80,
        age: 0,
        activeAction: null,
        interactions: [],
        lastSaved: Date.now(),
        moyuStats: { ...DEFAULT_MOYU_STATS },
      })
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        // ignore
      }
    },
  },
})
