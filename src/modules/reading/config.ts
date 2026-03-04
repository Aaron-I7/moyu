import type { ModuleConfig } from '@/core/module/types'

const readingConfig: ModuleConfig = {
  id: 'reading',
  name: 'Novel Reader',
  description: 'A lightweight local TXT reader for focused breaks.',
  category: 'reading',
  tags: ['reading', 'novel'],
  icon: 'mdi:book-open-page-variant',
  iconType: 'iconify',
  route: '/reading',
  component: async () => {
    const mod = await import('./index.vue')
    return mod.default
  },
  meta: {
    title: 'Novel Reader - Breakflow',
    titleKey: 'modules.reading.name'
  },
  i18n: {
    nameKey: 'modules.reading.name',
    descriptionKey: 'modules.reading.description',
    tagKeys: ['modules.reading.tags.0', 'modules.reading.tags.1']
  },
  enabled: true,
  order: 1
}

export default readingConfig
