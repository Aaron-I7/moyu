import type { ModuleConfig } from '@/core/module/types'

const imageQuickEditConfig: ModuleConfig = {
  id: 'image-quick-edit',
  name: 'Image Quick Edit',
  description: 'Resize and convert image format locally.',
  category: 'tools',
  tags: ['image', 'resize', 'convert'],
  icon: 'mdi:image-edit-outline',
  iconType: 'iconify',
  route: '/tools/image-quick-edit',
  component: () => import('./index.vue'),
  meta: {
    title: 'Image Quick Edit - Breakflow',
    titleKey: 'tools.imageQuickEdit.title',
    description: 'Resize and convert image format locally'
  },
  i18n: {
    nameKey: 'tools.imageQuickEdit.title',
    descriptionKey: 'tools.imageQuickEdit.desc',
    tagKeys: ['tools.imageQuickEdit.tags.0', 'tools.imageQuickEdit.tags.1', 'tools.imageQuickEdit.tags.2']
  },
  enabled: true,
  order: 8
}

export default imageQuickEditConfig
