import type { Router } from 'vue-router'

const routes = ['/', '/relax', '/games', '/tools', '/reading']

export function bindGestureNavigation(el: HTMLElement, router: Router): () => void {
  let startX = 0
  let startY = 0
  let active = false

  const onStart = (event: TouchEvent) => {
    if (event.touches.length !== 1) {
      return
    }
    const touch = event.touches[0]
    if (!touch) {
      return
    }
    startX = touch.clientX
    startY = touch.clientY
    active = true
  }

  const onEnd = (event: TouchEvent) => {
    if (!active || event.changedTouches.length !== 1) {
      return
    }
    active = false
    const touch = event.changedTouches[0]
    if (!touch) {
      return
    }
    const deltaX = touch.clientX - startX
    const deltaY = touch.clientY - startY
    if (Math.abs(deltaX) < 80 || Math.abs(deltaY) > 48) {
      return
    }
    const currentIndex = routes.findIndex(path => path === router.currentRoute.value.path)
    const safeIndex = currentIndex < 0 ? 0 : currentIndex
    const targetIndex = deltaX > 0 ? Math.max(0, safeIndex - 1) : Math.min(routes.length - 1, safeIndex + 1)
    const target = routes[targetIndex]
    if (target && target !== router.currentRoute.value.path) {
      router.push(target)
    }
  }

  el.addEventListener('touchstart', onStart, { passive: true })
  el.addEventListener('touchend', onEnd, { passive: true })

  return () => {
    el.removeEventListener('touchstart', onStart)
    el.removeEventListener('touchend', onEnd)
  }
}
