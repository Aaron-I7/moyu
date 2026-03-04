import type { ModuleConfig } from '@/core/module/types'

const whiteNoiseConfig: ModuleConfig = {
  id: 'white-noise',
  name: 'White Noise Mixer',
  description: 'Blend ambient tracks for focus, commute, and winding down.',
  category: 'tools',
  tags: ['focus', 'sleep', 'ambient'],
  icon: 'mdi:music-note',
  iconType: 'iconify',
  route: '/tools/white-noise',
  component: async () => {
    const mod = await import('./index.vue')
    return mod.default
  },
  meta: {
    title: 'White Noise Mixer - Breakflow',
    titleKey: 'modules.whiteNoise.name'
  },
  i18n: {
    nameKey: 'modules.whiteNoise.name',
    descriptionKey: 'modules.whiteNoise.description',
    tagKeys: [
      'modules.whiteNoise.tags.0',
      'modules.whiteNoise.tags.1',
      'modules.whiteNoise.tags.2'
    ]
  },
  enabled: true,
  order: 1
}

export default whiteNoiseConfig
