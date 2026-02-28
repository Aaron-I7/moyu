import type { ModuleConfig } from '@/core/module/types'

const virtualPetConfig: ModuleConfig = {
  id: 'virtual-pet',
  name: '电子宠物',
  description: '养一只可爱的像素猫咪',
  category: 'relax',
  tags: ['宠物', '养成', '像素'],
  icon: 'mdi:cat',
  iconType: 'iconify',
  route: '/relax/virtual-pet',
  component: async () => {
    const mod = await import('./index.vue')
    return mod.default
  },
  meta: {
    title: '电子宠物 - 摸鱼吧'
  },
  enabled: true,
  order: 2
}

export default virtualPetConfig
