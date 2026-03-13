import type { ModuleConfig } from '@/core/module/types'

const textDiffConfig: ModuleConfig = {
  id: 'text-diff',
  name: 'Text Diff',
  description: 'Compare two text versions line-by-line.',
  category: 'tools',
  tags: ['diff', 'text', 'review'],
  icon: 'mdi:file-compare',
  iconType: 'iconify',
  route: '/tools/text-diff',
  component: () => import('./index.vue'),
  meta: {
    title: 'Text Diff - Breakflow',
    titleKey: 'tools.textDiff.title',
    description: 'Compare two text versions line-by-line'
  },
  i18n: {
    nameKey: 'tools.textDiff.title',
    descriptionKey: 'tools.textDiff.desc',
    tagKeys: ['tools.textDiff.tags.0', 'tools.textDiff.tags.1', 'tools.textDiff.tags.2']
  },
  enabled: true,
  order: 5
}

export default textDiffConfig
