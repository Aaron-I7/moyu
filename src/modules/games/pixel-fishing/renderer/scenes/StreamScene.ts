/**
 * 溪流场景 — 暖色调山间溪畔
 * 层叠山峦 + 大树剪影 + 木栈桥 + 暖光氛围
 */
import { Graphics, Container } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { getSpotById } from '../../data/spots'
import { ParticleSystem } from '../effects/ParticleSystem'
import { BASE_WIDTH, BASE_HEIGHT } from '../../constants'

export class StreamScene extends BaseScene {
  private particles: ParticleSystem[] = []

  constructor() {
    const spot = getSpotById('stream')!
    super({
      palette: spot.palette,
      waterLineY: 0.62,
      groundLineY: 0.58
    })
    this.populate()
  }

  protected populate() {
    const gY = BASE_HEIGHT * 0.58

    // ── 层叠山峦剪影（3 层，由远到近颜色加深） ──
    this.drawMountainLayer(0.20, 0x8A7A60, 0.35) // 远山：暖灰
    this.drawMountainLayer(0.30, 0x6A5A40, 0.50) // 中山：深棕
    this.drawMountainLayer(0.38, 0x4A3A28, 0.65) // 近山：暗褐

    // ── 远景树丛剪影 ──
    this.drawTreeLine(BASE_HEIGHT * 0.38, 0x1A3A1A, 0.6, 5)

    // ── 一棵大树（左侧，暗色调） ──
    const tree = this.drawBigTree(BASE_WIDTH * 0.12, gY)
    this.root.addChild(tree)

    // ── 木栈桥（渔夫脚下的平台） ──
    const dock = this.drawDock(BASE_WIDTH * 0.2, gY)
    this.root.addChild(dock)

    // ── 右侧远景小树 ──
    const smallTree = this.drawSmallTree(BASE_WIDTH * 0.82, gY)
    this.root.addChild(smallTree)

    // ── 暖光光斑 ──
    const dapples = new Graphics()
    const spots = [
      { x: 25, y: gY - 6, w: 4, h: 2, a: 0.06 },
      { x: 55, y: gY - 3, w: 3, h: 2, a: 0.05 },
      { x: 42, y: gY - 20, w: 3, h: 2, a: 0.04 },
    ]
    for (const s of spots) {
      dapples.rect(s.x, s.y, s.w, s.h)
      dapples.fill({ color: 0xD4A44A, alpha: s.a })
    }
    this.root.addChild(dapples)

    // ── 落叶粒子（暖色调） ──
    const leaves = new ParticleSystem({
      type: 'leaf', count: 3, speed: [3, 7],
      size: [2, 3], color: 0x8A6A30, alpha: [0.3, 0.55],
      lifetime: [10000, 20000]
    }, BASE_WIDTH * 0.6, BASE_HEIGHT * 0.5)
    leaves.container.x = BASE_WIDTH * 0.05
    this.root.addChild(leaves.container)
    this.particles.push(leaves)

    // ── 萤火虫（少量，增加氛围） ──
    const fireflies = new ParticleSystem({
      type: 'firefly', count: 3, speed: [3, 8],
      size: [1, 1], color: 0xD4A44A, alpha: [0.15, 0.5],
      lifetime: [8000, 18000]
    }, BASE_WIDTH * 0.8, BASE_HEIGHT * 0.4)
    fireflies.container.y = BASE_HEIGHT * 0.2
    this.root.addChild(fireflies.container)
    this.particles.push(fireflies)
  }

  /** 绘制一层山峦剪影 */
  private drawMountainLayer(topRatio: number, color: number, alpha: number) {
    const g = new Graphics()
    const w = BASE_WIDTH
    const baseY = BASE_HEIGHT * 0.58
    const peakY = BASE_HEIGHT * topRatio

    // 多峰不规则山体
    g.moveTo(0, baseY)
    g.lineTo(0, peakY + 20)
    g.lineTo(w * 0.12, peakY + 8)
    g.lineTo(w * 0.22, peakY)
    g.lineTo(w * 0.35, peakY + 15)
    g.lineTo(w * 0.45, peakY + 5)
    g.lineTo(w * 0.58, peakY + 18)
    g.lineTo(w * 0.70, peakY + 3)
    g.lineTo(w * 0.82, peakY + 12)
    g.lineTo(w * 0.92, peakY + 6)
    g.lineTo(w, peakY + 16)
    g.lineTo(w, baseY)
    g.closePath()
    g.fill({ color, alpha })

    this.layers.farBg.addChild(g)
  }

