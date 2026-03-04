import type { ModuleConfig } from '@/core/module/types'

const virtualPetConfig: ModuleConfig = {
  id: 'virtual-pet',
  name: 'Virtual Pet',
  description: 'Take care of a tiny buddy between meetings and tasks.',
  category: 'relax',
  tags: ['pet', 'habit', 'companion'],
  icon: 'mdi:cat',
  iconType: 'iconify',
  route: '/relax/virtual-pet',
  component: async () => {
    const mod = await import('./index.vue')
    return mod.default
  },
  meta: {
    title: 'Virtual Pet - Breakflow',
    titleKey: 'modules.virtualPet.name'
  },
  i18n: {
    nameKey: 'modules.virtualPet.name',
    descriptionKey: 'modules.virtualPet.description',
    tagKeys: [
      'modules.virtualPet.tags.0',
      'modules.virtualPet.tags.1',
      'modules.virtualPet.tags.2'
    ]
  },
  enabled: true,
  order: 2
}

export default virtualPetConfig
