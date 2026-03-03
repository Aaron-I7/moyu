/**
 * 像素钓场 — 渔夫精灵
 * 管理角色各状态帧 + 抛竿/提竿流畅动画
 */
import { Container } from 'pixi.js'
import { createPixelSprite } from './SpriteUtils'
import { FISHERMAN_IDLE, FISHERMAN_CAST, FISHERMAN_WAIT } from '../../data/sprites'
import type { FishingState } from '../../types'

type AnimPhase = 'none' | 'cast-windup' | 'cast-throw' | 'cast-settle' | 'hook-pull'

export class FishermanSprite {
  public container: Container
  /** Inner container — bob / rotation applied here, NOT to outer container */
  private spriteRoot: Container
  private sprites: Record<string, Container> = {}
  private currentKey = 'idle'
  private bobTime = 0

  // ── Animation ──
  private animPhase: AnimPhase = 'none'
  private animTimer = 0
  private animDuration = 0

  constructor() {
    this.container = new Container()
    this.spriteRoot = new Container()
    this.container.addChild(this.spriteRoot)

    // 创建各状态精灵
    const idle = createPixelSprite(FISHERMAN_IDLE)
    const cast = createPixelSprite(FISHERMAN_CAST)
    const wait = createPixelSprite(FISHERMAN_WAIT)

    const idleC = new Container(); idleC.addChild(idle)
    const castC = new Container(); castC.addChild(cast)
    const waitC = new Container(); waitC.addChild(wait)

    this.sprites = { idle: idleC, cast: castC, wait: waitC }

    for (const [, c] of Object.entries(this.sprites)) {
      c.visible = false
      this.spriteRoot.addChild(c)
    }

    this.showFrame('idle')
  }

  private showFrame(key: string) {
    const current = this.sprites[this.currentKey]
    if (current) current.visible = false
    this.currentKey = key
    if (this.sprites[key]) this.sprites[key].visible = true
  }

  // ── Rod tip position (local to container) for fishing line ──
  /** WAIT 帧: 鱼线末端 (25,0)；CAST 帧: 竿尖 (21,0) */
  getRodTipLocal(): { x: number; y: number } {
    if (this.currentKey === 'wait') return { x: 25, y: 0 }
    if (this.currentKey === 'cast') return { x: 21, y: 0 }
    return { x: 10, y: 6 } // idle: hand area
  }

  /** 世界坐标的杆尖位置（含 bob 偏移） */
  getRodTipWorld(): { x: number; y: number } {
    const local = this.getRodTipLocal()
    return {
      x: this.container.x + local.x,
      y: this.container.y + this.spriteRoot.y + local.y
    }
  }

  // ── State machine ──
  setState(state: FishingState) {
    switch (state) {
      case 'casting':
        this.startCastAnimation()
        break
      case 'waiting':
        this.showFrame('wait')
        this.stopAnim()
        break
      case 'biting':
        this.showFrame('wait')
        // Biting — small urgent wobble handled in update via bobTime acceleration
        break
      case 'timing-game':
      case 'success':
        this.startHookPullAnimation()
        break
      default:
        this.showFrame('idle')
        this.stopAnim()
    }
  }

  // ── Casting animation ──
  private startCastAnimation() {
    this.showFrame('cast')
    this.animPhase = 'cast-windup'
    this.animTimer = 0
    this.animDuration = 250 // ms
  }

  // ── Hook pull animation ──
  private startHookPullAnimation() {
    this.showFrame('wait')
    this.animPhase = 'hook-pull'
    this.animTimer = 0
    this.animDuration = 500
  }

  private stopAnim() {
    this.animPhase = 'none'
    this.animTimer = 0
    this.spriteRoot.rotation = 0
    this.spriteRoot.y = 0
  }

  // ── Easing helpers ──
  private easeOutBack(t: number): number {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  }

  update(dt: number) {
    this.bobTime += dt * 0.002

    // ── Animation processing ──
    if (this.animPhase !== 'none') {
      this.animTimer += dt
      const t = Math.min(this.animTimer / this.animDuration, 1)

      switch (this.animPhase) {
        case 'cast-windup': {
          // Lean back
          this.spriteRoot.rotation = -0.18 * t
          if (t >= 1) {
            this.animPhase = 'cast-throw'
            this.animTimer = 0
            this.animDuration = 180
          }
          break
        }
        case 'cast-throw': {
          // Swing forward with overshoot
          const eased = this.easeOutBack(t)
          this.spriteRoot.rotation = -0.18 + 0.38 * eased
          if (t >= 1) {
            this.animPhase = 'cast-settle'
            this.animTimer = 0
            this.animDuration = 350
            this.showFrame('wait')
          }
          break
        }
        case 'cast-settle': {
          // Settle back to 0
          this.spriteRoot.rotation = 0.20 * (1 - t)
          if (t >= 1) {
            this.spriteRoot.rotation = 0
            this.spriteRoot.y = 0
            this.animPhase = 'none'
          }
          break
        }
        case 'hook-pull': {
          // Sharp pull-back arc
          const pull = Math.sin(t * Math.PI)
          this.spriteRoot.rotation = -0.25 * pull
          this.spriteRoot.y = -2 * pull
          if (t >= 1) {
            this.spriteRoot.rotation = 0
            this.spriteRoot.y = 0
            this.animPhase = 'none'
          }
          break
        }
      }
    }
  }

  setVisible(v: boolean) {
    this.container.visible = v
  }

  destroy() {
    this.container.destroy({ children: true })
  }
}
