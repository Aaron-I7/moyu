/**
 * 像素钓场 — 视差滚动层
 * 水平方向微弱自动滚动，模拟风吹效果
 */
import { Container, Graphics } from 'pixi.js'

export class ParallaxLayer {
  public container: Container
  private inner: Container
  private speed: number
  private offset = 0

  constructor(width: number, height: number, parallaxFactor: number) {
    this.speed = parallaxFactor * 0.3 // 很慢的自动滚动
    this.container = new Container()

    // 裁切区域（简化）
    const mask = new Graphics()
    mask.rect(0, 0, width, height)
    mask.fill(0xFFFFFF)
    this.container.addChild(mask)
    this.container.mask = mask

    this.inner = new Container()
    this.container.addChild(this.inner)
  }

  /** 添加内容到本层 */
  addChild(child: Container | Graphics) {
    this.inner.addChild(child)
  }

  update(dt: number) {
    this.offset += this.speed * dt * 0.001
    // 微弱左右摆动而非无限滚动
    this.inner.x = Math.sin(this.offset * 0.5) * 3
  }

  destroy() {
    this.container.destroy({ children: true })
  }
}
