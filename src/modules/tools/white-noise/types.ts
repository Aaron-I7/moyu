export interface SoundItem {
  id: string
  name: string
  icon: string
  url?: string
  volume: number
  isPlaying: boolean
}

export interface WhiteNoiseState {
  sounds: SoundItem[]
  masterVolume: number
  timer: number | null
  isPlaying: boolean
}

export interface TimerPreset {
  label: string
  value: number
}
