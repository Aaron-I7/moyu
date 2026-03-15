import type { ModuleConfig } from '@/core/module/types'
import moduleRegistry from '@/core/module/registry'
import pixelFishingConfig from './pixel-fishing/config'
import math24Config from './math-24/config'
import focus100Config from './focus-100/config'

const gameModules: ModuleConfig[] = [
  pixelFishingConfig,
  math24Config,
  focus100Config
]

gameModules.forEach(config => moduleRegistry.register(config))

export { moduleRegistry }
