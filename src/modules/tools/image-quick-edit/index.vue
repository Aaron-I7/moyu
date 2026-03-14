<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import JSZip from 'jszip'

type TaskState = 'pending' | 'done' | 'error'
type ImageTask = {
  id: string
  file: File
  originalUrl: string
  resultUrl: string
  resultBlob: Blob | null
  originalMeta: { width: number; height: number; size: number }
  resultMeta: { width: number; height: number; size: number }
  state: TaskState
}

const { t } = useI18n({ useScope: 'global' })

const state = ref<'idle' | 'processing' | 'success' | 'empty' | 'error'>('idle')
const notice = ref('')
const targetWidth = ref<number>(0)
const keepRatio = ref(true)
const quality = ref(0.9)
const format = ref<'image/jpeg' | 'image/png' | 'image/webp'>('image/webp')
const tasks = ref<ImageTask[]>([])
const activeTaskId = ref('')

const activeTask = computed(() => tasks.value.find((task) => task.id === activeTaskId.value) || null)
const doneCount = computed(() => tasks.value.filter((task) => task.state === 'done').length)
const errorCount = computed(() => tasks.value.filter((task) => task.state === 'error').length)

const formatExtension = computed(() => {
  if (format.value === 'image/jpeg') return 'jpg'
  if (format.value === 'image/png') return 'png'
  return 'webp'
})

function fileSizeSaved(task: ImageTask) {
  if (!task.originalMeta.size || !task.resultMeta.size) return 0
  return Math.max(0, Math.round(((task.originalMeta.size - task.resultMeta.size) / task.originalMeta.size) * 100))
}

function clearAllTasks() {
  tasks.value.forEach((task) => {
    URL.revokeObjectURL(task.originalUrl)
    if (task.resultUrl) URL.revokeObjectURL(task.resultUrl)
  })
  tasks.value = []
  activeTaskId.value = ''
}

function resetAll() {
  clearAllTasks()
  targetWidth.value = 0
  quality.value = 0.9
  format.value = 'image/webp'
  state.value = 'idle'
  notice.value = ''
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('load image failed'))
    }
    img.src = url
  })
}

function blobFromCanvas(canvas: HTMLCanvasElement, targetType: string, targetQuality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), targetType, targetQuality)
  })
}

async function setFiles(fileList: FileList | null) {
  if (!fileList || fileList.length === 0) return
  const files = Array.from(fileList).filter((file) => file.type.startsWith('image/'))
  if (!files.length) {
    state.value = 'error'
    notice.value = t('tools.imageQuickEdit.invalid')
    return
  }
  clearAllTasks()
  tasks.value = files.map((file, index) => ({
    id: `${Date.now()}-${index}`,
    file,
    originalUrl: URL.createObjectURL(file),
    resultUrl: '',
    resultBlob: null,
    originalMeta: { width: 0, height: 0, size: file.size },
    resultMeta: { width: 0, height: 0, size: 0 },
    state: 'pending'
  }))
  activeTaskId.value = tasks.value[0]!.id
  const firstImg = await loadImage(tasks.value[0]!.file)
  tasks.value[0]!.originalMeta.width = firstImg.naturalWidth
  tasks.value[0]!.originalMeta.height = firstImg.naturalHeight
  targetWidth.value = firstImg.naturalWidth
  state.value = 'success'
  notice.value = t('tools.imageQuickEdit.loadedBatch', { count: tasks.value.length })
}

async function onSingleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  await setFiles(target.files)
}

async function onFolderChange(event: Event) {
  const target = event.target as HTMLInputElement
  await setFiles(target.files)
}

async function processTask(task: ImageTask) {
  const img = await loadImage(task.file)
  task.originalMeta.width = img.naturalWidth
  task.originalMeta.height = img.naturalHeight
  const outWidth = Math.max(1, targetWidth.value || img.naturalWidth)
  const outHeight = keepRatio.value
    ? Math.max(1, Math.round((outWidth / img.naturalWidth) * img.naturalHeight))
    : img.naturalHeight
  const canvas = document.createElement('canvas')
  canvas.width = outWidth
  canvas.height = outHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas unavailable')
  ctx.drawImage(img, 0, 0, outWidth, outHeight)
  const blob = await blobFromCanvas(canvas, format.value, quality.value)
  if (!blob) throw new Error('encode failed')
  if (task.resultUrl) URL.revokeObjectURL(task.resultUrl)
  task.resultBlob = blob
  task.resultUrl = URL.createObjectURL(blob)
  task.resultMeta = { width: outWidth, height: outHeight, size: blob.size }
  task.state = 'done'
}

