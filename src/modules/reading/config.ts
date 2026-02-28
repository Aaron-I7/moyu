import type { ModuleConfig } from '@/core/module/types'

const readingConfig: ModuleConfig = {
  id: 'reading',
  name: '小说阅读',
  description: '本地小说阅读器，支持 txt 格式',
  category: 'reading',
  tags: ['阅读', '小说'],
  icon: 'mdi:book-open-page-variant',
  iconType: 'iconify',
  route: '/reading',
  component: async () => {
    const mod = await import('./index.vue')
    return mod.default
  },
  meta: {
    title: '小说阅读 - 摸鱼吧'
  },
  enabled: true,
  order: 1
}

export default readingConfig
