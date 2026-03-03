/**
 * 河流场景 — 冷色调峡谷急流
 * 陡峭岩壁 + 雾蓝山峦 + 湍急水雾
 */
import { Graphics } from 'pixi.js'
import { BaseScene } from './BaseScene'
import { getSpotById } from '../../data/spots'
import { ParticleSystem } from '../effects/ParticleSystem'
import { BASE_WIDTH, BASE_HEIGHT } from '../../constants'

export class RiverScene extends BaseScene {
  private particles: ParticleSystem[] = []

  constructor() {
    const spot = getSpotById('river')!
    super({
      palette: spot.palette,
      waterLineY: 0.65,
      groundLineY: 0.6
    })
    this.populate()
  }

  protected populate() {
    const gY = BASE_HEIGHT * 0.6

    // ── 层叠冷色山峦 ──
    this.drawMountainLayer(0.10, 0x7A8A98, 0.25) // 远山：冷灰蓝
    this.drawMountainLayer(0.18, 0x5A6A78, 0.40) // 中山
    this.drawMountainLayer(0.28, 0x3A4A58, 0.55) // 近山

    // ── 峡谷左岸岩壁 ──
    const leftCliff = new Graphics()
    leftCliff.moveTo(0, BASE_HEIGHT * 0.18)
    leftCliff.lineTo(30, BASE_HEIGHT * 0.22)
    leftCliff.lineTo(18, gY)
    leftCliff.lineTo(0, gY)
    leftCliff.closePath()
    leftCliff.fill({ color: 0x3A3A44, alpha: 0.7 })
    // 岩壁纹理线
    leftCliff.rect(6, BASE_HEIGHT * 0.30, 8, 1)
    leftCliff.fill({ color: 0x2A2A34, alpha: 0.3 })
    leftCliff.rect(3, BASE_HEIGHT * 0.42, 10, 1)
    leftCliff.fill({ color: 0x2A2A34, alpha: 0.25 })
    this.layers.midBg.addChild(leftCliff)

    // ── 峡谷右岸岩壁 ──
    const rightCliff = new Graphics()
    rightCliff.moveTo(BASE_WIDTH, BASE_HEIGHT * 0.16)
    rightCliff.lineTo(BASE_WIDTH - 35, BASE_HEIGHT * 0.20)
    rightCliff.lineTo(BASE_WIDTH - 22, gY)
    rightCliff.lineTo(BASE_WIDTH, gY)
    rightCliff.closePath()
    rightCliff.fill({ color: 0x2E2E38, alpha: 0.65 })
    this.layers.midBg.addChild(rightCliff)

    // ── 近景小松树 ──
    const pineG = new Graphics()
    const px = BASE_WIDTH * 0.08
    // 树干
    pineG.rect(px - 1.5, gY - 18, 3, 18)
    pineG.fill(0x1A0E06)
    // 树冠（三角层叠）
    pineG.moveTo(px, gY - 38)
    pineG.lineTo(px - 8, gY - 20)
    pineG.lineTo(px + 8, gY - 20)
    pineG.closePath()
    pineG.fill(0x0E2A14)
    pineG.moveTo(px, gY - 32)
    pineG.lineTo(px - 10, gY - 14)
    pineG.lineTo(px + 10, gY - 14)
    pineG.closePath()
    pineG.fill(0x122A16)
    this.root.addChild(pineG)

    // ── 水中岩石（暗色） ──
    const rock = new Graphics()
    rock.roundRect(0, 0, 12, 8, 2)
    rock.fill({ color: 0x3A3A44, alpha: 0.6 })
    rock.rect(2, 0, 8, 1)
    rock.fill({ color: 0x5A5A64, alpha: 0.3 })
    rock.x = BASE_WIDTH * 0.55
    rock.y = gY + 3
    this.root.addChild(rock)

    // ── 急流白线 ──
    const rapids = new Graphics()
    for (let i = 0; i < 4; i++) {
      const rx = BASE_WIDTH * 0.25 + i * 45
      const ry = BASE_HEIGHT * 0.63 + i * 1.5
      rapids.moveTo(rx, ry)
      rapids.lineTo(rx + 14, ry - 1)
      rapids.stroke({ color: 0xB0C8D0, alpha: 0.15, width: 1 })
    }
    this.root.addChild(rapids)

    // ── 水雾粒子 ──
    const mist = new ParticleSystem({
      type: 'splash', count: 5, speed: [3, 8],
      size: [1, 2], color: 0xB0C8D0, alpha: [0.08, 0.20],
      lifetime: [6000, 12000]
    }, BASE_WIDTH, BASE_HEIGHT * 0.18)
    mist.container.y = BASE_HEIGHT * 0.56
    this.root.addChild(mist.container)
    this.particles.push(mist)
  }

  /** 山峦剪影 */
  private drawMountainLayer(topRatio: number, color: number, alpha: number) {
    const g = new Graphics()
    const w = BASE_WIDTH
    const baseY = BASE_HEIGHT * 0.6
    const peakY = BASE_HEIGHT * topRatio

    g.moveTo(0, baseY)
    g.lineTo(0, peakY + 14)
    g.lineTo(w * 0.10, peakY + 2)
    g.lineTo(w * 0.25, peakY)
    g.lineTo(w * 0.38, peakY + 10)
    g.lineTo(w * 0.50, peakY + 4)
    g.lineTo(w * 0.62, peakY + 16)
    g.lineTo(w * 0.75, peakY + 2)
    g.lineTo(w * 0.88, peakY + 8)
    g.lineTo(w, peakY + 12)
    g.lineTo(w, baseY)
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
