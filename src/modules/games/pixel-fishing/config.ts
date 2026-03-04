import type { ModuleConfig } from '@/core/module/types'

const pixelFishingConfig: ModuleConfig = {
  id: 'pixel-fishing',
  name: 'Pixel Fishing',
  description: 'Immersive retro fishing with 5 spots and 40 species.',
  category: 'games',
  tags: ['pixel', 'fishing', 'relax', 'collection'],
  icon: 'mdi:fishbowl',
  iconType: 'iconify',
  route: '/games/pixel-fishing',
  component: () => import('./index.vue'),
  meta: {
    title: 'Pixel Fishing - Breakflow',
    titleKey: 'modules.pixelFishing.name',
    description: 'Immersive retro fishing experience'
  },
  i18n: {
    nameKey: 'modules.pixelFishing.name',
    descriptionKey: 'modules.pixelFishing.description',
    tagKeys: [
      'modules.pixelFishing.tags.0',
      'modules.pixelFishing.tags.1',
      'modules.pixelFishing.tags.2',
      'modules.pixelFishing.tags.3'
    ]
  },
  enabled: true,
  order: 2
}

export default pixelFishingConfig
