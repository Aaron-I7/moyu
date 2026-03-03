/**
 * 深海场景 — 漆黑深渊中的微光
 * 近黑色调：柔光柱 + 暗海藻 + 遗迹石柱 + 生物荧光
 */
import { Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { getSpotById } from '../../data/spots'
import { ParticleSystem } from '../effects/ParticleSystem'
import { BASE_WIDTH, BASE_HEIGHT } from '../../constants'

export class DeepSeaScene extends BaseScene {
  private particles: ParticleSystem[] = []

  constructor() {
    const spot = getSpotById('deep-sea')!
    super({
      palette: spot.palette,
      waterLineY: 0.15,
      groundLineY: 0.85
    })
    this.populate()
  }

  protected populate() {
    const W = BASE_WIDTH
    const H = BASE_HEIGHT

    // ── 深渊覆盖（加深整体暗度） ──
    const deepOverlay = new Graphics()
    deepOverlay.rect(0, 0, W, H)
    deepOverlay.fill({ color: 0x020210, alpha: 0.5 })
    this.root.addChild(deepOverlay)

    // ── 柔光柱（3 道微弱倾斜光束） ──
    const beamPositions = [0.22, 0.50, 0.78]
    for (const bx of beamPositions) {
      const beam = new Graphics()
      const cx = W * bx
      const spread = 8 + Math.random() * 6
      beam.moveTo(cx - 2, 0)
      beam.lineTo(cx - spread, H * 0.55)
      beam.lineTo(cx + spread, H * 0.55)
      beam.lineTo(cx + 2, 0)
      beam.closePath()
      beam.fill({ color: 0x2A2A6A, alpha: 0.04 })
      this.layers.farBg.addChild(beam)
    }

    // ── 远景暗礁层 ──
    this.drawReefSilhouette(0.70, 0x0A0A24, 0.6)
    this.drawReefSilhouette(0.78, 0x08081A, 0.7)

    // ── 遗迹石柱（两根断柱） ──
    const pillar1 = new Graphics()
    pillar1.rect(0, 0, 6, 28)
    pillar1.fill({ color: 0x1A1A34, alpha: 0.7 })
    // 柱头
    pillar1.rect(-1, 0, 8, 2)
    pillar1.fill({ color: 0x24244A, alpha: 0.6 })
    // 裂纹
    pillar1.rect(2, 8, 1, 3)
    pillar1.fill({ color: 0x0A0A1E, alpha: 0.5 })
    pillar1.x = W * 0.58
    pillar1.y = H * 0.85 - 28
    this.layers.nearBg.addChild(pillar1)

    const pillar2 = new Graphics()
    pillar2.rect(0, 0, 5, 18)
    pillar2.fill({ color: 0x18182E, alpha: 0.6 })
    pillar2.rect(-1, 0, 7, 2)
    pillar2.fill({ color: 0x20203E, alpha: 0.5 })
    pillar2.x = W * 0.68
    pillar2.y = H * 0.85 - 18
    this.layers.nearBg.addChild(pillar2)

    // ── 海藻（暗色，摇曳感） ──
    const seaweedPositions = [
      { x: W * 0.12, h: 18 },
      { x: W * 0.35, h: 22 },
      { x: W * 0.72, h: 16 },
      { x: W * 0.90, h: 20 }
    ]
    for (const sw of seaweedPositions) {
      const seaweed = new Graphics()
      for (let j = 0; j < sw.h; j++) {
        const offset = Math.sin(j * 0.4) * 2
        seaweed.rect(sw.x + offset, H * 0.85 - j, 2, 1)
        seaweed.fill({ color: 0x0A2A1A, alpha: 0.5 + (j / sw.h) * 0.2 })
      }
      this.layers.ground.addChild(seaweed)
    }

    // ── 海底地面纹理 ──
    const seaFloor = new Graphics()
    for (let i = 0; i < 12; i++) {
      const fx = Math.random() * W
      const fy = H * 0.85 + Math.random() * (H * 0.12)
      seaFloor.rect(fx, fy, 2 + Math.random() * 4, 1)
      seaFloor.fill({ color: 0x121230, alpha: 0.4 })
    }
    this.layers.ground.addChild(seaFloor)

    // ── 生物荧光浮游体（星光紫） ──
    const glowOrbs = new ParticleSystem({
      type: 'glow', count: 12, speed: [1, 4],
      size: [1, 2], color: 0x6A5AAE, alpha: [0.15, 0.6],
      lifetime: [8000, 18000]
    }, W, H * 0.55)
    glowOrbs.container.y = H * 0.20
    this.layers.water.container.addChild(glowOrbs.container)
    this.particles.push(glowOrbs)

    // ── 缓慢气泡 ──
    const bubbles = new ParticleSystem({
      type: 'bubble', count: 5, speed: [2, 6],
      size: [1, 2], color: 0x3A3A6A, alpha: [0.1, 0.3],
      lifetime: [6000, 14000]
    }, W, H * 0.55)
    bubbles.container.y = H * 0.30
    this.layers.water.container.addChild(bubbles.container)
    this.particles.push(bubbles)
  }

  /** 绘制远景暗礁剪影 */
  private drawReefSilhouette(topRatio: number, color: number, alpha: number) {
    const g = new Graphics()
    const W = BASE_WIDTH
    const H = BASE_HEIGHT
    const top = H * topRatio
    const segs = 12
    const segW = W / segs
    g.moveTo(0, H * 0.85)
    for (let i = 0; i <= segs; i++) {
      const peakH = 4 + Math.sin(i * 2.1 + topRatio * 15) * 6
      g.lineTo(i * segW, top + peakH)
    }
    g.lineTo(W, H * 0.85)
    g.closePath()
    g.fill({ color, alpha })
    this.layers.farBg.addChild(g)
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
