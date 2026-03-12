import { computed } from 'vue'
import { moduleRegistry } from '@/core/module/registry'
import type { ModuleConfig } from '@/core/module/types'

export function useRecommendations(currentId: string, currentTags: string[] = []) {
  const recommendations = computed<ModuleConfig[]>(() => {
    const all = moduleRegistry.getAll()
    
    // If no tags provided, return random suggestions from same category or popular ones
    // For now, simple random logic excluding current
    if (!currentTags.length) {
      return all
        .filter(m => m.id !== currentId)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
    }

    // Calculate score based on tag intersection
    return all
      .filter(m => m.id !== currentId)
      .map(m => {
        const otherTags = m.tags || []
        const intersection = otherTags.filter(t => currentTags.includes(t))
        return {
          module: m,
          score: intersection.length
        }
      })
      .sort((a, b) => b.score - a.score)
      .map(item => item.module)
      .slice(0, 3)
  })

  return {
    recommendations
  }
}
