import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ConversionOptions, ConversionResult, PathData } from '../types'
import { defaultOptions, detailPresets } from '../types'

export function usePngToSvg() {
  const { t } = useI18n()
  const isConverting = ref(false)
  const progress = ref(0)
  const error = ref<string | null>(null)

  const loadImage = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(t('pngToSvg.errorLoad')))
      img.src = URL.createObjectURL(file)
    })
  }

  const getImageData = (img: HTMLImageElement): ImageData => {
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error(t('pngToSvg.errorCanvas'))
    ctx.drawImage(img, 0, 0)
    return ctx.getImageData(0, 0, img.width, img.height)
  }

  const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }).join('')
  }

  const rgbToGrayscale = (r: number, g: number, b: number): number => {
    return Math.round(0.299 * r + 0.587 * g + 0.114 * b)
  }

  const quantizeColor = (r: number, g: number, b: number, levels: number = 16): [number, number, number] => {
    const step = 256 / levels
    return [
      Math.round(r / step) * step,
      Math.round(g / step) * step,
      Math.round(b / step) * step
    ]
  }

  const traceRegion = (
    imageData: ImageData,
    startX: number,
    startY: number,
    targetColor: string,
    visited: Set<string>,
    sampleRate: number
  ): PathData[] => {
    const { width, height, data } = imageData
    const paths: PathData[] = []
    const pixels: { x: number; y: number }[] = []

    const floodFill = (sx: number, sy: number) => {
      const stack: [number, number][] = [[sx, sy]]

      while (stack.length > 0) {
        const popped = stack.pop()
        if (!popped) continue
        
        const [x, y] = popped
        const key = `${x},${y}`

        if (visited.has(key)) continue
        if (x < 0 || x >= width || y < 0 || y >= height) continue

        const idx = (y * width + x) * 4
        const r = data[idx] ?? 0
        const g = data[idx + 1] ?? 0
        const b = data[idx + 2] ?? 0
        const a = data[idx + 3] ?? 0

        if (a < 10) continue

        const [qr, qg, qb] = quantizeColor(r, g, b)
        const currentColor = rgbToHex(qr, qg, qb)

        if (currentColor !== targetColor) continue

        visited.add(key)
        pixels.push({ x, y })

        stack.push([x + sampleRate, y])
        stack.push([x - sampleRate, y])
        stack.push([x, y + sampleRate])
        stack.push([x, y - sampleRate])
      }
    }

    floodFill(startX, startY)

    if (pixels.length < 3) return paths

    const minX = Math.min(...pixels.map(p => p.x))
    const maxX = Math.max(...pixels.map(p => p.x))
    const minY = Math.min(...pixels.map(p => p.y))
    const maxY = Math.max(...pixels.map(p => p.y))

    const rectPath: PathData = {
      d: `M ${minX} ${minY} L ${maxX} ${minY} L ${maxX} ${maxY} L ${minX} ${maxY} Z`,
      fill: targetColor
    }

    paths.push(rectPath)

    return paths
  }

  const traceContours = (
    imageData: ImageData,
    options: ConversionOptions
  ): PathData[] => {
    const { width, height, data } = imageData
    const paths: PathData[] = []
    const visited = new Set<string>()
    const preset = detailPresets[options.detailLevel]
    const sampleRate = preset.sampleRate

    for (let y = 0; y < height; y += sampleRate) {
      for (let x = 0; x < width; x += sampleRate) {
        const idx = (y * width + x) * 4
        const r = data[idx] ?? 0
        const g = data[idx + 1] ?? 0
        const b = data[idx + 2] ?? 0
        const a = data[idx + 3] ?? 0

        if (a < 10) continue

        let finalColor: string

        if (options.colorMode === 'blackwhite') {
          const gray = rgbToGrayscale(r, g, b)
          finalColor = gray > options.threshold ? '#ffffff' : '#000000'
        } else if (options.colorMode === 'grayscale') {
          const gray = rgbToGrayscale(r, g, b)
          const quantizedGray = Math.round(gray / 16) * 16
          finalColor = rgbToHex(quantizedGray, quantizedGray, quantizedGray)
        } else {
          const [qr, qg, qb] = quantizeColor(r, g, b, 8)
          finalColor = rgbToHex(qr, qg, qb)
        }

        const key = `${x},${y}`
        if (!visited.has(key)) {
          const regionPaths = traceRegion(imageData, x, y, finalColor, visited, sampleRate)
          paths.push(...regionPaths)
        }
      }
    }

    return paths
  }

  const generateSvg = (
    paths: PathData[],
    width: number,
    height: number,
    options: ConversionOptions
  ): string => {
    const pathsStr = paths.map(p => {
      let pathStr = `<path d="${p.d}" fill="${p.fill}"`
      if (p.stroke) {
        pathStr += ` stroke="${p.stroke}"`
      }
      if (options.strokeWidth > 0) {
        pathStr += ` stroke-width="${options.strokeWidth}"`
      }
      pathStr += '/>'
      return pathStr
    }).join('\n  ')

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${width}" 
     height="${height}" 
     viewBox="0 0 ${width} ${height}">
  ${pathsStr}
</svg>`
  }

  const convert = async (file: File, options: ConversionOptions = defaultOptions): Promise<ConversionResult | null> => {
    isConverting.value = true
    progress.value = 0
    error.value = null

    try {
      progress.value = 10
      const img = await loadImage(file)

      progress.value = 30
      const imageData = getImageData(img)

      progress.value = 50
      const paths = traceContours(imageData, options)

      progress.value = 80
      const svg = generateSvg(paths, img.width, img.height, options)

      progress.value = 100
      isConverting.value = false

      return {
        svg,
        width: img.width,
        height: img.height,
        originalSize: file.size,
        svgSize: new Blob([svg]).size
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : t('pngToSvg.errorConvert')
      isConverting.value = false
      return null
    }
  }

  const downloadSvg = (svg: string, filename: string = 'converted.svg') => {
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = async (svg: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(svg)
      return true
    } catch {
      return false
    }
  }

  return {
    isConverting,
    progress,
    error,
    convert,
    downloadSvg,
    copyToClipboard
  }
}
