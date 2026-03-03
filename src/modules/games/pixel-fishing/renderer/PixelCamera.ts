/**
 * 像素钓场 — PixiJS 像素摄像机
 * 控制场景容器的位移 / 缩放，实现第一 / 第三视角切换
 */
import { Container } from 'pixi.js'
import type { ViewMode } from '../types'
import { BASE_WIDTH, BASE_HEIGHT, VIEW_TRANSITION_DURATION } from '../constants'

export class PixelCamera {
  private target: Container
  private mode: ViewMode = 'third-person'
  private baseScale: number
  private transitioning = false
  private transitionStart = 0
  private fromX = 0
  private fromY = 0
  private fromScale = 1
  private toX = 0
  private toY = 0
  private toScale = 1

  private logicW = BASE_WIDTH
  private logicH = BASE_HEIGHT

  constructor(target: Container, baseScale: number = 1) {
    this.target = target
    this.baseScale = baseScale
    this.applyView('third-person', true)
  }

  get currentMode(): ViewMode {
    return this.mode
  }

  switchTo(mode: ViewMode) {
    if (mode === this.mode && !this.transitioning) return
    this.mode = mode
    this.applyView(mode, false)
  }

  setLogicSize(w: number, h: number) {
    this.logicW = w
    this.logicH = h
  }

  private applyView(mode: ViewMode, instant: boolean) {
    const bs = this.baseScale
    if (mode === 'third-person') {
      this.toX = 0
      this.toY = 0
      this.toScale = bs
    } else {
      // 第一视角：放大 1.5x，聚焦水面钓鱼区域
      const zoom = 1.5
      this.toScale = bs * zoom
      // 聚焦点（逻辑坐标中的水面/钓鱼区域）
      const focusX = this.logicW * 0.35
      const focusY = this.logicH * 0.55
      // 计算偏移使聚焦点位于画面中央
      const canvasW = this.logicW * bs
      const canvasH = this.logicH * bs
      this.toX = canvasW / 2 - focusX * this.toScale
      this.toY = canvasH / 2 - focusY * this.toScale
    }

    if (instant) {
      this.target.x = this.toX
      this.target.y = this.toY
      this.target.scale.set(this.toScale)
      this.transitioning = false
    } else {
      this.fromX = this.target.x
      this.fromY = this.target.y
      this.fromScale = this.target.scale.x
      this.transitioning = true
      this.transitionStart = performance.now()
    }
  }

  update(_dt: number) {
    if (!this.transitioning) return

    const elapsed = performance.now() - this.transitionStart
    let t = Math.min(elapsed / VIEW_TRANSITION_DURATION, 1)
    t = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2

    this.target.x = this.fromX + (this.toX - this.fromX) * t
    this.target.y = this.fromY + (this.toY - this.fromY) * t
    const s = this.fromScale + (this.toScale - this.fromScale) * t
    this.target.scale.set(s)

    if (t >= 1) {
      this.transitioning = false
    }
  }

  destroy() {
    this.transitioning = false
  }
}
