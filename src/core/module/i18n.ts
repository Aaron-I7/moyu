import type { ModuleConfig } from './types'

type Translate = (key: string, fallback?: string) => string

export function resolveModuleName(t: Translate, module: ModuleConfig): string {
  if (!module.i18n?.nameKey) {
    return module.name
  }
  return t(module.i18n.nameKey, module.name)
}

export function resolveModuleDescription(t: Translate, module: ModuleConfig): string {
  if (!module.i18n?.descriptionKey) {
    return module.description
  }
  return t(module.i18n.descriptionKey, module.description)
}

export function resolveModuleTags(t: Translate, module: ModuleConfig): string[] {
  if (!module.i18n?.tagKeys || module.i18n.tagKeys.length === 0) {
    return module.tags || []
  }
  return module.i18n.tagKeys.map((key, index) => t(key, module.tags?.[index] || key))
}
