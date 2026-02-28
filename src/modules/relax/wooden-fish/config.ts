import type { ModuleConfig } from '@/core/module/types'

const woodenFishConfig: ModuleConfig = {
  id: 'wooden-fish',
  name: '敲木鱼',
  description: '敲击木鱼，积累功德，放松身心',
  category: 'relax',
  tags: ['解压', '放松', '冥想'],
  icon: 'mdi:circle-outline',
  iconType: 'iconify',
  route: '/relax/wooden-fish',
  component: async () => {
    const mod = await import('./index.vue')
    return mod.default
  },
  meta: {
    title: '敲木鱼 - 摸鱼吧'
  },
  enabled: true,
  order: 1
}

export default woodenFishConfig
