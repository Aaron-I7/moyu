<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'

type CsvRow = Record<string, string>

const { t } = useI18n({ useScope: 'global' })

const sourceText = ref('')
const fileName = ref('')
const state = ref<'idle' | 'processing' | 'success' | 'empty' | 'error'>('idle')
const notice = ref('')
const rows = ref<CsvRow[]>([])
const headers = ref<string[]>([])
const keyword = ref('')
const outputType = ref<'json' | 'csv'>('json')
const renameMap = ref<Record<string, string>>({})

const previewRows = computed(() => filteredRows.value.slice(0, 20))

const filteredRows = computed(() => {
  if (!keyword.value.trim()) return rows.value
  const k = keyword.value.toLowerCase()
  return rows.value.filter((row) => Object.values(row).some((v) => v.toLowerCase().includes(k)))
})

const exportedText = computed(() => {
  if (outputType.value === 'json') {
    return JSON.stringify(remappedRows.value, null, 2)
  }
  return toCsv(remappedRows.value)
})

const remappedHeaders = computed(() =>
  headers.value.map((h) => (renameMap.value[h]?.trim() ? renameMap.value[h]!.trim() : h))
)

const remappedRows = computed(() =>
  filteredRows.value.map((row) => {
    const next: CsvRow = {}
    for (const h of headers.value) {
      const mapped = renameMap.value[h]?.trim() || h
      next[mapped] = row[h] || ''
    }
    return next
  })
)

function parseCsvLine(line: string) {
  const cells: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    const next = line[i + 1]
    if (ch === '"' && inQuotes && next === '"') {
      current += '"'
      i += 1
    } else if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      cells.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  cells.push(current)
  return cells
}

function parseCsv(text: string) {
  const lines = text.replace(/\r\n/g, '\n').split('\n').filter((line) => line.trim().length > 0)
  if (lines.length === 0) return { headers: [], rows: [] as CsvRow[] }
  const parsedHeaders = parseCsvLine(lines[0]!).map((h) => h.trim())
  const parsedRows: CsvRow[] = lines.slice(1).map((line) => {
    const cells = parseCsvLine(line)
    const row: CsvRow = {}
    parsedHeaders.forEach((header, index) => {
      row[header] = cells[index] ?? ''
    })
    return row
  })
  return { headers: parsedHeaders, rows: parsedRows }
}

function csvEscape(value: string) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function toCsv(data: CsvRow[]) {
  if (!data.length) return ''
  const keys = Object.keys(data[0]!)
  const body = data.map((row) => keys.map((k) => csvEscape(row[k] ?? '')).join(','))
  return [keys.join(','), ...body].join('\n')
}

function parseSource() {
  if (!sourceText.value.trim()) {
    state.value = 'empty'
    notice.value = t('tools.csvToolkit.empty')
    rows.value = []
    headers.value = []
    return
  }
  try {
    state.value = 'processing'
    const parsed = parseCsv(sourceText.value)
    headers.value = parsed.headers
    rows.value = parsed.rows
    renameMap.value = Object.fromEntries(parsed.headers.map((h) => [h, h]))
    state.value = 'success'
    notice.value = t('tools.csvToolkit.done', { rows: parsed.rows.length, cols: parsed.headers.length })
  } catch {
    state.value = 'error'
    notice.value = t('tools.csvToolkit.error')
  }
}

function resetAll() {
  sourceText.value = ''
  fileName.value = ''
  state.value = 'idle'
  notice.value = ''
  rows.value = []
  headers.value = []
  keyword.value = ''
  renameMap.value = {}
  outputType.value = 'json'
}

async function copyOutput() {
  if (!exportedText.value.trim()) return
  try {
    await navigator.clipboard.writeText(exportedText.value)
    notice.value = t('tools.csvToolkit.copied')
  } catch {
    notice.value = t('tools.csvToolkit.copyFailed')
  }
}

