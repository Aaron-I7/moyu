import type { ModuleConfig } from '@/core/module/types'

const csvToolkitConfig: ModuleConfig = {
  id: 'csv-toolkit',
  name: 'CSV Toolkit',
  description: 'Parse, map and export CSV/JSON locally.',
  category: 'tools',
  tags: ['csv', 'json', 'data'],
  icon: 'mdi:file-delimited-outline',
  iconType: 'iconify',
  route: '/tools/csv-toolkit',
  component: () => import('./index.vue'),
  meta: {
    title: 'CSV Toolkit - Breakflow',
    titleKey: 'tools.csvToolkit.title',
    description: 'Parse, map and export CSV/JSON locally'
  },
  i18n: {
    nameKey: 'tools.csvToolkit.title',
    descriptionKey: 'tools.csvToolkit.desc',
    tagKeys: ['tools.csvToolkit.tags.0', 'tools.csvToolkit.tags.1', 'tools.csvToolkit.tags.2']
  },
  enabled: true,
  order: 7
}

export default csvToolkitConfig
