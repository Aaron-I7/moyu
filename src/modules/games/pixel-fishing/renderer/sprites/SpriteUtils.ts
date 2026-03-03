/**
 * 像素钓场 — 精灵工具
 * 将二维像素数组转换为 PixiJS Texture / Sprite
 */
import { Texture, Sprite, Container, Graphics } from 'pixi.js'

/**
 * 从二维颜色数组创建像素纹理
 * pixels[y][x] — 0=透明, 其他=RRGGBB
 */
export function createPixelTexture(pixels: number[][], scale = 1): Texture {
  const h = pixels.length
  const w = pixels[0]?.length ?? 0
  if (w === 0 || h === 0) return Texture.EMPTY

  const canvas = document.createElement('canvas')
  canvas.width = w * scale
  canvas.height = h * scale
  const ctx = canvas.getContext('2d')!

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const color = pixels[y]?.[x] ?? 0
      if (color === 0) continue
      const r = (color >> 16) & 0xFF
      const g = (color >> 8) & 0xFF
      const b = color & 0xFF
      ctx.fillStyle = `rgb(${r},${g},${b})`
      ctx.fillRect(x * scale, y * scale, scale, scale)
    }
  }

  const tex = Texture.from(canvas)
  tex.source.scaleMode = 'nearest'
  return tex
}

/** 从像素数组创建 Sprite */
export function createPixelSprite(pixels: number[][], scale = 1): Sprite {
  const tex = createPixelTexture(pixels, scale)
  const sprite = new Sprite(tex)
  return sprite
}

/** 创建简单的矩形色块精灵 */
export function createColorBlock(w: number, h: number, color: number, alpha = 1): Graphics {
  const g = new Graphics()
  g.rect(0, 0, w, h)
  g.fill({ color, alpha })
  return g
}

/** 创建多帧动画容器（简化版帧动画） */
export class PixelAnimation {
  public container: Container
  private frames: Sprite[] = []
  private currentFrame = 0
  private elapsed = 0
  private frameDuration: number

  constructor(framePixels: number[][][], fps = 4, scale = 1) {
    this.container = new Container()
    this.frameDuration = 1000 / fps

    for (const pixels of framePixels) {
      const sprite = createPixelSprite(pixels, scale)
      sprite.visible = false
      this.container.addChild(sprite)
      this.frames.push(sprite)
    }

    if (this.frames.length > 0 && this.frames[0]) {
      this.frames[0].visible = true
    }
  }

  update(dt: number) {
    if (this.frames.length <= 1) return

    this.elapsed += dt
    if (this.elapsed >= this.frameDuration) {
      this.elapsed -= this.frameDuration
      const prevFrame = this.frames[this.currentFrame]
      if (prevFrame) prevFrame.visible = false
      this.currentFrame = (this.currentFrame + 1) % this.frames.length
      const nextFrame = this.frames[this.currentFrame]
      if (nextFrame) nextFrame.visible = true
    }
  }

  /** 设定到特定帧 */
  setFrame(index: number) {
    if (index < 0 || index >= this.frames.length) return
    const oldFrame = this.frames[this.currentFrame]
    if (oldFrame) oldFrame.visible = false
    this.currentFrame = index
    const newFrame = this.frames[this.currentFrame]
    if (newFrame) newFrame.visible = true
  }

  destroy() {
    this.container.destroy({ children: true })
  }
}
