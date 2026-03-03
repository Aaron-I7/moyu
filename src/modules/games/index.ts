import type { ModuleConfig } from '@/core/module/types'
import moduleRegistry from '@/core/module/registry'
import pixelFishingConfig from './pixel-fishing/config'

const gameModules: ModuleConfig[] = [
  pixelFishingConfig
]

gameModules.forEach(config => moduleRegistry.register(config))

export { moduleRegistry }
