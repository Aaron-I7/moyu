/**
 * 像素钓场 — 基础场景类
 * 构建分层视差场景：多段天空渐变 → 远景山 → 中景树 → 近景草/岸 → 水面 → 水下
 * 视觉风格：暗色调、层次丰富、宁静沉浸
 */
import { Container, Graphics } from 'pixi.js'
import type { SpotPalette, Weather, ViewMode } from '../../types'
import { BASE_WIDTH, BASE_HEIGHT } from '../../constants'
import { WaterEffect } from '../effects/WaterEffect'
import { ParallaxLayer } from '../effects/ParallaxLayer'

export interface SceneConfig {
  palette: SpotPalette
  waterLineY: number // 水面 Y 位置 (0-1 比例)
  groundLineY: number // 地面线（岸）
}

interface LayerGroup {
  sky: Container
  farBg: ParallaxLayer
  midBg: ParallaxLayer
  nearBg: ParallaxLayer
  ground: Graphics
  water: WaterEffect
  underwater: Container
  foreground: Container
}

/** 在两个 0xRRGGBB 颜色之间线性插值 */
function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xFF, ag = (a >> 8) & 0xFF, ab = a & 0xFF
  const br = (b >> 16) & 0xFF, bg = (b >> 8) & 0xFF, bb = b & 0xFF
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl = Math.round(ab + (bb - ab) * t)
  return (r << 16) | (g << 8) | bl
}

export abstract class BaseScene {
  public root: Container
  protected layers!: LayerGroup
  protected config: SceneConfig
  protected time = 0
  protected weather: Weather = 'sunny'

  constructor(config: SceneConfig) {
    this.config = config
    this.root = new Container()
    this.buildLayers()
    // 注意: populate() 不在此处调用！
    // JS 类字段初始化在 super() 之后才执行，
    // 子类的 particles=[] 等字段在 populate() 被调用时尚未初始化
    // 所以 populate() 必须由子类构造函数在 super() 之后调用
  }

  /**
   * 绘制多段渐变天空（8-12 条色带实现平滑过渡）
   */
  private buildSky(w: number, skyH: number, topColor: number, botColor: number): Container {
    const skyContainer = new Container()
    const bands = 10
    const bandH = Math.ceil(skyH / bands)

    for (let i = 0; i < bands; i++) {
      const t = i / (bands - 1)
      const color = lerpColor(topColor, botColor, t)
      const band = new Graphics()
      band.rect(0, i * bandH, w, bandH + 1) // +1 避免缝隙
      band.fill(color)
      skyContainer.addChild(band)
    }

    return skyContainer
  }

  private buildLayers() {
    const { palette, waterLineY, groundLineY } = this.config
    const w = BASE_WIDTH
    const h = BASE_HEIGHT

    // 1. 多段渐变天空
    const skyH = h * waterLineY
    const sky = this.buildSky(w, skyH, palette.skyTop, palette.skyBottom)

    // 2. 远景层（山脉）— 更大范围
    const farBg = new ParallaxLayer(w, h * 0.45, 0.08)
    farBg.container.y = h * waterLineY * 0.15

    // 3. 中景层（树木/建筑）
    const midBg = new ParallaxLayer(w, h * 0.35, 0.2)
    midBg.container.y = h * groundLineY - h * 0.3

    // 4. 近景层（草/灌木）
    const nearBg = new ParallaxLayer(w, h * 0.18, 0.5)
    nearBg.container.y = h * groundLineY - h * 0.1

    // 5. 地面（暗色调，细微纹理）
    const ground = new Graphics()
    ground.rect(0, h * groundLineY, w, h * (1 - groundLineY))
    ground.fill(palette.ground)
    // 草皮/岸边线（暗色调）
    const edgeLine = new Graphics()
    edgeLine.rect(0, h * groundLineY, w, 2)
    edgeLine.fill({ color: palette.foliage, alpha: 0.6 })
    ground.addChild(edgeLine)
    // 地面暗色渐变覆盖
    const groundShade = new Graphics()
    groundShade.rect(0, h * groundLineY + 3, w, h * (1 - groundLineY) - 3)
    groundShade.fill({ color: 0x000000, alpha: 0.15 })
    ground.addChild(groundShade)

    // 6. 水面
    const water = new WaterEffect(
      w, h * (1 - waterLineY + 0.05),
      palette.waterSurface, palette.waterDeep
    )
    water.container.y = h * waterLineY - 2

    // 7. 水下层（鱼影等）
    const underwater = new Container()
    underwater.y = h * waterLineY + 10

    // 8. 前景（浮标、角色覆盖等）
    const foreground = new Container()

    // 组装层次
    this.root.addChild(sky)
    this.root.addChild(farBg.container)
    this.root.addChild(midBg.container)
    this.root.addChild(nearBg.container)
    this.root.addChild(ground)
    this.root.addChild(water.container)
    this.root.addChild(underwater)
    this.root.addChild(foreground)

    this.layers = { sky, farBg, midBg, nearBg, ground, water, underwater, foreground }
  }

  /** 子类实现：填充场景特有元素 */
  protected abstract populate(): void

  /** 每帧更新 */
  update(dt: number, _viewMode: ViewMode) {
    this.time += dt
    this.layers.water.update(dt)
    this.layers.farBg.update(dt)
    this.layers.midBg.update(dt)
    this.layers.nearBg.update(dt)
  }

  /** 设置天气 */
  setWeather(w: Weather) {
    this.weather = w
  }

  /** 获取水面 Y（像素坐标） */
  getWaterLineY(): number {
    return BASE_HEIGHT * this.config.waterLineY
  }

  /** 获取地面/岸线 Y（像素坐标） */
  getGroundLineY(): number {
    return BASE_HEIGHT * this.config.groundLineY
  }

  /** 添加到前景层 */
  addToForeground(child: Container) {
    this.layers.foreground.addChild(child)
  }

  /** 添加到水下层 */
  addToUnderwater(child: Container) {
    this.layers.underwater.addChild(child)
  }

  /** 在指定世界 X 位置创建水面涟漪 */
  createWaterRipple(worldX: number) {
    const normalizedIndex = Math.round((worldX / BASE_WIDTH) * 16)
    this.layers.water.createRipple(normalizedIndex)
  }

  /** 销毁 */
  destroy() {
    this.layers.water.destroy()
    this.root.destroy({ children: true })
  }
}
