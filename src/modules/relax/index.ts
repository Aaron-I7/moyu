import type { ModuleConfig } from '@/core/module/types'
import moduleRegistry from '@/core/module/registry'
import woodenFishConfig from './wooden-fish/config'
import virtualPetConfig from './virtual-pet/config'

const relaxModules: ModuleConfig[] = [
  woodenFishConfig,
  virtualPetConfig
]

relaxModules.forEach(config => moduleRegistry.register(config))

export { moduleRegistry }
