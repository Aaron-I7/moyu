/** 像素钓场 — 游戏常量 */

/** LocalStorage 持久化 key */
export const STORAGE_KEY = 'pixel-fishing-data'

/** 等待咬钩的时间范围（ms） */
export const BITE_WAIT_RANGE: [number, number] = [3000, 15000]

/** 咬钩后响应时间（ms） */
export const BITE_RESPONSE_TIME = 2000

/** 抛竿动画时长（ms） */
export const CAST_DURATION = 800

/** 视角切换动画时长（ms） */
export const VIEW_TRANSITION_DURATION = 800

/** 结果展示时长（ms） */
export const RESULT_DISPLAY_DURATION = 3000

/** 经验值公式：value * rarity_multiplier */
export const RARITY_EXP_MULTIPLIER: Record<string, number> = {
  common: 1,
  uncommon: 2,
  rare: 4,
  epic: 8,
  legendary: 16
}

/** 每级所需经验 */
export const EXP_PER_LEVEL = 100

/** 最大等级 */
export const MAX_LEVEL = 50

/** 钓获历史最大保留条数 */
export const MAX_CATCH_HISTORY = 200

/** Canvas 像素缩放倍数（保持像素锐利） */
export const PIXEL_SCALE = 4

/** 基础画面尺寸（逻辑像素） */
export const BASE_WIDTH = 256
export const BASE_HEIGHT = 192

/** Timing Bar 尺寸 */
export const TIMING_BAR_WIDTH = 300
export const TIMING_BAR_HEIGHT = 24

/** 稀有度颜色映射 */
export const RARITY_COLORS: Record<string, string> = {
  common: '#9CA3AF',
  uncommon: '#4ADE80',
  rare: '#60A5FA',
  epic: '#C084FC',
  legendary: '#FBBF24'
}

/** 稀有度中文名 */
export const RARITY_NAMES: Record<string, string> = {
  common: '普通',
  uncommon: '优质',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说'
}

/** 稀有度出现权重 */
export const RARITY_WEIGHTS: Record<string, number> = {
  common: 45,
  uncommon: 28,
  rare: 17,
  epic: 8,
  legendary: 2
}
