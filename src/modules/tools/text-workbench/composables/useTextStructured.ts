import { computed, ref } from 'vue'
import type { ComposerTranslation } from 'vue-i18n'
import type { ProcessState } from '../types'

type StructuredMode =
  | 'jsonFormat'
  | 'jsonMinify'
  | 'jsonToYaml'
  | 'yamlToJson'
  | 'jsonToToml'
  | 'tomlToJson'

type ScalarValue = string | number | boolean | null
interface StructuredObject {
  [key: string]: StructuredValue
}
interface StructuredArray extends Array<StructuredValue> {}
type StructuredValue = ScalarValue | StructuredArray | StructuredObject

type YamlLine = {
  indent: number
  text: string
}

export function useTextStructured(t: ComposerTranslation) {
  const sourceText = ref('')
  const resultText = ref('')
  const state = ref<ProcessState>('idle')
  const notice = ref('')
  const mode = ref<StructuredMode>('jsonFormat')
  const indentSize = ref(2)

  const stats = computed(() => {
    const sourceChars = sourceText.value.length
    const resultChars = resultText.value.length
    return { sourceChars, resultChars }
  })

  function isObject(value: StructuredValue): value is StructuredObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
  }

  function toYamlScalar(value: ScalarValue) {
    if (value === null) return 'null'
    if (typeof value === 'string') {
      if (!value.length) return '""'
      if (/^[a-zA-Z0-9_\-./]+$/.test(value)) return value
      return JSON.stringify(value)
    }
    return String(value)
  }

  function toYaml(value: StructuredValue, level = 0): string {
    const pad = ' '.repeat(level)
    if (Array.isArray(value)) {
      if (!value.length) return `${pad}[]`
      return value
        .map((item) => {
          if (isObject(item) || Array.isArray(item)) {
            return `${pad}-\n${toYaml(item, level + 2)}`
          }
          return `${pad}- ${toYamlScalar(item as ScalarValue)}`
        })
        .join('\n')
    }
    if (isObject(value)) {
      const keys = Object.keys(value)
      if (!keys.length) return `${pad}{}`
      return keys
        .map((key) => {
          const next = value[key] as StructuredValue
          if (isObject(next) || Array.isArray(next)) {
            return `${pad}${key}:\n${toYaml(next, level + 2)}`
          }
          return `${pad}${key}: ${toYamlScalar(next as ScalarValue)}`
        })
        .join('\n')
    }
    return `${pad}${toYamlScalar(value as ScalarValue)}`
  }

  function parseYamlScalar(raw: string): StructuredValue {
    if (raw === 'null') return null
    if (raw === 'true') return true
    if (raw === 'false') return false
    if (raw === '[]') return []
    if (raw === '{}') return {}
    if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw)
    if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
      try {
        if (raw.startsWith('"')) return JSON.parse(raw)
        return raw.slice(1, -1)
      } catch {
        return raw.slice(1, -1)
      }
    }
    return raw
  }

  function toYamlLines(input: string): YamlLine[] {
    return input
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((line) => {
        const clear = line.replace(/\t/g, '  ').replace(/\s+$/, '')
        const content = clear.trim()
        const indent = clear.match(/^ */)?.[0].length ?? 0
        return { indent, text: content }
      })
      .filter((line) => line.text.length > 0 && !line.text.startsWith('#'))
  }

  function parseYamlBlock(lines: YamlLine[], start: number, indent: number): { value: StructuredValue; next: number } {
    if (start >= lines.length) return { value: {}, next: start }
    const first = lines[start]
    if (!first) return { value: {}, next: start }
    const isArrayBlock = first.indent === indent && first.text.startsWith('-')
    if (isArrayBlock) {
      const arr: StructuredValue[] = []
      let idx = start
      while (idx < lines.length) {
        const line = lines[idx]
        if (!line) break
        if (line.indent < indent || !line.text.startsWith('-') || line.indent !== indent) break
        const rest = line.text.slice(1).trim()
        if (!rest) {
          const nested = parseYamlBlock(lines, idx + 1, indent + 2)
          arr.push(nested.value)
          idx = nested.next
          continue
        }
        const split = rest.indexOf(':')
        if (split > 0 && rest[split + 1] === ' ') {
          const key = rest.slice(0, split).trim()
          const valueRaw = rest.slice(split + 1).trim()
          arr.push({ [key]: parseYamlScalar(valueRaw) })
          idx += 1
          continue
        }
        arr.push(parseYamlScalar(rest))
        idx += 1
      }
      return { value: arr, next: idx }
    }
    const obj: Record<string, StructuredValue> = {}
    let idx = start
    while (idx < lines.length) {
      const line = lines[idx]
      if (!line) break
      if (line.indent < indent || line.indent !== indent || line.text.startsWith('-')) break
      const split = line.text.indexOf(':')
      if (split < 0) throw new Error('invalidYaml')
      const key = line.text.slice(0, split).trim()
      const rest = line.text.slice(split + 1).trim()
      if (!key) throw new Error('invalidYaml')
      if (!rest) {
        const nested = parseYamlBlock(lines, idx + 1, indent + 2)
        obj[key] = nested.value
        idx = nested.next
        continue
      }
      obj[key] = parseYamlScalar(rest)
      idx += 1
    }
    return { value: obj, next: idx }
  }

  function parseYaml(input: string) {
    const lines = toYamlLines(input)
    if (!lines.length) return {}
    return parseYamlBlock(lines, 0, lines[0]!.indent).value
  }

  function toTomlScalar(value: ScalarValue) {
    if (value === null) return '""'
    if (typeof value === 'string') return JSON.stringify(value)
    if (typeof value === 'boolean') return value ? 'true' : 'false'
    return String(value)
  }

  function toToml(value: StructuredValue): string {
    if (!isObject(value)) throw new Error('tomlRootObject')
    const lines: string[] = []
    const sections: Array<{ path: string[]; value: Record<string, StructuredValue> }> = [{ path: [], value }]
    while (sections.length) {
      const current = sections.shift()
      if (!current) break
      if (current.path.length) lines.push(`[${current.path.join('.')}]`)
      const entries = Object.entries(current.value)
      for (const [key, item] of entries) {
        if (Array.isArray(item) && item.every((v) => !isObject(v) && !Array.isArray(v))) {
          lines.push(`${key} = [${item.map((v) => toTomlScalar(v as ScalarValue)).join(', ')}]`)
          continue
        }
        if (isObject(item)) {
          sections.push({ path: [...current.path, key], value: item })
          continue
        }
        if (Array.isArray(item)) throw new Error('tomlNestedArrayUnsupported')
        lines.push(`${key} = ${toTomlScalar(item as ScalarValue)}`)
      }
      lines.push('')
    }
    return lines.join('\n').trim()
  }

  function parseTomlScalar(raw: string): StructuredValue {
    const text = raw.trim()
    if (text === 'true') return true
    if (text === 'false') return false
    if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text)
    if (text.startsWith('"') && text.endsWith('"')) return JSON.parse(text)
    if (text.startsWith('[') && text.endsWith(']')) {
      const inner = text.slice(1, -1).trim()
      if (!inner) return []
      return inner.split(',').map((part) => parseTomlScalar(part.trim()))
    }
    return text
  }

  function parseToml(input: string): StructuredValue {
    const root: Record<string, StructuredValue> = {}
    let current = root
    const lines = input.replace(/\r\n/g, '\n').split('\n')
    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue
      if (line.startsWith('[') && line.endsWith(']')) {
        const sectionPath = line.slice(1, -1).trim()
        if (!sectionPath) throw new Error('invalidToml')
        const keys = sectionPath.split('.').map((item) => item.trim()).filter(Boolean)
        current = root
        for (const key of keys) {
          if (!isObject(current[key] as StructuredValue)) {
            current[key] = {}
          }
          current = current[key] as Record<string, StructuredValue>
        }
        continue
      }
      const split = line.indexOf('=')
      if (split < 0) throw new Error('invalidToml')
      const key = line.slice(0, split).trim()
      const value = line.slice(split + 1).trim()
      if (!key) throw new Error('invalidToml')
      current[key] = parseTomlScalar(value)
    }
    return root
  }

  function run() {
    if (!sourceText.value.trim()) {
      state.value = 'empty'
      resultText.value = ''
      notice.value = t('tools.textStructured.empty')
      return
    }
    state.value = 'processing'
    try {
      const text = sourceText.value
      let next = ''
      if (mode.value === 'jsonFormat') {
        next = JSON.stringify(JSON.parse(text), null, indentSize.value)
      } else if (mode.value === 'jsonMinify') {
        next = JSON.stringify(JSON.parse(text))
      } else if (mode.value === 'jsonToYaml') {
        next = toYaml(JSON.parse(text) as StructuredValue)
      } else if (mode.value === 'yamlToJson') {
        next = JSON.stringify(parseYaml(text), null, indentSize.value)
      } else if (mode.value === 'jsonToToml') {
        next = toToml(JSON.parse(text) as StructuredValue)
      } else {
        next = JSON.stringify(parseToml(text), null, indentSize.value)
      }
      resultText.value = next
      state.value = 'success'
      notice.value = t('tools.textStructured.done', { chars: next.length })
    } catch {
      state.value = 'error'
      resultText.value = ''
      notice.value = t('tools.textStructured.error')
    }
  }

  function reset() {
    sourceText.value = ''
    resultText.value = ''
    state.value = 'idle'
    notice.value = ''
    mode.value = 'jsonFormat'
    indentSize.value = 2
  }

  async function copyResult() {
    if (!resultText.value.trim()) return
    try {
      await navigator.clipboard.writeText(resultText.value)
      notice.value = t('tools.textStructured.copied')
    } catch {
      notice.value = t('tools.textStructured.copyFailed')
    }
  }

  function downloadResult() {
    if (!resultText.value.trim()) return
    const ext =
      mode.value === 'jsonToYaml'
        ? 'yaml'
        : mode.value === 'jsonToToml'
          ? 'toml'
          : mode.value === 'jsonMinify' || mode.value === 'jsonFormat' || mode.value === 'yamlToJson' || mode.value === 'tomlToJson'
            ? 'json'
            : 'txt'
    const blob = new Blob([resultText.value], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `text-structured-${Date.now()}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    sourceText,
    resultText,
    state,
    notice,
    mode,
    indentSize,
    stats,
    run,
    reset,
    copyResult,
    downloadResult
  }
}
