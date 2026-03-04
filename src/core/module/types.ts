import type { Component } from 'vue'

export type ModuleCategory = 'games' | 'relax' | 'tools' | 'reading'

export type IconType = 'svg' | 'iconify' | 'image' | 'component'

export interface ModuleMeta {
  title: string
  titleKey?: string
  descriptionKey?: string
  keywords?: string[]
  description?: string
}

export interface ModuleI18nConfig {
  nameKey?: string
  descriptionKey?: string
  tagKeys?: string[]
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
  i18n?: ModuleI18nConfig
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