async function processAll() {
  if (!tasks.value.length) {
    state.value = 'empty'
    notice.value = t('tools.imageQuickEdit.empty')
    return
  }
  state.value = 'processing'
  for (const task of tasks.value) {
    try {
      await processTask(task)
    } catch {
      task.state = 'error'
    }
  }
  if (doneCount.value === 0) {
    state.value = 'error'
    notice.value = t('tools.imageQuickEdit.error')
    return
  }
  state.value = 'success'
  notice.value = t('tools.imageQuickEdit.doneBatch', { success: doneCount.value, failed: errorCount.value })
}

function selectTask(id: string) {
  activeTaskId.value = id
}

function downloadTask(task: ImageTask) {
  if (!task.resultUrl) return
  const a = document.createElement('a')
  const sourceName = task.file.name.replace(/\.[^/.]+$/, '')
  a.href = task.resultUrl
  a.download = `${sourceName}-edited.${formatExtension.value}`
  a.click()
}

async function downloadAll() {
  const doneTasks = tasks.value.filter((task) => task.resultUrl)
  if (!doneTasks.length) return
  try {
    state.value = 'processing'
    notice.value = t('tools.imageQuickEdit.zipPreparing', { count: doneTasks.length })
    const zip = new JSZip()
    const folder = zip.folder('image-quick-edit')
    for (const task of doneTasks) {
      if (!task.resultBlob) continue
      const sourceName = task.file.name.replace(/\.[^/.]+$/, '')
      const ext = formatExtension.value
      const relativePath = (task.file as File & { webkitRelativePath?: string }).webkitRelativePath
      const zippedName = relativePath
        ? relativePath.replace(/\.[^/.]+$/, `-edited.${ext}`)
        : `${sourceName}-edited.${ext}`
      folder?.file(zippedName, task.resultBlob)
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `image-quick-edit-${Date.now()}.zip`
    a.click()
    URL.revokeObjectURL(url)
    state.value = 'success'
    notice.value = t('tools.imageQuickEdit.zipReady')
  } catch {
    state.value = 'error'
    notice.value = t('tools.imageQuickEdit.zipFailed')
  }
}
</script>

<template>
  <div class="page">
    <div class="page-inner">
      <div class="panel header">
        <h1>{{ t('tools.imageQuickEdit.title') }}</h1>
        <p>{{ t('tools.imageQuickEdit.desc') }}</p>
      </div>

      <div class="panel control-panel">
        <div class="upload-row">
          <label class="upload-btn">
            <Icon icon="mdi:image-plus" width="16" />
            {{ t('tools.imageQuickEdit.uploadSingle') }}
            <input type="file" accept="image/*" @change="onSingleFileChange" />
          </label>
          <label class="upload-btn">
            <Icon icon="mdi:folder-image" width="16" />
            {{ t('tools.imageQuickEdit.uploadFolder') }}
            <input type="file" accept="image/*" multiple webkitdirectory directory @change="onFolderChange" />
          </label>
          <button class="btn primary" @click="processAll">{{ t('tools.imageQuickEdit.processAll') }}</button>
          <button class="btn" @click="resetAll">{{ t('tools.imageQuickEdit.reset') }}</button>
          <button class="btn" :disabled="doneCount === 0" @click="downloadAll">{{ t('tools.imageQuickEdit.downloadAll') }}</button>
        </div>

        <div class="setting-grid">
          <label>
            <span>{{ t('tools.imageQuickEdit.width') }}</span>
            <input v-model.number="targetWidth" type="number" min="1" />
          </label>
          <label>
            <span>{{ t('tools.imageQuickEdit.format') }}</span>
            <select v-model="format">
              <option value="image/webp">WebP</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/png">PNG</option>
            </select>
          </label>
          <label>
            <span>{{ t('tools.imageQuickEdit.quality') }} {{ Math.round(quality * 100) }}%</span>
            <input v-model.number="quality" type="range" min="0.1" max="1" step="0.05" />
          </label>
          <label class="switch">
            <input v-model="keepRatio" type="checkbox" />
            <span>{{ t('tools.imageQuickEdit.keepRatio') }}</span>
          </label>
        </div>
      </div>

      <div class="panel meta-panel">
        <span>{{ notice || t(`tools.imageQuickEdit.state.${state}`) }}</span>
        <span>
          {{ t('tools.imageQuickEdit.metaBatch', { total: tasks.length, done: doneCount, failed: errorCount }) }}
        </span>
      </div>

      <div class="stats-row">
        <div class="stat-chip total">{{ tasks.length }}</div>
        <div class="stat-chip done">{{ doneCount }}</div>
        <div class="stat-chip failed">{{ errorCount }}</div>
      </div>

      <div class="preview-grid">
        <div class="panel preview">
          <h3>{{ t('tools.imageQuickEdit.original') }}</h3>
          <div class="canvas-wrap">
            <img v-if="activeTask?.originalUrl" :src="activeTask.originalUrl" alt="original preview" />
            <span v-else>{{ t('tools.imageQuickEdit.emptyPreview') }}</span>
          </div>
        </div>
        <div class="panel preview">
          <h3>{{ t('tools.imageQuickEdit.result') }}</h3>
          <div class="canvas-wrap">
            <img v-if="activeTask?.resultUrl" :src="activeTask.resultUrl" alt="result preview" />
            <span v-else>{{ t('tools.imageQuickEdit.emptyPreview') }}</span>
          </div>
        </div>
      </div>

      <div class="panel list-panel">
        <div v-if="tasks.length === 0" class="empty-line">{{ t('tools.imageQuickEdit.emptyList') }}</div>
        <div v-else class="task-list">
          <button
            v-for="task in tasks"
            :key="task.id"
            class="task-item"
            :data-active="task.id === activeTaskId"
            @click="selectTask(task.id)"
          >
            <span class="name">{{ task.file.name }}</span>
            <span class="meta">{{ t('tools.imageQuickEdit.itemMeta', { ow: task.originalMeta.width || '-', oh: task.originalMeta.height || '-', rw: task.resultMeta.width || '-', rh: task.resultMeta.height || '-', saved: fileSizeSaved(task) }) }}</span>
            <span class="state" :data-state="task.state">{{ t(`tools.imageQuickEdit.itemState.${task.state}`) }}</span>
            <span v-if="task.resultUrl" class="download" @click.stop="downloadTask(task)">{{ t('tools.imageQuickEdit.downloadOne') }}</span>
          </button>
        </div>
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
  filter: blur(58px);
  opacity: 0.28;
}

