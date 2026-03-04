<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePngToSvg } from './composables/usePngToSvg'
import type { ConversionOptions, ConversionResult } from './types'
import { defaultOptions } from './types'

const { t } = useI18n()

const {
  isConverting,
  progress,
  error,
  convert,
  downloadSvg,
  copyToClipboard
} = usePngToSvg()

const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const result = ref<ConversionResult | null>(null)
const copied = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const options = ref<ConversionOptions>({ ...defaultOptions })

const handleFileSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file && file.type === 'image/png') {
    selectedFile.value = file
    previewUrl.value = URL.createObjectURL(file)
    result.value = null
    copied.value = false
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  const file = event.dataTransfer?.files[0]
  if (file && file.type === 'image/png') {
    selectedFile.value = file
    previewUrl.value = URL.createObjectURL(file)
    result.value = null
    copied.value = false
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
}

const handleConvert = async () => {
  if (!selectedFile.value) return
  result.value = await convert(selectedFile.value, options.value)
}

const handleDownload = () => {
  if (!result.value) return
  const filename = selectedFile.value?.name.replace('.png', '.svg') || 'converted.svg'
  downloadSvg(result.value.svg, filename)
}

const handleCopy = async () => {
  if (!result.value) return
  const success = await copyToClipboard(result.value.svg)
  if (success) {
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

const sizeChange = computed(() => {
  if (!result.value) return null
  const change = ((result.value.svgSize - result.value.originalSize) / result.value.originalSize) * 100
  return change.toFixed(1)
})

const colorModeOptions = [
  { value: 'color', label: computed(() => t('pngToSvg.colorMode.color')) },
  { value: 'grayscale', label: computed(() => t('pngToSvg.colorMode.grayscale')) },
  { value: 'blackwhite', label: computed(() => t('pngToSvg.colorMode.blackwhite')) }
]

const detailLevelOptions = [
  { value: 'low', label: computed(() => t('pngToSvg.detail.low')) },
  { value: 'medium', label: computed(() => t('pngToSvg.detail.medium')) },
  { value: 'high', label: computed(() => t('pngToSvg.detail.high')) }
]
</script>

<template>
  <div class="page">
    <div class="page-inner">
      <div class="page-header">
        <h1>{{ t('pngToSvg.title') }}</h1>
        <p>{{ t('pngToSvg.subtitle') }}</p>
      </div>

      <div class="upload-area" 
           :class="{ 'has-file': selectedFile }"
           @drop="handleDrop"
           @dragover="handleDragOver"
           @click="fileInput?.click()">
        <input 
          ref="fileInput"
          type="file" 
          accept="image/png" 
          @change="handleFileSelect"
          hidden
        />
        
        <template v-if="!selectedFile">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <p class="upload-text">{{ t('pngToSvg.uploadText') }}</p>
          <p class="upload-hint">{{ t('pngToSvg.uploadHint') }}</p>
        </template>
        
        <template v-else>
          <img :src="previewUrl!" :alt="t('pngToSvg.preview')" class="preview-image" loading="lazy" decoding="async" />
          <p class="file-name">{{ selectedFile.name }}</p>
          <p class="file-size">{{ formatSize(selectedFile.size) }}</p>
        </template>
      </div>

      <div v-if="selectedFile" class="options-area">
        <h3>{{ t('pngToSvg.options') }}</h3>
        
        <div class="option-group">
          <label>{{ t('pngToSvg.optionColorMode') }}</label>
          <div class="option-buttons">
            <button 
              v-for="opt in colorModeOptions" 
              :key="opt.value"
              :class="{ active: options.colorMode === opt.value }"
              @click="options.colorMode = opt.value as any"
            >
              {{ opt.label.value }}
            </button>
          </div>
        </div>
        
        <div class="option-group">
          <label>{{ t('pngToSvg.optionDetail') }}</label>
          <div class="option-buttons">
            <button 
              v-for="opt in detailLevelOptions" 
              :key="opt.value"
              :class="{ active: options.detailLevel === opt.value }"
              @click="options.detailLevel = opt.value as any"
            >
              {{ opt.label.value }}
            </button>
          </div>
        </div>
        
        <div v-if="options.colorMode === 'blackwhite'" class="option-group">
          <label>{{ t('pngToSvg.optionThreshold') }}: {{ options.threshold }}</label>
          <input 
            type="range" 
            min="0" 
            max="255" 
            v-model.number="options.threshold"
          />
        </div>
        
        <div class="option-group">
          <label>{{ t('pngToSvg.optionStroke') }}: {{ options.strokeWidth }}px</label>
          <input 
            type="range" 
            min="0" 
            max="5" 
            step="0.5"
            v-model.number="options.strokeWidth"
          />
        </div>
      </div>

      <div v-if="selectedFile" class="action-area">
        <button 
          class="convert-btn" 
          :disabled="isConverting"
          @click="handleConvert"
        >
          <template v-if="isConverting">
            <span class="spinner"></span>
            {{ t('pngToSvg.converting') }} {{ progress }}%
          </template>
          <template v-else>
            {{ t('pngToSvg.start') }}
          </template>
        </button>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="result" class="result-area">
        <h3>{{ t('pngToSvg.result') }}</h3>
        
        <div class="result-preview">
          <div class="preview-item">
            <span class="label">{{ t('pngToSvg.originalImage') }}</span>
            <img :src="previewUrl!" :alt="t('pngToSvg.originalImage')" class="result-image" loading="lazy" decoding="async" />
          </div>
          <div class="preview-item">
            <span class="label">{{ t('pngToSvg.svgPreview') }}</span>
            <div class="svg-preview" v-html="result.svg"></div>
          </div>
        </div>
        
        <div class="result-info">
          <div class="info-item">
            <span class="label">{{ t('pngToSvg.size') }}</span>
            <span class="value">{{ result.width }} x {{ result.height }}</span>
          </div>
          <div class="info-item">
            <span class="label">{{ t('pngToSvg.originalSize') }}</span>
            <span class="value">{{ formatSize(result.originalSize) }}</span>
          </div>
          <div class="info-item">
            <span class="label">{{ t('pngToSvg.svgSize') }}</span>
            <span class="value">{{ formatSize(result.svgSize) }}</span>
          </div>
          <div class="info-item">
            <span class="label">{{ t('pngToSvg.sizeChange') }}</span>
            <span class="value" :class="{ 'increase': parseFloat(sizeChange!) > 0, 'decrease': parseFloat(sizeChange!) < 0 }">
              {{ parseFloat(sizeChange!) > 0 ? '+' : '' }}{{ sizeChange }}%
            </span>
          </div>
        </div>
        
        <div class="result-actions">
          <button class="action-btn primary" @click="handleDownload">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {{ t('pngToSvg.download') }}
          </button>
          <button class="action-btn" @click="handleCopy">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            {{ copied ? t('pngToSvg.copied') : t('pngToSvg.copy') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding-top: 56px;
}

.page-inner {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px;
}

.page-header {
  margin-bottom: 24px;
  
  h1 {
    font-size: 28px;
    font-weight: 700;
    color: var(--color-text);
    margin-bottom: 4px;
  }
  
  p {
    font-size: 15px;
    color: var(--color-text-secondary);
  }
}

.upload-area {
  border: 2px dashed var(--color-border);
  border-radius: var(--border-radius);
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: var(--transition);
  
  &:hover {
    border-color: var(--color-primary);
    background: rgba(var(--color-primary-rgb), 0.05);
  }
  
  &.has-file {
    border-style: solid;
    padding: 24px;
  }
  
  svg {
    color: var(--color-text-secondary);
    margin-bottom: 16px;
  }
  
  .upload-text {
    font-size: 16px;
    font-weight: 500;
    color: var(--color-text);
    margin-bottom: 4px;
  }
  
  .upload-hint {
    font-size: 13px;
    color: var(--color-text-secondary);
  }
  
  .preview-image {
    max-width: 200px;
    max-height: 200px;
    object-fit: contain;
    border-radius: var(--border-radius);
    margin-bottom: 12px;
  }
  
  .file-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text);
    margin-bottom: 4px;
  }
  
  .file-size {
    font-size: 13px;
    color: var(--color-text-secondary);
  }
}

.options-area {
  margin-top: 24px;
  padding: 20px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 16px;
  }
}

.option-group {
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text);
    margin-bottom: 8px;
  }
  
  input[type="range"] {
    width: 100%;
    height: 6px;
    -webkit-appearance: none;
    background: var(--color-border);
    border-radius: 3px;
    outline: none;
    
    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 18px;
      height: 18px;
      background: var(--color-primary);
      border-radius: 50%;
      cursor: pointer;
    }
  }
}

