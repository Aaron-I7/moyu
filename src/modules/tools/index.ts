import type { ModuleConfig } from '@/core/module/types'
import moduleRegistry from '@/core/module/registry'

import pomodoroConfig from './pomodoro/config'
import calendarConfig from './calendar/config'
import memoConfig from './memo/config'
import divinationConfig from './divination/config'
import textDiffConfig from './text-diff/config'
import textFormatterConfig from './text-formatter/config'

const toolModules: ModuleConfig[] = [
  pomodoroConfig,
  calendarConfig,
  memoConfig,
  divinationConfig,
  textDiffConfig,
  textFormatterConfig
]

toolModules.forEach(config => moduleRegistry.register(config))

export { moduleRegistry }
