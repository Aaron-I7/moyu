import type { ModuleConfig } from '@/core/module/types'

const calendarConfig: ModuleConfig = {
  id: 'calendar',
  name: 'Calendar',
  description: 'Check holidays and lunar dates.',
  category: 'tools',
  tags: ['calendar', 'holiday', 'utility'],
  icon: 'mdi:calendar-month',
  iconType: 'iconify',
  route: '/tools/calendar',
  component: () => import('./index.vue'),
  meta: {
    title: 'Calendar - Breakflow',
    titleKey: 'tools.calendar.title',
    description: 'Check holidays and lunar dates'
  },
  i18n: {
    nameKey: 'tools.calendar.title',
    descriptionKey: 'tools.calendar.desc',
    tagKeys: ['tools.calendar.title']
  },
  enabled: true,
  order: 3
}

export default calendarConfig
