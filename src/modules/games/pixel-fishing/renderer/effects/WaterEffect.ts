/**
 * 像素钓场 — 水面效果
 * 暗色调水面：深水渐变 + 柔和波浪 + 多层波纹线 + 水面高光
 */
import { Container, Graphics } from 'pixi.js'

export class WaterEffect {
  public container: Container
  private surfaceGfx: Graphics
  private deepGfx: Graphics
  private width: number
  private height: number
  private surfaceColor: number
  private deepColor: number
  private time = 0
  private wavePoints: number[] = []
  private waveCount = 20

  constructor(width: number, height: number, surfaceColor: number, deepColor: number) {
    this.width = width
    this.height = height
    this.surfaceColor = surfaceColor
    this.deepColor = deepColor
    this.container = new Container()

    // 深水背景 — 使用多层渐变模拟深度
    this.deepGfx = new Graphics()
    this.buildDeepWater()
    this.container.addChild(this.deepGfx)

    // 水面波浪
    this.surfaceGfx = new Graphics()
    this.container.addChild(this.surfaceGfx)

    // 初始化波浪点
    for (let i = 0; i <= this.waveCount; i++) {
      this.wavePoints.push(0)
    }

    this.drawSurface()
  }

  /** 构建深水多层渐变背景 */
  private buildDeepWater() {
    const g = this.deepGfx
    const bands = 5
    const bandH = this.height / bands
    for (let b = 0; b < bands; b++) {
      const t = b / (bands - 1)
      const color = this.lerpColor(this.surfaceColor, this.deepColor, t)
      const alpha = 0.75 + t * 0.2 // 越深越不透明
      g.rect(0, 3 + b * bandH, this.width, bandH + 1)
      g.fill({ color, alpha })
    }
  }

  /** 颜色线性插值 */
  private lerpColor(a: number, b: number, t: number): number {
    const ar = (a >> 16) & 0xFF, ag = (a >> 8) & 0xFF, ab = a & 0xFF
    const br = (b >> 16) & 0xFF, bg = (b >> 8) & 0xFF, bb = b & 0xFF
    const r = Math.round(ar + (br - ar) * t)
    const g = Math.round(ag + (bg - ag) * t)
    const bl = Math.round(ab + (bb - ab) * t)
    return (r << 16) | (g << 8) | bl
  }

  update(dt: number) {
    this.time += dt

    // 更新波浪点 — 双频叠加生成柔和波浪
    for (let i = 0; i <= this.waveCount; i++) {
      const phase = (i / this.waveCount) * Math.PI * 4
      this.wavePoints[i] = Math.sin(this.time * 0.0018 + phase) * 1.8 +
        Math.sin(this.time * 0.0008 + phase * 0.6) * 0.8
    }

    this.drawSurface()
  }

  private drawSurface() {
    const g = this.surfaceGfx
    g.clear()

    const segW = this.width / this.waveCount

    // ── 水面主体半透明层 ──
    g.moveTo(0, (this.wavePoints[0] ?? 0) + 2)
    for (let i = 1; i <= this.waveCount; i++) {
      g.lineTo(i * segW, (this.wavePoints[i] ?? 0) + 2)
    }
    g.lineTo(this.width, this.height)
    g.lineTo(0, this.height)
    g.closePath()
    g.fill({ color: this.surfaceColor, alpha: 0.35 })

    // ── 水面高光线（明亮的表面线条） ──
    g.moveTo(0, this.wavePoints[0] ?? 0)
    for (let i = 1; i <= this.waveCount; i++) {
      g.lineTo(i * segW, this.wavePoints[i] ?? 0)
    }
    g.stroke({ color: 0xFFFFFF, alpha: 0.25, width: 1 })

    // ── 水面下方柔和高光带 ──
    g.moveTo(0, (this.wavePoints[0] ?? 0) + 3)
    for (let i = 1; i <= this.waveCount; i++) {
      g.lineTo(i * segW, (this.wavePoints[i] ?? 0) + 3)
    }
    g.lineTo(this.width, 6)
    g.lineTo(0, 6)
    g.closePath()
    g.fill({ color: 0xFFFFFF, alpha: 0.06 })

    // ── 多层波纹装饰线（5层，越深越弱） ──
    for (let row = 0; row < 5; row++) {
      const yOff = 7 + row * 10
      const alpha = 0.16 - row * 0.025
      if (alpha <= 0) break
      g.moveTo(0, yOff + (this.wavePoints[0] ?? 0) * 0.4)
      for (let i = 1; i <= this.waveCount; i++) {
        const waveInfluence = 0.3 - row * 0.04
        g.lineTo(
          i * segW,
          yOff + (this.wavePoints[i] ?? 0) * waveInfluence +
            Math.sin(this.time * 0.0012 + row * 0.8 + i * 0.5) * 1.2
        )
      }
      g.stroke({ color: 0xFFFFFF, alpha, width: 1 })
    }
  }

  /** 在指定位置产生涟漪（抛竿水花） */
  createRipple(centerIndex: number) {
    for (let i = 0; i <= this.waveCount; i++) {
      const dist = Math.abs(i - centerIndex)
      const strength = Math.max(0, 6 - dist * 0.7)
      const direction = (i < centerIndex) ? -1 : 1
      this.wavePoints[i] = (this.wavePoints[i] ?? 0) + strength * direction + (Math.random() - 0.5) * 2
    }
  }

  destroy() {
    this.container.destroy({ children: true })
  }
}
