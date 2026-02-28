export interface ConversionOptions {
  colorMode: 'color' | 'grayscale' | 'blackwhite'
  detailLevel: 'low' | 'medium' | 'high'
  strokeWidth: number
  threshold: number
  blurRadius: number
}

export interface ConversionResult {
  svg: string
  width: number
  height: number
  originalSize: number
  svgSize: number
}

export interface Point {
  x: number
  y: number
}

export interface PathData {
  d: string
  fill: string
  stroke?: string
  strokeWidth?: number
}

export const defaultOptions: ConversionOptions = {
  colorMode: 'color',
  detailLevel: 'medium',
  strokeWidth: 1,
  threshold: 128,
  blurRadius: 0
}

export const detailPresets = {
  low: { sampleRate: 8, minArea: 100 },
  medium: { sampleRate: 4, minArea: 50 },
  high: { sampleRate: 2, minArea: 20 }
}
