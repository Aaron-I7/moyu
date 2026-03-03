import type { ModuleConfig } from '@/core/module/types'

const pixelFishingConfig: ModuleConfig = {
  id: 'pixel-fishing',
  name: '像素钓场',
  description: '全像素风格的沉浸式钓鱼体验，5 大钓点、40 种鱼类等你探索',
  category: 'games',
  tags: ['像素', '钓鱼', '休闲', '收集'],
  icon: 'mdi:fishbowl',
  iconType: 'iconify',
  route: '/games/pixel-fishing',
  component: () => import('./index.vue'),
  meta: {
    title: '像素钓场 - 摸鱼吧',
    description: '全像素风格的沉浸式钓鱼体验'
  },
  enabled: true,
  order: 2
}

export default pixelFishingConfig
