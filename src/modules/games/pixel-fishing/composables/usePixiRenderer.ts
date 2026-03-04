/**
 * 像素钓场 — PixiJS 应用初始化 + 场景管理
 * 增强: 鱼线绘制 / 水面涟漪 / 环境鱼 / 钓获高光动画
 */
import { ref, type Ref } from 'vue'
import { Application, Container, Graphics } from 'pixi.js'
import type { EnvironmentType, ViewMode } from '../types'
import { BASE_WIDTH, BASE_HEIGHT, PIXEL_SCALE } from '../constants'
import { PixelCamera } from '../renderer/PixelCamera'
import { BaseScene } from '../renderer/scenes/BaseScene'
import { StreamScene } from '../renderer/scenes/StreamScene'
import { LakeScene } from '../renderer/scenes/LakeScene'
import { RiverScene } from '../renderer/scenes/RiverScene'
import { CoastScene } from '../renderer/scenes/CoastScene'
import { DeepSeaScene } from '../renderer/scenes/DeepSeaScene'
import { FishermanSprite } from '../renderer/sprites/FishermanSprite'
import { BobberSprite } from '../renderer/sprites/BobberSprite'
import { FishSprite } from '../renderer/sprites/FishSprite'
import { FISH_COLORS } from '../data/sprites'
import type { FishingState } from '../types'

function createScene(envType: EnvironmentType): BaseScene {
  switch (envType) {
    case 'stream': return new StreamScene()
    case 'lake': return new LakeScene()
    case 'river': return new RiverScene()
    case 'coast': return new CoastScene()
    case 'deep-sea': return new DeepSeaScene()
    default: return new StreamScene()
  }
}