  /** 绘制远景树丛剪影 */
  private drawTreeLine(y: number, color: number, alpha: number, count: number) {
    const g = new Graphics()
    const spacing = BASE_WIDTH / count

    for (let i = 0; i < count; i++) {
      const cx = spacing * i + spacing * 0.3 + Math.random() * spacing * 0.4
      const h = 18 + Math.random() * 14
      const hw = 8 + Math.random() * 6
      // 三角形树冠
      g.moveTo(cx, y - h)
      g.lineTo(cx - hw, y)
      g.lineTo(cx + hw, y)
      g.closePath()
      g.fill({ color, alpha })
      // 树干
      g.rect(cx - 1, y, 2, 6)
      g.fill({ color: 0x2A1A0A, alpha: alpha * 0.8 })
    }

    this.layers.midBg.addChild(g)
  }

  /** 大树剪影 */
  private drawBigTree(x: number, groundY: number): Container {
    const c = new Container()
    const g = new Graphics()

    // 树干
    const tw = 7, th = 40
    const tx = x - tw / 2, ty = groundY - th
    g.rect(tx, ty, tw, th)
    g.fill(0x1A0E06)
    // 树干高光
    g.rect(tx + 2, ty, 1, th)
    g.fill({ color: 0x3A2A1A, alpha: 0.4 })

    // 树根
    g.rect(x - 8, groundY - 4, 5, 5)
    g.fill(0x1A0E06)
    g.rect(x + 4, groundY - 3, 5, 4)
    g.fill(0x1A0E06)

    // 树冠（圆润层叠，暗绿色调）
    const canopyBase = ty - 2
    // 底层
    g.roundRect(x - 30, canopyBase - 6, 60, 16, 4)
    g.fill(0x0E2A12)
    // 中层
    g.roundRect(x - 24, canopyBase - 16, 48, 14, 4)
    g.fill(0x143A18)
    // 上层
    g.roundRect(x - 18, canopyBase - 24, 36, 12, 3)
    g.fill(0x1A4A22)
    // 顶层
    g.roundRect(x - 10, canopyBase - 29, 20, 8, 3)
    g.fill(0x1E5A28)

    // 树冠微光（暖色点缀）
    g.roundRect(x - 6, canopyBase - 26, 5, 3, 1)
    g.fill({ color: 0x3A6A3A, alpha: 0.3 })
    g.roundRect(x + 10, canopyBase - 18, 4, 3, 1)
    g.fill({ color: 0x3A6A3A, alpha: 0.2 })

    c.addChild(g)
    return c
  }

  /** 木栈桥 */
  private drawDock(x: number, groundY: number): Container {
    const c = new Container()
    const g = new Graphics()
    const dockW = 55, dockH = 5

    // 桥面
    g.rect(x, groundY - 1, dockW, dockH)
    g.fill(0x3A2518)
    // 桥面纹理
    for (let i = 0; i < 5; i++) {
      g.rect(x + i * 11, groundY, 10, 1)
      g.fill({ color: 0x2A1A0E, alpha: 0.3 })
    }
    // 桥柱
    g.rect(x + 3, groundY + 4, 3, 18)
    g.fill(0x2A1810)
    g.rect(x + dockW - 6, groundY + 4, 3, 18)
    g.fill(0x2A1810)
    // 桥面高光
    g.rect(x, groundY - 1, dockW, 1)
    g.fill({ color: 0x6A4A28, alpha: 0.4 })

    c.addChild(g)
    return c
  }

  /** 小树 */
  private drawSmallTree(x: number, groundY: number): Container {
    const c = new Container()
    const g = new Graphics()

    g.rect(x - 2, groundY - 18, 4, 18)
    g.fill(0x1A0E06)

    g.roundRect(x - 10, groundY - 30, 20, 16, 3)
    g.fill(0x122A14)
    g.roundRect(x - 7, groundY - 35, 14, 10, 2)
    g.fill(0x183A1C)

    c.addChild(g)
    return c
  }

  override update(dt: number, viewMode: 'first-person' | 'third-person') {
    super.update(dt, viewMode)
    this.particles.forEach(p => p.update(dt))
  }

  override destroy() {
    this.particles.forEach(p => p.destroy())
    super.destroy()
  }
}
