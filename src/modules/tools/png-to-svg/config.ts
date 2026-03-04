import type { ModuleConfig } from '@/core/module/types'

const pngToSvgConfig: ModuleConfig = {
  id: 'png-to-svg',
  name: 'PNG to SVG',
  description: 'Convert PNG images into scalable vectors with flexible modes.',
  category: 'tools',
  tags: ['image', 'convert', 'svg'],
  icon: 'mdi:image-outline',
  iconType: 'iconify',
  route: '/tools/png-to-svg',
  component: async () => {
    const mod = await import('./index.vue')
    return mod.default
  },
  meta: {
    title: 'PNG to SVG - Breakflow',
    titleKey: 'modules.pngToSvg.name'
  },
  i18n: {
    nameKey: 'modules.pngToSvg.name',
    descriptionKey: 'modules.pngToSvg.description',
    tagKeys: [
      'modules.pngToSvg.tags.0',
      'modules.pngToSvg.tags.1',
      'modules.pngToSvg.tags.2'
    ]
  },
  enabled: true,
  order: 2
}

export default pngToSvgConfig
