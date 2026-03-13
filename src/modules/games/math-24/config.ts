import type { ModuleConfig } from '@/core/module/types'

const math24Config: ModuleConfig = {
  id: 'math-24',
  name: '24 Points',
  description: 'Use four numbers and operators to make 24.',
  category: 'games',
  tags: ['math', 'puzzle', 'logic'],
  icon: 'mdi:numeric-24-box-outline',
  iconType: 'iconify',
  route: '/games/math-24',
  component: async () => {
    const mod = await import('./index.vue')
    return mod.default
  },
  meta: {
    title: '24 Points - Breakflow',
    titleKey: 'modules.math24.name',
    descriptionKey: 'modules.math24.description'
  },
  i18n: {
    nameKey: 'modules.math24.name',
    descriptionKey: 'modules.math24.description',
    tagKeys: ['modules.math24.tags.0', 'modules.math24.tags.1', 'modules.math24.tags.2']
  },
  enabled: true,
  order: 3
}

export default math24Config
