import type { ModuleConfig } from '@/core/module/types'

const memoConfig: ModuleConfig = {
  id: 'memo',
  name: 'Memos',
  description: 'Manage your daily notes and todos.',
  category: 'tools',
  tags: ['note', 'todo', 'utility'],
  icon: 'mdi:calendar-edit',
  iconType: 'iconify',
  route: '/tools/memo',
  component: () => import('./index.vue'),
  meta: {
    title: 'Memos - Breakflow',
    titleKey: 'tools.memo.title',
    description: 'Manage your daily notes and todos'
  },
  i18n: {
    nameKey: 'tools.memo.title',
    descriptionKey: 'tools.memo.desc',
    tagKeys: ['tools.memo.title']
  },
  enabled: true,
  order: 4
}

export default memoConfig
