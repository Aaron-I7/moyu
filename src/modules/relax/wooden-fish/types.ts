export interface WoodenFishState {
  count: number
  merit: number
  autoMode: boolean
  autoSpeed: number
  soundEnabled: boolean
  vibrationEnabled: boolean
}

export interface FloatingText {
  id: number
  text: string
  x: number
  y: number
}

export const meritTexts = [
  '功德 +1',
  '心静如水',
  '善哉善哉',
  '阿弥陀佛',
  '慈悲为怀',
  '普度众生',
  '积德行善',
  '福报无量'
]
