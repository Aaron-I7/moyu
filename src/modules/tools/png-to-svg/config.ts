import type { ModuleConfig } from '@/core/module/types'

const pngToSvgConfig: ModuleConfig = {
  id: 'png-to-svg',
  name: 'PNG转SVG',
  description: '将PNG图片转换为SVG矢量图，支持多种转换模式',
  category: 'tools',
  tags: ['图片处理', '转换', 'SVG'],
  icon: 'mdi:image-outline',
  iconType: 'iconify',
  route: '/tools/png-to-svg',
  component: async () => {
    const mod = await import('./index.vue')
    return mod.default
  },
  meta: {
    title: 'PNG转SVG - 摸鱼吧'
  },
  enabled: true,
  order: 2
}

export default pngToSvgConfig
