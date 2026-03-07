import type { ModuleConfig } from '@/core/module/types'

const divinationConfig: ModuleConfig = {
  id: 'divination',
  name: 'Divination',
  description: 'Consult the I Ching for guidance.',
  category: 'tools',
  tags: ['divination', 'iching', 'fortune'],
  icon: 'mdi:yin-yang',
  iconType: 'iconify',
  route: '/tools/divination',
  component: async () => {
    const mod = await import('./index.vue')
    return mod.default
  },
  meta: {
    title: 'Divination - Breakflow',
    titleKey: 'modules.divination.name'
  },
  i18n: {
    nameKey: 'modules.divination.name',
    descriptionKey: 'modules.divination.description',
    tagKeys: [
      'modules.divination.tags.0',
      'modules.divination.tags.1',
      'modules.divination.tags.2'
    ]
  },
  enabled: true,
  order: 4
}

export default divinationConfig
