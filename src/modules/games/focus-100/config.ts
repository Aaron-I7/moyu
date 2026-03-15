import type { ModuleConfig } from '@/core/module/types'

const focus100Config: ModuleConfig = {
  id: 'focus-100',
  name: '1-100 Focus',
  description: 'Find numbers from 1 to 100 in two focus modes.',
  category: 'games',
  tags: ['focus', 'reaction', 'relax'],
  icon: 'mdi:numeric-10-box-multiple-outline',
  iconType: 'iconify',
  route: '/games/focus-100',
  component: async () => {
    const mod = await import('./index.vue')
    return mod.default
  },
  meta: {
    title: '1-100 Focus - Breakflow',
    titleKey: 'modules.focus100.name',
    descriptionKey: 'modules.focus100.description'
  },
  i18n: {
    nameKey: 'modules.focus100.name',
    descriptionKey: 'modules.focus100.description',
    tagKeys: ['modules.focus100.tags.0', 'modules.focus100.tags.1', 'modules.focus100.tags.2']
  },
  enabled: true,
  order: 4
}

export default focus100Config
