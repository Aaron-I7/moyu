import type { ModuleConfig } from '@/core/module/types'

const textFormatterConfig: ModuleConfig = {
  id: 'text-formatter',
  name: 'Text Formatter',
  description: 'Clean and normalize text with one click.',
  category: 'tools',
  tags: ['text', 'format', 'clean'],
  icon: 'mdi:text-box-edit-outline',
  iconType: 'iconify',
  route: '/tools/text-formatter',
  component: () => import('./index.vue'),
  meta: {
    title: 'Text Formatter - Breakflow',
    titleKey: 'tools.textFormatter.title',
    description: 'Clean and normalize text with one click'
  },
  i18n: {
    nameKey: 'tools.textFormatter.title',
    descriptionKey: 'tools.textFormatter.desc',
    tagKeys: ['tools.textFormatter.tags.0', 'tools.textFormatter.tags.1', 'tools.textFormatter.tags.2']
  },
  enabled: true,
  order: 6
}

export default textFormatterConfig