.page::before {
  width: 340px;
  height: 340px;
  top: 90px;
  right: -110px;
  background: #14b8a6;
}

.page::after {
  width: 320px;
  height: 320px;
  bottom: -90px;
  left: -90px;
  background: #f97316;
}

.page-inner {
  max-width: 1120px;
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
    color-mix(in srgb, var(--color-primary) 20%, var(--color-surface)),
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.setting-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.setting-grid label {
  display: grid;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.setting-grid input,
.setting-grid select {
  height: 34px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
  padding: 0 10px;
  transition: var(--transition);
}

.setting-grid input:focus,
.setting-grid select:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--color-primary) 55%, var(--color-border));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 22%, transparent);
}

.setting-grid input[type='range'] {
  padding: 0;
}

.switch {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-panel {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.stats-row {
  display: flex;
  gap: 8px;
}

.stat-chip {
  min-width: 42px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

.stat-chip.total {
  color: var(--color-text-secondary);
}

.stat-chip.done {
  color: #16a34a;
  border-color: color-mix(in srgb, #16a34a 45%, var(--color-border));
}

.stat-chip.failed {
  color: #dc2626;
  border-color: color-mix(in srgb, #dc2626 45%, var(--color-border));
}

.preview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.preview h3 {
  margin: 0 0 8px;
  font-size: 15px;
  color: var(--color-text);
}

.canvas-wrap {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  min-height: 260px;
  background: color-mix(in srgb, var(--color-surface) 96%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
}

.canvas-wrap img {
  max-width: 100%;
  max-height: 340px;
  object-fit: contain;
}

.canvas-wrap span {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.list-panel {
  padding: 8px;
}

.empty-line {
  font-size: 13px;
  color: var(--color-text-secondary);
  padding: 8px;
}

.task-list {
  display: grid;
  gap: 8px;
}

.task-item {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
  padding: 10px;
  display: grid;
  grid-template-columns: 1.3fr 1fr auto auto;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: var(--transition);
}

.task-item[data-active='true'] {
  border-color: color-mix(in srgb, var(--color-primary) 45%, var(--color-border));
  transform: translateY(-1px);
  box-shadow: 0 10px 20px color-mix(in srgb, var(--color-primary) 18%, transparent);
}

.task-item .name {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-item .meta {
  font-size: 12px;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-item .state {
  font-size: 12px;
}

.task-item .state[data-state='done'] {
  color: #16a34a;
}

.task-item .state[data-state='error'] {
  color: #dc2626;
}

.task-item .download {
  font-size: 12px;
  color: var(--color-primary);
}

[data-theme='pixel'] {
  .panel,
  .upload-btn,
  .btn,
  .setting-grid input,
  .setting-grid select,
  .canvas-wrap,
  .task-item,
  .stat-chip {
    border-radius: 0;
    border-width: 2px;
  }
}

@media (max-width: 920px) {
  .setting-grid {
    grid-template-columns: 1fr 1fr;
  }

  .preview-grid {
    grid-template-columns: 1fr;
  }

  .meta-panel {
    flex-direction: column;
  }

  .stats-row {
    flex-wrap: wrap;
  }

  .task-item {
    grid-template-columns: 1fr;
  }
}
</style>
