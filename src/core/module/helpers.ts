import type { ModuleConfig } from './types'

export function createModuleConfig(config: ModuleConfig): ModuleConfig {
  return {
    enabled: true,
    order: 0,
    ...config
  }
}

export function isModuleEnabled(config: ModuleConfig): boolean {
  return config.enabled !== false
}

export function sortModulesByOrder(modules: ModuleConfig[]): ModuleConfig[] {
  return [...modules].sort((a, b) => (a.order || 0) - (b.order || 0))
}