.option-buttons {
  display: flex;
  gap: 8px;
  
  button {
    flex: 1;
    padding: 10px 16px;
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    font-size: 14px;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: var(--transition);
    
    &:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
    
    &.active {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: white;
    }
  }
}

.action-area {
  margin-top: 24px;
  text-align: center;
}

.convert-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 48px;
  background: var(--color-primary);
  border: none;
  border-radius: var(--border-radius);
  font-size: 16px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: var(--transition);
  
  &:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  margin-top: 16px;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--border-radius);
  color: #EF4444;
  font-size: 14px;
  text-align: center;
}

.result-area {
  margin-top: 24px;
  padding: 20px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 16px;
  }
}

.result-preview {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.preview-item {
  text-align: center;
  
  .label {
    display: block;
    font-size: 12px;
    color: var(--color-text-secondary);
    margin-bottom: 8px;
  }
  
  .result-image,
  .svg-preview {
    width: 100%;
    height: 200px;
    object-fit: contain;
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    display: flex;
    align-items: center;
    justify-content: center;
    
    :deep(svg) {
      max-width: 100%;
      max-height: 100%;
    }
  }
}

.result-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  background: var(--color-background);
  border-radius: var(--border-radius);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .label {
    font-size: 13px;
    color: var(--color-text-secondary);
  }
  
  .value {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text);
    
    &.increase {
      color: #EF4444;
    }
    
    &.decrease {
      color: #10B981;
    }
  }
}

.result-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  font-size: 14px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: var(--transition);
  
  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
  
  &.primary {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
    
    &:hover {
      opacity: 0.9;
    }
  }
}

@media (max-width: 600px) {
  .result-preview {
    grid-template-columns: 1fr;
  }
  
  .result-info {
    grid-template-columns: 1fr;
  }
  
  .result-actions {
    flex-direction: column;
  }
}
</style>
