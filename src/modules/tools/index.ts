import type { ModuleConfig } from '@/core/module/types'
import moduleRegistry from '@/core/module/registry'

import pomodoroConfig from './pomodoro/config'
import calendarConfig from './calendar/config'
import memoConfig from './memo/config'
import divinationConfig from './divination/config'
import textWorkbenchConfig from './text-workbench/config'
import csvToolkitConfig from './csv-toolkit/config'
import imageQuickEditConfig from './image-quick-edit/config'

const toolModules: ModuleConfig[] = [
  pomodoroConfig,
  calendarConfig,
  memoConfig,
  divinationConfig,
  textWorkbenchConfig,
  csvToolkitConfig,
  imageQuickEditConfig
]

toolModules.forEach(config => moduleRegistry.register(config))

export { moduleRegistry }
