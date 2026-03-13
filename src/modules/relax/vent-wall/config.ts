import type { ModuleConfig } from '@/core/module/types'

const ventWallConfig: ModuleConfig = {
  id: 'vent-wall',
  name: 'Vent Wall',
  description: 'Post and read short vents with fellow break buddies.',
  category: 'relax',
  tags: ['social', 'vent', 'text'],
  icon: 'mdi:message-text-outline',
  iconType: 'iconify',
  route: '/relax/vent-wall',
  component: async () => {
    const mod = await import('./index.vue')
    return mod.default
  },
  meta: {
    title: 'Vent Wall - Breakflow',
    titleKey: 'modules.ventWall.name',
    descriptionKey: 'modules.ventWall.description'
  },
  i18n: {
    nameKey: 'modules.ventWall.name',
    descriptionKey: 'modules.ventWall.description',
    tagKeys: ['modules.ventWall.tags.0', 'modules.ventWall.tags.1', 'modules.ventWall.tags.2']
  },
  enabled: true,
  order: 3
}

export default ventWallConfig
