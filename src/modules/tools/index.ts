import type { ModuleConfig } from '@/core/module/types'
import moduleRegistry from '@/core/module/registry'

import whiteNoiseConfig from './white-noise/config'
import pngToSvgConfig from './png-to-svg/config'

const toolModules: ModuleConfig[] = [
  whiteNoiseConfig,
  pngToSvgConfig
]

toolModules.forEach(config => moduleRegistry.register(config))

export { moduleRegistry }
