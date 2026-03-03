/**
 * 像素钓场 — 鱼精灵
 * 从 sprites.ts 颜色配置生成鱼的像素精灵，支持游动 & 跳跃动画
 */
import { Container } from 'pixi.js'
import { createPixelSprite } from './SpriteUtils'
import { generateFishPixels, FISH_COLORS } from '../../data/sprites'

interface JumpAnim {
  active: boolean
  timer: number
  duration: number
  startX: number
  startY: number
  peakY: number
  endX: number
  endY: number
}

export class FishSprite {
  public container: Container
  private time = 0
  private swimming = true
  private swimSpeed = 1
  private jumpAnim: JumpAnim | null = null

  constructor(fishSpriteKey: string, scale = 1) {
    this.container = new Container()

    const colors = FISH_COLORS[fishSpriteKey]
    if (colors) {
      const pixels = generateFishPixels(colors.body, colors.fin, colors.belly, 0x000000, colors.accent)
      const sprite = createPixelSprite(pixels, scale)
      // 居中锚点
      sprite.x = -sprite.width / 2
      sprite.y = -sprite.height / 2
      this.container.addChild(sprite)
    }
  }

  setSwimming(v: boolean) {
    this.swimming = v
  }

  setSwimSpeed(s: number) {
    this.swimSpeed = s
  }

  /**
   * 播放鱼跃出水面 → 向竿尖弧线飞行的动画
   * @param waterY 水面 Y 坐标
   * @param targetX 目标 X（竿尖世界坐标）
   * @param targetY 目标 Y（竿尖世界坐标）
   */
  playJumpAnimation(waterY: number, targetX?: number, targetY?: number) {
    this.swimming = false
    const startX = this.container.x
    this.jumpAnim = {
      active: true,
      timer: 0,
      duration: 1600,
      startX,
      startY: waterY + 4,
      peakY: waterY - 40,
      endX: targetX ?? (startX - 25),
      endY: targetY ?? (waterY - 12)
    }
    this.container.y = waterY + 4
    this.container.rotation = 0
    this.container.scale.set(0.7)
    this.container.alpha = 0.7
  }

  update(dt: number) {
    // ── Jump animation ──
    if (this.jumpAnim?.active) {
      this.jumpAnim.timer += dt
      const t = Math.min(this.jumpAnim.timer / this.jumpAnim.duration, 1)
      const { startX, startY, peakY, endX, endY } = this.jumpAnim

      // X 平滑过渡: startX → endX
      const xProgress = Math.min(t / 0.85, 1)
      const xEased = 1 - Math.pow(1 - xProgress, 2)
      this.container.x = startX + (endX - startX) * xEased

      if (t < 0.12) {
        // Phase 0: 水花破出 (0-0.12) — 鱼从水中冒出
        const p = t / 0.12
        const eased = p * p
        this.container.y = startY - eased * 10
        this.container.scale.set(0.7 + eased * 0.6)
        this.container.alpha = 0.7 + eased * 0.3
        this.container.rotation = -0.2 * eased
      } else if (t < 0.5) {
        // Phase 1: 弧线上升 (0.12-0.5) — 跃出水面到峰值
        const p = (t - 0.12) / 0.38
        const eased = 1 - Math.pow(1 - p, 3)
        this.container.y = startY - 10 + (peakY - startY + 10) * eased
        this.container.rotation = -0.2 + eased * Math.PI * 0.8
        const scale = 1.3 + Math.sin(p * Math.PI) * 0.5
        this.container.scale.set(scale)
        this.container.alpha = 1
      } else if (t < 0.7) {
        // Phase 2: 峰值展示 (0.5-0.7) — 短暂悬停闪耀
        const p = (t - 0.5) / 0.2
        this.container.y = peakY + Math.sin(p * Math.PI) * 3
        this.container.rotation = Math.PI * 0.6 * (1 - p * 0.4)
        const flash = 1.6 + Math.sin(p * Math.PI * 3) * 0.15
        this.container.scale.set(flash)
      } else {
        // Phase 3: 向竿尖弧落 (0.7-1.0) — 靠近渔夫
        const p = (t - 0.7) / 0.3
        const eased = p * p
        this.container.y = peakY + (endY - peakY) * eased
        this.container.rotation = Math.PI * 0.36 * (1 - p)
        const scale = 1.6 - 0.4 * p
        this.container.scale.set(scale)
      }

      if (t >= 1) {
        this.jumpAnim.active = false
        this.container.rotation = 0
        this.container.scale.set(1.2)
        this.container.alpha = 1
      }
      return
    }

    // ── Swim animation ──
    if (!this.swimming) return
    this.time += dt

    // 游动摆尾
    this.container.rotation = Math.sin(this.time * 0.005 * this.swimSpeed) * 0.15
    // 上下浮动
    this.container.y += Math.cos(this.time * 0.002) * 0.05
  }

  destroy() {
    this.container.destroy({ children: true })
  }
}
