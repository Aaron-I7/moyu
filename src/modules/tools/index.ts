import type { ModuleConfig } from '@/core/module/types'
import moduleRegistry from '@/core/module/registry'

import pomodoroConfig from './pomodoro/config'
import calendarConfig from './calendar/config'
import memoConfig from './memo/config'

const toolModules: ModuleConfig[] = [
  pomodoroConfig,
  calendarConfig,
  memoConfig
]

toolModules.forEach(config => moduleRegistry.register(config))

export { moduleRegistry }
