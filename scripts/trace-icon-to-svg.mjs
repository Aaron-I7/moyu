import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const inputPath = resolve('public', 'icon.png')
const outputPath = resolve('public', 'icon.svg')

const png = readFileSync(inputPath)
const base64 = png.toString('base64')

function readPngSize(bytes) {
  if (bytes.length < 24) return { width: 1024, height: 512 }
  const sigOk =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  if (!sigOk) return { width: 1024, height: 512 }
  const width = bytes.readUInt32BE(16)
  const height = bytes.readUInt32BE(20)
  return { width, height }
}

const { width, height } = readPngSize(png)

const safeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><image href="data:image/png;base64,${base64}" width="${width}" height="${height}" /></svg>`

writeFileSync(outputPath, safeSvg, 'utf-8')
console.log(`Wrote ${outputPath}`)
