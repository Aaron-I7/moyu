import type { ModuleConfig } from '@/core/module/types'
import moduleRegistry from '@/core/module/registry'

import pomodoroConfig from './pomodoro/config'

const toolModules: ModuleConfig[] = [
  pomodoroConfig
]

toolModules.forEach(config => moduleRegistry.register(config))

export { moduleRegistry }
