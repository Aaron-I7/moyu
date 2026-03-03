/** 像素钓场 — 全部类型定义 */

/** 钓鱼状态机 */
export type FishingState =
  | 'spot-select'
  | 'idle'
  | 'casting'
  | 'waiting'
  | 'biting'
  | 'timing-game'
  | 'catch-animation'
  | 'success'
  | 'failed'

/** 视角模式 */
export type ViewMode = 'first-person' | 'third-person'

/** 天气 */
export type Weather = 'sunny' | 'cloudy' | 'rainy' | 'snowy'

/** 天气配置 */
export interface WeatherConfig {
  type: Weather
  name: string
  icon: string
  description: string
  fishRarityBonus: Partial<Record<FishRarity, number>>
  ambientParticles: ParticleConfig['type'][]
  skyTint: number
  waterTint: number
}

/** 鱼稀有度 */
export type FishRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

/** 环境类型 */
export type EnvironmentType = 'stream' | 'lake' | 'river' | 'coast' | 'deep-sea'

/** 钓点定义 */
export interface FishingSpot {
  id: string
  name: string
  description: string
  difficulty: 1 | 2 | 3 | 4 | 5
  unlockCondition: number
  environmentType: EnvironmentType
  availableFishIds: string[]
  bgmKey: string
  ambientKey: string
  palette: SpotPalette
  supportedWeather: Weather[]
}

export interface SpotPalette {
  skyTop: number
  skyBottom: number
  waterSurface: number
  waterDeep: number
  ground: number
  foliage: number
  accent: number
}

/** 鱼定义 */
export interface Fish {
  id: string
  name: string
  description: string
  rarity: FishRarity
  sizeRange: [number, number]
  weightRange: [number, number]
  catchDifficulty: number
  timingBarSpeed: number
  timingBarGreenZone: number
  timingBarMoving: boolean
  value: number
  spriteKey: string
  spotIds: string[]
  stages: number
  preferredWeather: Weather[]
  imageUrl: string
  baikeUrl?: string
  scientificName?: string
  habitat?: string
  diet?: string
  funFact?: string
}

/** 钓获记录 */
export interface CatchRecord {
  fishId: string
  size: number
  weight: number
  value: number
  spotId: string
  timestamp: number
  combo: number
  timing: TimingResult[]
}

/** 图鉴条目 */
export interface JournalEntry {
  fishId: string
  caught: boolean
  count: number
  maxSize: number
  maxWeight: number
  firstCaughtAt: number | null
}

/** 玩家持久化状态 */
export interface PlayerState {
  coins: number
  level: number
  exp: number
  totalCatch: number
  unlockedSpotIds: string[]
  journal: Record<string, JournalEntry>
  catchHistory: CatchRecord[]
  settings: PlayerSettings
}

/** 玩家设置 */
export interface PlayerSettings {
  masterVolume: number
  bgmVolume: number
  sfxVolume: number
  muted: boolean
  preferredView: ViewMode
}

/** Timing Bar 判定结果 */
export type TimingResult = 'perfect' | 'good' | 'miss'

/** 连击状态 */
export interface ComboState {
  count: number
  multiplier: number
  lastTiming: TimingResult | null
  timings: TimingResult[]
}

/** 像素精灵帧定义 */
export interface SpriteFrame {
  width: number
  height: number
  pixels: number[][]
}

/** 像素精灵定义（含动画帧） */
export interface PixelSpriteData {
  key: string
  frames: SpriteFrame[]
  fps: number
}

/** 粒子配置 */
export interface ParticleConfig {
  type: 'leaf' | 'butterfly' | 'firefly' | 'raindrop' | 'snowflake' | 'bubble' | 'seagull' | 'splash' | 'glow' | 'sparkle'
  count: number
  speed: [number, number]
  size: [number, number]
  color: number
  alpha: [number, number]
  lifetime: [number, number]
}

/** 场景层配置 */
export interface SceneLayerConfig {
  parallaxFactor: number
  y: number
  height: number
  elements: SceneElement[]
}

/** 场景元素 */
export interface SceneElement {
  spriteKey: string
  x: number
  y: number
  scale?: number
  flipX?: boolean
}

/** 动画反馈配置 */
export interface FeedbackAnimation {
  type: 'coin-fly' | 'exp-gain' | 'sparkle' | 'ripple' | 'glow-pulse'
  x: number
  y: number
  value?: number
  duration: number
  delay?: number
}
