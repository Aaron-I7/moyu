import type { ModuleConfig } from '@/core/module/types'

const whiteNoiseConfig: ModuleConfig = {
  id: 'white-noise',
  name: '白噪音',
  description: '多种白噪音混合播放，助你专注放松',
  category: 'tools',
  tags: ['放松', '专注', '睡眠'],
  icon: 'mdi:music-note',
  iconType: 'iconify',
  route: '/tools/white-noise',
  component: async () => {
    const mod = await import('./index.vue')
    return mod.default
  },
  meta: {
    title: '白噪音 - 摸鱼吧'
  },
  enabled: true,
  order: 1
}

export default whiteNoiseConfig