function downloadOutput() {
  if (!exportedText.value.trim()) return
  const ext = outputType.value === 'json' ? 'json' : 'csv'
  const type = outputType.value === 'json' ? 'application/json;charset=utf-8' : 'text/csv;charset=utf-8'
  const blob = new Blob([exportedText.value], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const baseName = fileName.value ? fileName.value.replace(/\.[^/.]+$/, '') : `csv-toolkit-${Date.now()}`
  a.download = `${baseName}.${ext}`
  a.click()
  URL.revokeObjectURL(url)
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  fileName.value = file.name
  const reader = new FileReader()
  reader.onload = () => {
    sourceText.value = String(reader.result || '')
    parseSource()
  }
  reader.readAsText(file, 'utf-8')
}
</script>

<template>
  <div class="page">
    <div class="page-inner">
      <div class="panel header">
        <h1>{{ t('tools.csvToolkit.title') }}</h1>
        <p>{{ t('tools.csvToolkit.desc') }}</p>
      </div>

      <div class="panel input-panel">
        <div class="upload-row">
          <label class="upload-btn">
            <Icon icon="mdi:upload" width="16" />
            {{ t('tools.csvToolkit.upload') }}
            <input type="file" accept=".csv,text/csv" @change="onFileChange" />
          </label>
          <button class="btn primary" @click="parseSource">{{ t('tools.csvToolkit.parse') }}</button>
          <button class="btn" @click="resetAll">{{ t('tools.csvToolkit.reset') }}</button>
        </div>
        <textarea v-model="sourceText" :placeholder="t('tools.csvToolkit.sourcePlaceholder')" />
      </div>

      <div class="panel map-panel">
        <div class="map-header">
          <span>{{ notice || t(`tools.csvToolkit.state.${state}`) }}</span>
          <span>{{ t('tools.csvToolkit.stats', { rows: rows.length, filtered: filteredRows.length, cols: headers.length }) }}</span>
        </div>
        <div v-if="headers.length > 0" class="map-grid">
          <div v-for="h in headers" :key="h" class="map-row">
            <span>{{ h }}</span>
            <Icon icon="mdi:arrow-right" width="14" />
            <input v-model="renameMap[h]" type="text" />
          </div>
        </div>
      </div>

      <div class="panel preview-panel">
        <div class="toolbar">
          <input v-model="keyword" :placeholder="t('tools.csvToolkit.keyword')" />
          <select v-model="outputType">
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
          <button class="btn" @click="copyOutput">{{ t('tools.csvToolkit.copy') }}</button>
          <button class="btn" @click="downloadOutput">{{ t('tools.csvToolkit.download') }}</button>
        </div>
        <div v-if="previewRows.length > 0" class="table-wrap">
          <table>
            <thead>
              <tr>
                <th v-for="h in remappedHeaders" :key="h">{{ h }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in previewRows" :key="idx">
                <td v-for="h in headers" :key="`${idx}-${h}`">{{ row[h] }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <textarea class="output-box" :value="exportedText" readonly :placeholder="t('tools.csvToolkit.outputPlaceholder')" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page {
  min-height: 100%;
  padding-top: 56px;
  position: relative;
  overflow: hidden;
}

.page::before,
.page::after {
  content: '';
  position: fixed;
  pointer-events: none;
  z-index: 0;
  border-radius: 50%;
  filter: blur(56px);
  opacity: 0.28;
}

.page::before {
  width: 360px;
  height: 360px;
  top: 90px;
  right: -120px;
  background: #0ea5e9;
}

.page::after {
  width: 300px;
  height: 300px;
  bottom: -90px;
  left: -90px;
  background: #14b8a6;
}

.page-inner {
  max-width: 1160px;
  margin: 0 auto;
  padding: 20px 12px 28px;
  display: grid;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.panel {
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  box-shadow: var(--shadow);
  padding: 14px;
  backdrop-filter: blur(8px);
  background: color-mix(in srgb, var(--color-surface) 88%, transparent);
}

.header {
  padding: 18px;
  border-color: color-mix(in srgb, var(--color-primary) 42%, var(--color-border));
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-primary) 18%, var(--color-surface)),
    color-mix(in srgb, var(--color-surface) 92%, transparent)
  );
}

.header h1 {
  margin: 0 0 6px;
  font-size: 30px;
  color: var(--color-text);
}

.header p {
  margin: 0;
  color: var(--color-text-secondary);
}

.upload-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px dashed var(--color-border);
}

.upload-btn {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  border-radius: 10px;
  height: 34px;
  padding: 0 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: var(--transition);
}

.upload-btn:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
  box-shadow: 0 8px 18px color-mix(in srgb, var(--color-primary) 20%, transparent);
}

.upload-btn input {
  display: none;
}

.btn {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  border-radius: 10px;
  height: 34px;
  padding: 0 12px;
  cursor: pointer;
  transition: var(--transition);
}

.btn:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
  box-shadow: 0 8px 18px color-mix(in srgb, var(--color-primary) 20%, transparent);
}

.btn.primary {
  border-color: color-mix(in srgb, var(--color-primary) 50%, var(--color-border));
  background: color-mix(in srgb, var(--color-primary) 15%, var(--color-surface));
}

.input-panel textarea,
.output-box {
  width: 100%;
  min-height: 180px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
  padding: 10px 12px;
  resize: vertical;
  transition: var(--transition);
}

.input-panel textarea:focus,
.map-row input:focus,
.toolbar input:focus,
.toolbar select:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--color-primary) 55%, var(--color-border));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 22%, transparent);
}

.map-header {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.map-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.map-row {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 8px 10px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 6px;
  transition: var(--transition);
}

.map-row:hover {
  border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
  transform: translateY(-1px);
}

.map-row span {
  font-size: 12px;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
}

.map-row input {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text);
  padding: 4px 8px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.toolbar input,
.toolbar select {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
  height: 34px;
  padding: 0 10px;
}

.table-wrap {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  overflow: auto;
  margin-bottom: 10px;
  max-height: 260px;
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--color-border) 45%, transparent);
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

th,
td {
  border-bottom: 1px solid var(--color-border);
  padding: 6px 8px;
  text-align: left;
  white-space: nowrap;
}

th {
  position: sticky;
  top: 0;
  background: color-mix(in srgb, var(--color-surface) 95%, transparent);
  z-index: 1;
  box-shadow: inset 0 -1px 0 var(--color-border);
}

[data-theme='pixel'] {
  .panel,
  .upload-btn,
  .btn,
  .input-panel textarea,
  .output-box,
  .map-row,
  .map-row input,
  .toolbar input,
  .toolbar select,
  .table-wrap {
    border-radius: 0;
    border-width: 2px;
  }
}

@media (max-width: 900px) {
  .map-grid {
    grid-template-columns: 1fr;
  }

  .map-header {
    flex-direction: column;
  }
}
</style>
