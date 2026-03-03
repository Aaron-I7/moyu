/**
 * 像素钓场 — 粒子系统
 * 轻量实现：用 Graphics 画像素方块粒子
 */
import { Container, Graphics } from 'pixi.js'
import type { ParticleConfig } from '../../types'

interface Particle {
  gfx: Graphics
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  alpha: number
  targetAlpha: number
}

export class ParticleSystem {
  public container: Container
  private particles: Particle[] = []
  private config: ParticleConfig
  private bounds: { width: number; height: number }
  private active = true

  constructor(config: ParticleConfig, width: number, height: number) {
    this.config = config
    this.bounds = { width, height }
    this.container = new Container()
    this.spawn()
  }

  private spawn() {
    const { count, size, color, alpha, speed, lifetime } = this.config

    for (let i = 0; i < count; i++) {
      const s = size[0] + Math.random() * (size[1] - size[0])
      const gfx = new Graphics()
      gfx.rect(0, 0, s, s)
      gfx.fill(color)

      const p: Particle = {
        gfx,
        x: Math.random() * this.bounds.width,
        y: Math.random() * this.bounds.height,
        vx: (Math.random() - 0.5) * (speed[1] - speed[0]) + speed[0],
        vy: this.getInitialVy(),
        life: Math.random() * lifetime[1],
        maxLife: lifetime[0] + Math.random() * (lifetime[1] - lifetime[0]),
        alpha: alpha[0] + Math.random() * (alpha[1] - alpha[0]),
        targetAlpha: alpha[0] + Math.random() * (alpha[1] - alpha[0])
      }

      gfx.x = p.x
      gfx.y = p.y
      gfx.alpha = p.alpha
      this.container.addChild(gfx)
      this.particles.push(p)
    }
  }

  private getInitialVy(): number {
    const { type, speed } = this.config
    switch (type) {
      case 'raindrop': return speed[1] * 2
      case 'snowflake': return speed[0] * 0.5
      case 'bubble': return -speed[0] * 0.8
      case 'leaf': return speed[0] * 0.3
      case 'firefly': return (Math.random() - 0.5) * speed[0]
      case 'seagull': return Math.sin(Math.random() * Math.PI) * speed[0] * 0.2
      default: return 0
    }
  }

  update(dt: number) {
    if (!this.active) return
    const dtS = dt * 0.001

    for (const p of this.particles) {
      p.life += dt

      // 各类型不同运动
      switch (this.config.type) {
        case 'firefly':
          p.vx += (Math.random() - 0.5) * 10 * dtS
          p.vy += (Math.random() - 0.5) * 10 * dtS
          p.alpha = p.targetAlpha * (0.5 + 0.5 * Math.sin(p.life * 0.003))
          break
        case 'leaf':
          p.vx = Math.sin(p.life * 0.002 + p.x) * 8
          break
        case 'butterfly':
          p.vx = Math.sin(p.life * 0.004) * 15
          p.vy = Math.cos(p.life * 0.003) * 5
          break
        case 'seagull':
          p.vy = Math.sin(p.life * 0.001) * 3
          break
        case 'glow':
          p.alpha = p.targetAlpha * (0.3 + 0.7 * Math.sin(p.life * 0.002 + p.x))
          p.vy = Math.sin(p.life * 0.001) * 2
          break
        default:
          break
      }

      p.x += p.vx * dtS
      p.y += p.vy * dtS

      // 边界循环
      if (p.x < -10) p.x = this.bounds.width + 10
      if (p.x > this.bounds.width + 10) p.x = -10
      if (p.y < -10) p.y = this.bounds.height + 10
      if (p.y > this.bounds.height + 10) p.y = -10

      // 生命周期重置
      if (p.life > p.maxLife) {
        p.life = 0
        p.x = Math.random() * this.bounds.width
        p.y = this.config.type === 'raindrop' || this.config.type === 'snowflake' || this.config.type === 'leaf'
          ? -5
          : Math.random() * this.bounds.height
      }

      p.gfx.x = Math.round(p.x)
      p.gfx.y = Math.round(p.y)
      p.gfx.alpha = p.alpha
    }
  }

  setActive(v: boolean) {
    this.active = v
    this.container.visible = v
  }

  destroy() {
    this.active = false
    this.container.destroy({ children: true })
    this.particles = []
  }
}
