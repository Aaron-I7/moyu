import type { ModuleConfig } from '@/core/module/types'

const pomodoroConfig: ModuleConfig = {
  id: 'pomodoro',
  name: 'Pomodoro Focus',
  description: 'Boost productivity with Pomodoro timer and ambient sounds.',
  category: 'tools',
  tags: ['focus', 'timer', 'ambient'],
  icon: 'mdi:timer-outline',
  iconType: 'iconify',
  route: '/tools/pomodoro',
  component: async () => {
    const mod = await import('./index.vue')
    return mod.default
  },
  meta: {
    title: 'Pomodoro Focus - Breakflow',
    titleKey: 'modules.pomodoro.name'
  },
  i18n: {
    nameKey: 'modules.pomodoro.name',
    descriptionKey: 'modules.pomodoro.description',
    tagKeys: [
      'modules.pomodoro.tags.0',
      'modules.pomodoro.tags.1',
      'modules.pomodoro.tags.2'
    ]
  },
  enabled: true,
  order: 1
}

export default pomodoroConfig
