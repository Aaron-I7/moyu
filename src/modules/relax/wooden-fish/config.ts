import type { ModuleConfig } from '@/core/module/types'

const woodenFishConfig: ModuleConfig = {
  id: 'wooden-fish',
  name: 'Rhythm Tap',
  description: 'Tap with a steady pace to regulate breath and reduce stress.',
  category: 'relax',
  tags: ['stress-relief', 'focus', 'mindfulness'],
  icon: 'mdi:circle-outline',
  iconType: 'iconify',
  route: '/relax/wooden-fish',
  component: async () => {
    const mod = await import('./index.vue')
    return mod.default
  },
  meta: {
    title: 'Rhythm Tap - Breakflow',
    titleKey: 'modules.woodenFish.name'
  },
  i18n: {
    nameKey: 'modules.woodenFish.name',
    descriptionKey: 'modules.woodenFish.description',
    tagKeys: [
      'modules.woodenFish.tags.0',
      'modules.woodenFish.tags.1',
      'modules.woodenFish.tags.2'
    ]
  },
  enabled: true,
  order: 1
}

export default woodenFishConfig
