/**
 * 海岸场景 — 落日余晖中的海岸
 * 暖调夕阳：大落日 + 灯塔剪影 + 暗沙滩 + 海鸥 + 焦糖天光
 */
import { Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { getSpotById } from '../../data/spots'
import { ParticleSystem } from '../effects/ParticleSystem'
import { BASE_WIDTH, BASE_HEIGHT } from '../../constants'

export class CoastScene extends BaseScene {
  private particles: ParticleSystem[] = []

  constructor() {
    const spot = getSpotById('coast')!
    super({
      palette: spot.palette,
      waterLineY: 0.6,
      groundLineY: 0.56
    })
    this.populate()
  }

  protected populate() {
    const W = BASE_WIDTH
    const H = BASE_HEIGHT

    // ── 大落日（半沉入海平线） ──
    const sun = new Graphics()
    // 外光晕
    sun.circle(0, 0, 28)
    sun.fill({ color: 0xE85A20, alpha: 0.08 })
    sun.circle(0, 0, 22)
    sun.fill({ color: 0xE8A050, alpha: 0.15 })
    // 日轮
    sun.circle(0, 0, 14)
    sun.fill({ color: 0xF0C060, alpha: 0.8 })
    sun.x = W * 0.7
    sun.y = H * 0.38
    this.layers.farBg.addChild(sun)

    // ── 远岛剪影层 ──
    this.drawMountainLayer(0.35, 0x5A3828, 0.55)
    this.drawMountainLayer(0.40, 0x4A2818, 0.65)

    // ── 灯塔剪影 ──
    const lighthouse = new Graphics()
    const lx = W * 0.18
    const lBase = H * 0.40
    // 塔身（梯形）
    lighthouse.moveTo(lx - 3, lBase)
    lighthouse.lineTo(lx - 2, lBase - 30)
    lighthouse.lineTo(lx + 2, lBase - 30)
    lighthouse.lineTo(lx + 3, lBase)
    lighthouse.closePath()
    lighthouse.fill({ color: 0x1A1018, alpha: 0.85 })
    // 灯室
    lighthouse.rect(lx - 3, lBase - 33, 6, 4)
    lighthouse.fill({ color: 0x1A1018, alpha: 0.85 })
    // 灯光
    lighthouse.circle(lx, lBase - 31, 2)
    lighthouse.fill({ color: 0xF0C060, alpha: 0.6 })
    // 光束
    lighthouse.moveTo(lx, lBase - 31)
    lighthouse.lineTo(lx - 20, lBase - 40)
    lighthouse.lineTo(lx + 20, lBase - 40)
    lighthouse.closePath()
    lighthouse.fill({ color: 0xF0C060, alpha: 0.04 })
    this.layers.midBg.addChild(lighthouse)

    // ── 暗色沙滩 ──
    const sand = new Graphics()
    sand.rect(0, H * 0.56, W, H * 0.44)
    sand.fill(0x4A3828)
    // 潮湿带（靠近水线）
    sand.rect(0, H * 0.56, W, 3)
    sand.fill({ color: 0x2A1A10, alpha: 0.6 })
    // 远沙纹理
    for (let i = 0; i < 8; i++) {
      const sx = Math.random() * W
      const sy = H * 0.62 + Math.random() * (H * 0.3)
      sand.rect(sx, sy, 3 + Math.random() * 5, 1)
      sand.fill({ color: 0x5A4838, alpha: 0.4 })
    }
    this.layers.ground.addChild(sand)

    // ── 近景礁石 ──
    const rock = new Graphics()
    rock.roundRect(0, 0, 12, 7, 2)
    rock.fill({ color: 0x2A1A10, alpha: 0.8 })
    rock.roundRect(10, 2, 8, 5, 2)
    rock.fill({ color: 0x3A2818, alpha: 0.7 })
    rock.x = W * 0.82
    rock.y = H * 0.54
    this.layers.nearBg.addChild(rock)

    // ── 海鸥粒子 ──
    const seagulls = new ParticleSystem({
      type: 'seagull', count: 3, speed: [8, 15],
      size: [2, 3], color: 0x1A1018, alpha: [0.5, 0.7],
      lifetime: [12000, 22000]
    }, W, H * 0.3)
    this.layers.farBg.addChild(seagulls.container)
    this.particles.push(seagulls)

    // ── 漂浮光斑（海面反光） ──
    const sparkles = new ParticleSystem({
      type: 'firefly', count: 4, speed: [2, 5],
      size: [1, 1], color: 0xF0C060, alpha: [0.2, 0.5],
      lifetime: [4000, 8000]
    }, W, H * 0.06)
    sparkles.container.y = H * 0.57
    this.layers.water.container.addChild(sparkles.container)
    this.particles.push(sparkles)
  }

  /** 绘制远岛/小丘剪影 */
  private drawMountainLayer(topRatio: number, color: number, alpha: number) {
    const g = new Graphics()
    const W = BASE_WIDTH
    const H = BASE_HEIGHT
    const top = H * topRatio
    const segs = 10
    const segW = W / segs
    g.moveTo(0, H * 0.56)
    for (let i = 0; i <= segs; i++) {
      const peakH = 6 + Math.sin(i * 1.7 + topRatio * 20) * 8
      g.lineTo(i * segW, top + peakH)
    }
    g.lineTo(W, H * 0.56)
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
