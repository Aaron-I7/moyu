/**
 * 像素钓场 — 浮标精灵
 * 在水面浮动，咬钩时剧烈抖动
 */
import { Container, Graphics } from 'pixi.js'
import { createPixelSprite } from './SpriteUtils'
import { BOBBER_SPRITE } from '../../data/sprites'


export class BobberSprite {
  public container: Container
  private sprite: Container
  private line: Graphics
  private time = 0
  private biting = false
  private visible = false

  constructor() {
    this.container = new Container()

    // 鱼线
    this.line = new Graphics()
    this.container.addChild(this.line)

    // 浮标
    this.sprite = new Container()
    this.sprite.addChild(createPixelSprite(BOBBER_SPRITE))
    this.container.addChild(this.sprite)

    this.container.visible = false
  }

  /** 显示浮标到指定位置 */
  show(x: number, y: number) {
    this.container.visible = true
    this.visible = true
    this.container.x = x
    this.container.y = y
    this.biting = false
  }

  hide() {
    this.container.visible = false
    this.visible = false
  }

  setBiting(v: boolean) {
    this.biting = v
  }

  /** 当前是否可见 */
  isCurrentlyVisible(): boolean {
    return this.visible
  }

  /** 绘制从鱼竿尖到浮标的线 */
  drawLine(rodTipX: number, rodTipY: number) {
    this.line.clear()
    if (!this.visible) return

    const localTipX = rodTipX - this.container.x
    const localTipY = rodTipY - this.container.y

    this.line.moveTo(localTipX, localTipY)
    this.line.lineTo(4, 0)
    this.line.stroke({ color: 0xC0C0C0, width: 1, alpha: 0.7 })
  }

  update(dt: number) {
    if (!this.visible) return
    this.time += dt

    if (this.biting) {
      // 鱼咬钩 — 有节奏地下沉再弹回（模拟鱼拽浮标）
      const cycle = (this.time * 0.006) % (Math.PI * 2)
      const pull = Math.pow(Math.max(0, Math.sin(cycle)), 2)
      this.sprite.y = pull * 6               // 下沉最多 6px
      this.sprite.x = Math.sin(cycle * 1.5) * 1  // 轻微左右晃
    } else {
      // 平静浮动
      this.sprite.y = Math.sin(this.time * 0.002) * 1.5
      this.sprite.x = 0
    }
  }

  destroy() {
    this.container.destroy({ children: true })
  }
}
