import { defineStore } from 'pinia'
import { ref } from 'vue'

const fontScaleStorageKey = 'moyu-font-scale'

const minScale = 0.9
const maxScale = 1.25

export const useAccessibilityStore = defineStore('accessibility', () => {
  const fontScale = ref(1)

  function applyScale(scale: number): void {
    const clamped = Math.max(minScale, Math.min(maxScale, Number(scale.toFixed(2))))
    fontScale.value = clamped
    document.documentElement.style.setProperty('--font-scale', String(clamped))
    localStorage.setItem(fontScaleStorageKey, String(clamped))
  }

  function loadScale(): void {
    const stored = Number(localStorage.getItem(fontScaleStorageKey) || '1')
    if (!Number.isNaN(stored)) {
      applyScale(stored)
      return
    }
    applyScale(1)
  }

  function increaseScale(): void {
    applyScale(fontScale.value + 0.05)
  }

  function decreaseScale(): void {
    applyScale(fontScale.value - 0.05)
  }

  return {
    fontScale,
    loadScale,
    increaseScale,
    decreaseScale,
    applyScale
  }
})