export function usePixiRenderer(canvasRef: Ref<HTMLCanvasElement | null>) {
  const app = ref<Application | null>(null)
  const ready = ref(false)

  let scene: BaseScene | null = null
  let camera: PixelCamera | null = null
  let fisherman: FishermanSprite | null = null
  let bobber: BobberSprite | null = null
  let caughtFish: FishSprite | null = null
  let catchLineGfx: Graphics | null = null
  let sceneRoot: Container | null = null
  let tickerCallback: ((ticker: any) => void) | null = null
  let currentViewMode: ViewMode = 'third-person'
  let currentFishingState: FishingState = 'spot-select'

  // 环境鱼（水下氛围）
  const ambientFish: FishSprite[] = []

  async function init() {
    if (!canvasRef.value) return

    const pixiApp = new Application()
    await pixiApp.init({
      canvas: canvasRef.value,
      width: BASE_WIDTH * PIXEL_SCALE,
      height: BASE_HEIGHT * PIXEL_SCALE,
      backgroundColor: 0x87CEEB,
      resolution: 1,
      autoDensity: false,
      antialias: false,
      roundPixels: true
    })

    // 场景根容器
    sceneRoot = new Container()
    sceneRoot.scale.set(PIXEL_SCALE)
    pixiApp.stage.addChild(sceneRoot)

    camera = new PixelCamera(sceneRoot, PIXEL_SCALE)
    camera.setLogicSize(BASE_WIDTH, BASE_HEIGHT)

    // ── 主循环 ──
    tickerCallback = (ticker: any) => {
      const dt = ticker.deltaMS ?? 16
      if (scene) scene.update(dt, currentViewMode)
      if (camera) camera.update(dt)
      if (fisherman) fisherman.update(dt)
      if (bobber) {
        bobber.update(dt)
        // ★ 绘制鱼线：杆尖 → 浮标
        if (
          fisherman &&
          bobber.isCurrentlyVisible() &&
          currentViewMode === 'third-person' &&
          ['waiting', 'biting', 'casting'].includes(currentFishingState)
        ) {
          const tip = fisherman.getRodTipWorld()
          bobber.drawLine(tip.x, tip.y)
        }
      }
      if (caughtFish) caughtFish.update(dt)
      // ★ catch-animation: 鱼线从杆尖到鱼
      if (
        fisherman &&
        caughtFish &&
        currentFishingState === 'catch-animation' &&
        currentViewMode === 'third-person' &&
        catchLineGfx
      ) {
        catchLineGfx.clear()
        const tip = fisherman.getRodTipWorld()
        catchLineGfx.moveTo(tip.x, tip.y)
        catchLineGfx.lineTo(caughtFish.container.x, caughtFish.container.y)
        catchLineGfx.stroke({ color: 0xC0C0C0, width: 1, alpha: 0.6 })
      } else if (catchLineGfx && currentFishingState !== 'catch-animation') {
        catchLineGfx.clear()
      }
      // 环境鱼
      for (const fish of ambientFish) {
        fish.update(dt)
        // 水平漫游
        fish.container.x += 0.008 * dt * (fish.container.scale.x > 0 ? 1 : -1)
        // 超出屏幕则反转方向
        if (fish.container.x > BASE_WIDTH + 10) {
          fish.container.scale.x = -Math.abs(fish.container.scale.x)
        } else if (fish.container.x < -10) {
          fish.container.scale.x = Math.abs(fish.container.scale.x)
        }
      }
    }
    pixiApp.ticker.add(tickerCallback)

    app.value = pixiApp
    ready.value = true
  }

  function loadScene(envType: EnvironmentType) {
    if (!sceneRoot) return

    // 卸载旧场景
    if (scene) {
      sceneRoot.removeChild(scene.root)
      scene.destroy()
    }
    cleanupSprites()

    // 创建新场景
    scene = createScene(envType)
    sceneRoot.addChild(scene.root)

    // 创建渔夫角色
    fisherman = new FishermanSprite()
    fisherman.container.x = BASE_WIDTH * 0.25
    fisherman.container.y = scene.getGroundLineY() - 16
    fisherman.setVisible(currentViewMode === 'third-person')
    scene.addToForeground(fisherman.container)

    // 创建浮标
    bobber = new BobberSprite()
    scene.addToForeground(bobber.container)

    // 钓获鱼线
    catchLineGfx = new Graphics()
    scene.addToForeground(catchLineGfx)

    // ★ 添加环境鱼（水下氛围）
    spawnAmbientFish()
  }

  /** 在水下层添加几条随机游动的鱼 */
  function spawnAmbientFish() {
    if (!scene) return
    clearAmbientFish()

    const fishKeys = Object.keys(FISH_COLORS)
    const count = 3 + Math.floor(Math.random() * 3) // 3-5 条

    for (let i = 0; i < count; i++) {
      const key = fishKeys[Math.floor(Math.random() * fishKeys.length)]
      if (!key) continue
      const fish = new FishSprite(key, 0.8)
      fish.container.x = Math.random() * BASE_WIDTH
      fish.container.y = 5 + Math.random() * 30
      fish.container.alpha = 0.35 + Math.random() * 0.2
      fish.setSwimming(true)
      fish.setSwimSpeed(0.3 + Math.random() * 0.5)
      // 随机朝向
      if (Math.random() > 0.5) fish.container.scale.x = -1
      scene.addToUnderwater(fish.container)
      ambientFish.push(fish)
    }
  }

  function clearAmbientFish() {
    for (const fish of ambientFish) fish.destroy()
    ambientFish.length = 0
  }

  function setViewMode(mode: ViewMode) {
    currentViewMode = mode
    camera?.switchTo(mode)
    fisherman?.setVisible(mode === 'third-person')
  }

  function updateFishingState(state: FishingState) {
    currentFishingState = state
    fisherman?.setState(state)

    switch (state) {
      case 'casting': {
        // 抛竿 → 显示浮标 + 水面涟漪
        if (bobber && scene) {
          const bx = BASE_WIDTH * 0.55 + Math.random() * 30
          const by = scene.getWaterLineY() + 3
          bobber.show(bx, by)
          bobber.setBiting(false)
          // ★ 水面涟漪
          scene.createWaterRipple(bx)
        }
        break
      }
      case 'waiting':
        bobber?.setBiting(false)
        break
      case 'biting':
        bobber?.setBiting(true)
        break
      case 'success':
      case 'failed':
      case 'idle':
      case 'spot-select':
        bobber?.hide()
        if (state !== 'success') {
          if (caughtFish) {
            caughtFish.destroy()
            caughtFish = null
          }
        }
        break
      case 'catch-animation':
        // 鱼跃出水面：隐藏浮标，鱼精灵由 showCaughtFish 创建
        bobber?.hide()
        break
    }
  }

  /** 显示钓到的鱼 + 跳跃高光动画 */
  function showCaughtFish(spriteKey: string) {
    if (caughtFish) caughtFish.destroy()
    if (!scene) return

    const waterY = scene.getWaterLineY()
    const startX = bobber ? bobber.container.x : BASE_WIDTH * 0.5

    caughtFish = new FishSprite(spriteKey, 1.5)
    caughtFish.container.x = startX
    caughtFish.container.y = waterY
    caughtFish.setSwimming(false)
    scene.addToForeground(caughtFish.container)

    // ★ 鱼跃出水面 → 向竿尖弧线飞去
    const rodTip = fisherman?.getRodTipWorld()
    caughtFish.playJumpAnimation(waterY, rodTip?.x, rodTip?.y)

    // ★ 水花涟漪（两波）
    scene.createWaterRipple(startX)
    setTimeout(() => {
      if (scene) scene.createWaterRipple(startX - 5)
    }, 300)

    // ★ 渔夫提竿动作
    fisherman?.setState('success')
  }

  function resize(width: number, height: number) {
    if (!app.value) return
    const canvas = app.value.canvas as HTMLCanvasElement
    const logicW = BASE_WIDTH * PIXEL_SCALE
    const logicH = BASE_HEIGHT * PIXEL_SCALE
    
    // 计算缩放比例，保持长宽比
    const ratio = Math.min(width / logicW, height / logicH)
    
    // 实际渲染尺寸
    const finalW = logicW * ratio
    const finalH = logicH * ratio
    
    // 更新 Canvas 样式尺寸
    canvas.style.width = `${finalW}px`
    canvas.style.height = `${finalH}px`
    
    // 使用 margin 居中，而非 marginTop/marginLeft，因为外层已经是 flex center
    canvas.style.margin = 'auto'
  }

  function cleanupSprites() {
    fisherman?.destroy(); fisherman = null
    bobber?.destroy(); bobber = null
    caughtFish?.destroy(); caughtFish = null
    if (catchLineGfx) { catchLineGfx.destroy(); catchLineGfx = null }
    clearAmbientFish()
  }

  function destroy() {
    if (tickerCallback && app.value) {
      app.value.ticker.remove(tickerCallback)
      tickerCallback = null
    }
    scene?.destroy(); scene = null
    cleanupSprites()
    camera?.destroy(); camera = null
    sceneRoot = null

    if (app.value) {
      app.value.destroy(true)
      app.value = null
    }
    ready.value = false
  }

  return {
    app,
    ready,
    init,
    loadScene,
    setViewMode,
    updateFishingState,
    showCaughtFish,
    resize,
    destroy
  }
}
