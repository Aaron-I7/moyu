/**
 * 湖泊场景 — 紫色暮色中的宁静湖畔
 * 层叠紫色山峦 + 柳树剪影 + 荷叶 + 萤火虫
 */
import { Graphics, Container } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { getSpotById } from '../../data/spots'
import { ParticleSystem } from '../effects/ParticleSystem'
import { BASE_WIDTH, BASE_HEIGHT } from '../../constants'

export class LakeScene extends BaseScene {
  private particles: ParticleSystem[] = []

  constructor() {
    const spot = getSpotById('lake')!
    super({
      palette: spot.palette,
      waterLineY: 0.58,
      groundLineY: 0.54
    })
    this.populate()
  }

  protected populate() {
    const gY = BASE_HEIGHT * 0.54

    // ── 层叠紫色山峦（薰衣草暮色） ──
    this.drawMountainLayer(0.18, 0x7A68A0, 0.30)
    this.drawMountainLayer(0.26, 0x5A4878, 0.45)
    this.drawMountainLayer(0.35, 0x3A2A58, 0.60)

    // ── 薄雾带 ──
    const mist = new Graphics()
    mist.rect(0, BASE_HEIGHT * 0.38, BASE_WIDTH, 8)
    mist.fill({ color: 0x9878A8, alpha: 0.08 })
    this.layers.farBg.addChild(mist)

    // ── 远景树丛 ──
    this.drawTreeLine(BASE_HEIGHT * 0.36, 0x1A2A2A, 0.5, 6)

    // ── 大柳树 ──
    const willow = this.drawBigWillow(BASE_WIDTH * 0.14, gY)
    this.root.addChild(willow)

    // ── 小木台 ──
    const dock = new Graphics()
    dock.rect(BASE_WIDTH * 0.18, gY - 1, 45, 4)
    dock.fill(0x2A1A12)
    dock.rect(BASE_WIDTH * 0.18, gY - 1, 45, 1)
    dock.fill({ color: 0x4A3A2A, alpha: 0.4 })
    dock.rect(BASE_WIDTH * 0.21, gY + 3, 3, 16)
    dock.fill(0x221410)
    dock.rect(BASE_WIDTH * 0.18 + 39, gY + 3, 3, 16)
    dock.fill(0x221410)
    this.root.addChild(dock)

    // ── 荷叶（暗色调） ──
    const lilyPositions = [
      { x: BASE_WIDTH * 0.50, dy: 3 },
      { x: BASE_WIDTH * 0.68, dy: 5 },
      { x: BASE_WIDTH * 0.82, dy: 2 },
    ]
    for (const pos of lilyPositions) {
      const lily = new Graphics()
      lily.circle(0, 0, 4)
      lily.fill({ color: 0x1A4A2A, alpha: 0.55 })
      lily.moveTo(-4, 0)
      lily.lineTo(0, 0)
      lily.stroke({ color: 0x0E2A14, width: 1, alpha: 0.4 })
      lily.x = pos.x
      lily.y = BASE_HEIGHT * 0.58 + pos.dy
      this.root.addChild(lily)
    }

    // ── 睡莲（淡粉点缀） ──
    const lotus = new Graphics()
    lotus.circle(0, 0, 2.5)
    lotus.fill({ color: 0xC8A0D8, alpha: 0.6 })
    lotus.circle(0, 0, 1)
    lotus.fill({ color: 0xE0C8E8, alpha: 0.7 })
    lotus.x = BASE_WIDTH * 0.52
    lotus.y = BASE_HEIGHT * 0.583
    this.root.addChild(lotus)

    // ── 萤火虫 ──
    const fireflies = new ParticleSystem({
      type: 'firefly', count: 6, speed: [4, 10],
      size: [1, 2], color: 0xC8A0D8, alpha: [0.2, 0.65],
      lifetime: [7000, 16000]
    }, BASE_WIDTH, BASE_HEIGHT * 0.45)
    fireflies.container.y = BASE_HEIGHT * 0.1
    this.root.addChild(fireflies.container)
    this.particles.push(fireflies)
  }

  /** 山峦剪影 */
  private drawMountainLayer(topRatio: number, color: number, alpha: number) {
    const g = new Graphics()
    const w = BASE_WIDTH
    const baseY = BASE_HEIGHT * 0.54
    const peakY = BASE_HEIGHT * topRatio

    g.moveTo(0, baseY)
    g.lineTo(0, peakY + 16)
    g.lineTo(w * 0.15, peakY + 4)
    g.lineTo(w * 0.28, peakY)
    g.lineTo(w * 0.42, peakY + 12)
    g.lineTo(w * 0.55, peakY + 2)
    g.lineTo(w * 0.68, peakY + 14)
    g.lineTo(w * 0.80, peakY + 6)
    g.lineTo(w * 0.92, peakY + 10)
    g.lineTo(w, peakY + 18)
    g.lineTo(w, baseY)
    g.closePath()
    g.fill({ color, alpha })

    this.layers.farBg.addChild(g)
  }

  /** 树丛剪影 */
  private drawTreeLine(y: number, color: number, alpha: number, count: number) {
    const g = new Graphics()
    const spacing = BASE_WIDTH / count
    for (let i = 0; i < count; i++) {
      const cx = spacing * i + spacing * 0.3 + Math.random() * spacing * 0.4
      const h = 16 + Math.random() * 12
      const hw = 7 + Math.random() * 5
      g.moveTo(cx, y - h)
      g.lineTo(cx - hw, y)
      g.lineTo(cx + hw, y)
      g.closePath()
      g.fill({ color, alpha })
    }
    this.layers.midBg.addChild(g)
  }

  /** 大柳树（暗色调） */
  private drawBigWillow(x: number, groundY: number): Container {
    const c = new Container()
    const g = new Graphics()

    // 树根
    g.rect(x - 7, groundY - 3, 5, 4)
    g.fill(0x120A04)
    g.rect(x + 3, groundY - 2, 5, 3)
    g.fill(0x120A04)

    // 树干
    const tw = 6, th = 32
    const tx = x - tw / 2, ty = groundY - th
    g.rect(tx, ty, tw, th)
    g.fill(0x1A1008)
    g.rect(tx + 2, ty, 1, th)
    g.fill({ color: 0x3A2A1A, alpha: 0.3 })

    // 树冠
    const canopyBase = ty - 2
    g.roundRect(x - 24, canopyBase - 6, 48, 14, 3)
    g.fill(0x0E2210)
    g.roundRect(x - 20, canopyBase - 14, 40, 12, 3)
    g.fill(0x142A18)
    g.roundRect(x - 14, canopyBase - 21, 28, 10, 3)
    g.fill(0x1A3A1E)
    g.roundRect(x - 8, canopyBase - 25, 16, 7, 2)
    g.fill(0x204A24)

    // 柳条（暗绿垂线）
    const willowLines = [
      { dx: -22, len: 38 }, { dx: -16, len: 44 },
      { dx: -10, len: 40 }, { dx: -3, len: 35 },
      { dx: 4, len: 38 }, { dx: 10, len: 46 },
      { dx: 16, len: 36 }, { dx: 20, len: 32 },
    ]
    for (const w of willowLines) {
      const wx = x + w.dx
      const wy = canopyBase - 4
      g.moveTo(wx, wy)
      g.lineTo(wx + (w.dx > 0 ? 2 : -2), wy + w.len)
      g.stroke({ color: 0x1A3A1E, width: 1, alpha: 0.35 })
    }

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
