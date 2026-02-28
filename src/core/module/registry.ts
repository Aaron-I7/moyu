import type { ModuleConfig, ModuleRegistry, ModuleCategory } from './types'

class ModuleRegistryImpl {
  private modules: Map<string, ModuleConfig> = new Map()
  private categorized: Record<ModuleCategory, ModuleConfig[]> = {
    games: [],
    relax: [],
    tools: [],
    reading: []
  }

  register(config: ModuleConfig): void {
    if (this.modules.has(config.id)) {
      console.warn(`Module ${config.id} already registered, skipping...`)
      return
    }

    if (config.enabled === false) {
      return
    }

    this.modules.set(config.id, config)
    
    if (config.category && this.categorized[config.category]) {
      this.categorized[config.category].push(config)
      this.categorized[config.category].sort((a, b) => (a.order || 0) - (b.order || 0))
    }
  }

  registerMany(configs: ModuleConfig[]): void {
    configs.forEach(config => this.register(config))
  }

  unregister(id: string): void {
    const config = this.modules.get(id)
    if (config) {
      this.modules.delete(id)
      if (config.category && this.categorized[config.category]) {
        const index = this.categorized[config.category].findIndex(m => m.id === id)
        if (index > -1) {
          this.categorized[config.category].splice(index, 1)
        }
      }
    }
  }

  get(id: string): ModuleConfig | undefined {
    return this.modules.get(id)
  }

  getByCategory(category: ModuleCategory): ModuleConfig[] {
    return this.categorized[category] || []
  }

  getAll(): ModuleConfig[] {
    return Array.from(this.modules.values())
  }

  getRegistry(): ModuleRegistry {
    return {
      games: this.categorized.games,
      relax: this.categorized.relax,
      tools: this.categorized.tools,
      reading: this.categorized.reading,
      all: this.getAll()
    }
  }
}

export const moduleRegistry = new ModuleRegistryImpl()
export default moduleRegistry
