import type { ModuleConfig } from '@/core/module/types'

const textWorkbenchConfig: ModuleConfig = {
  id: 'text-workbench',
  name: 'Text Workbench',
  description: 'Unified workspace for text tools.',
  category: 'tools',
  tags: ['text', 'diff', 'format'],
  icon: 'mdi:text-box-multiple-outline',
  iconType: 'iconify',
  route: '/tools/text-workbench',
  component: () => import('./index.vue'),
  meta: {
    title: 'Text Workbench - Breakflow',
    titleKey: 'tools.textWorkbench.title',
    description: 'Unified workspace for text tools'
  },
  i18n: {
    nameKey: 'tools.textWorkbench.title',
    descriptionKey: 'tools.textWorkbench.desc',
    tagKeys: ['tools.textWorkbench.tags.0', 'tools.textWorkbench.tags.1', 'tools.textWorkbench.tags.2']
  },
  enabled: true,
  order: 5
}

export default textWorkbenchConfig
