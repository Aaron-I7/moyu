import type { ModuleConfig } from '@/core/module/types'
import moduleRegistry from '@/core/module/registry'

const gameModules: ModuleConfig[] = []

gameModules.forEach(config => moduleRegistry.register(config))

export { moduleRegistry }
