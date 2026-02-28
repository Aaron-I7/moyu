import type { IconType } from '../module/types'

export interface IconConfig {
  type: IconType
  value: string
  color?: string
  size?: number
}

export const defaultIconConfig: IconConfig = {
  type: 'iconify',
  value: 'mdi:puzzle',
  size: 24
}

export const iconPresets: Record<string, IconConfig> = {
  games: {
    type: 'iconify',
    value: 'mdi:gamepad-variant',
    color: '#4CAF50'
  },
  relax: {
    type: 'iconify',
    value: 'mdi:spa',
    color: '#8B5CF6'
  },
  tools: {
    type: 'iconify',
    value: 'mdi:tools',
    color: '#2196F3'
  },
  reading: {
    type: 'iconify',
    value: 'mdi:book-open-page-variant',
    color: '#FF9800'
  }
}
