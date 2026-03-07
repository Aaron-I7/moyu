import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ThemeId, ThemeConfig } from './config'
import { themes } from './config'
import { useCloudSync } from '@/composables/useCloudSync'

export const useThemeStore = defineStore('theme', () => {
  const { pushData } = useCloudSync()
  const themeStorageKey = 'moyu-theme-id'
  const currentThemeId = ref<ThemeId>('day')
  const currentTheme = ref<ThemeConfig>(themes.day)

  const setTheme = (themeId: ThemeId) => {
    if (themes[themeId]) {
      currentThemeId.value = themeId
      currentTheme.value = themes[themeId]
      applyTheme(themes[themeId])
      localStorage.setItem(themeStorageKey, themeId)
      pushData('theme', themeId)
    }
  }

  const applyTheme = (theme: ThemeConfig) => {
    const root = document.documentElement
    
    root.style.setProperty('--font-family', theme.fontFamily)
    root.style.setProperty('--color-primary', theme.colors.primary)
    root.style.setProperty('--color-secondary', theme.colors.secondary)
    root.style.setProperty('--color-accent', theme.colors.accent)
    root.style.setProperty('--color-background', theme.colors.background)
    root.style.setProperty('--color-surface', theme.colors.surface)
    root.style.setProperty('--color-text', theme.colors.text)
    root.style.setProperty('--color-text-secondary', theme.colors.textSecondary)
    root.style.setProperty('--color-border', theme.colors.border)
    root.style.setProperty('--color-success', theme.colors.success)
    root.style.setProperty('--color-warning', theme.colors.warning)
    root.style.setProperty('--color-error', theme.colors.error)
    root.style.setProperty('--color-mint', theme.colors.mint)
    root.style.setProperty('--color-orange', theme.colors.orange)
    root.style.setProperty('--shadow', theme.effects.shadow)
    root.style.setProperty('--border-radius', theme.effects.borderRadius)
    root.style.setProperty('--transition', theme.effects.transition)
    
    if (theme.effects.glow) {
      root.style.setProperty('--glow', theme.effects.glow)
    } else {
      root.style.removeProperty('--glow')
    }
    
    root.setAttribute('data-theme', theme.id)
    
    if (theme.effects.scanlines) {
      root.classList.add('scanlines')
    } else {
      root.classList.remove('scanlines')
    }
    
    if (theme.effects.pixelBorder) {
      root.classList.add('pixel-border')
    } else {
      root.classList.remove('pixel-border')
    }
  }

  const loadTheme = () => {
    const legacyMap: Record<string, ThemeId> = {
      default: 'day',
      slate: 'pixel',
      midnight: 'night'
    }
    const storedRaw = localStorage.getItem(themeStorageKey)
    const normalized = storedRaw ? (legacyMap[storedRaw] || storedRaw) : null
    const storedTheme = normalized as ThemeId | null
    const fallback: ThemeId = 'day'
    const targetTheme = storedTheme && themes[storedTheme] ? storedTheme : fallback
    setTheme(targetTheme)
  }

  const cycleTheme = () => {
    const themeIds = Object.keys(themes) as ThemeId[]
    const currentIndex = themeIds.indexOf(currentThemeId.value)
    const nextIndex = (currentIndex + 1) % themeIds.length
    const nextTheme = themeIds[nextIndex]
    if (nextTheme) {
      setTheme(nextTheme)
    }
  }

  return {
    currentThemeId,
    currentTheme,
    setTheme,
    loadTheme,
    cycleTheme
  }
})
