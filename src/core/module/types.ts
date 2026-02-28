import type { Component } from 'vue'

export type ModuleCategory = 'games' | 'relax' | 'tools' | 'reading'

export type IconType = 'svg' | 'iconify' | 'image' | 'component'

export interface ModuleMeta {
  title: string
  keywords?: string[]
  description?: string
}

export interface ModuleConfig {
  id: string
  name: string
  description: string
  category: ModuleCategory
  tags?: string[]
  icon: string | Component
  iconType: IconType
  route: string
  component: () => Promise<Component>
  meta?: ModuleMeta
  enabled?: boolean
  order?: number
  [key: string]: unknown
}

export interface ModuleRegistry {
  games: ModuleConfig[]
  relax: ModuleConfig[]
  tools: ModuleConfig[]
  reading: ModuleConfig[]
  all: ModuleConfig[]
}
