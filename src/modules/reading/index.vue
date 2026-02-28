<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { Book } from './types'
import { useTxtParser } from './composables/useReader'

const { parse, isParsing, error } = useTxtParser()

const currentBook = ref<Book | null>(null)
const currentChapterIndex = ref(0)
const showChapterList = ref(false)

const settings = ref({
  fontSize: 18,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  lineHeight: 1.8,
  backgroundColor: '#ffffff',
  textColor: '#333333'
})

const currentChapter = computed(() => {
  if (!currentBook.value) return null
  return currentBook.value.chapters[currentChapterIndex.value]
})

const handleFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    const book = await parse(file)
    if (book) {
      currentBook.value = book
      currentChapterIndex.value = 0
    }
  }
}

const handleDrop = async (event: DragEvent) => {
  event.preventDefault()
  const file = event.dataTransfer?.files[0]
  if (file && file.name.endsWith('.txt')) {
    const book = await parse(file)
    if (book) {
      currentBook.value = book
      currentChapterIndex.value = 0
    }
  }
}

const nextChapter = () => {
  if (currentBook.value && currentChapterIndex.value < currentBook.value.chapters.length - 1) {
    currentChapterIndex.value++
  }
}

const prevChapter = () => {
  if (currentChapterIndex.value > 0) {
    currentChapterIndex.value--
  }
}

const goToChapter = (index: number) => {
  currentChapterIndex.value = index
  showChapterList.value = false
}
</script>

<template>
  <div class="reading-view">
    <div v-if="!currentBook" class="upload-area">
      <div 
        class="drop-zone"
        @drop="handleDrop"
        @dragover.prevent
        @dragenter.prevent
      >
        <Icon icon="mdi:file-document-outline" :width="64" />
        <h2>选择小说文件</h2>
        <p>支持 txt 格式，拖拽或点击上传</p>
        <label class="upload-btn">
          <input 
            type="file" 
            accept=".txt"
            @change="handleFileSelect"
            hidden
          />
          <span>选择文件</span>
        </label>
        <p v-if="isParsing" class="status">正在解析...</p>
        <p v-if="error" class="error">{{ error }}</p>
      </div>
    </div>

    <div v-else class="reader-area">
      <div class="reader-header">
        <h3>{{ currentBook.name }}</h3>
        <div class="header-actions">
          <button @click="showChapterList = !showChapterList">
            <Icon icon="mdi:format-list-bulleted" :width="20" />
            <span>目录</span>
          </button>
          <button @click="currentBook = null">
            <Icon icon="mdi:close" :width="20" />
          </button>
        </div>
      </div>

      <div class="reader-content" :style="{
        fontSize: settings.fontSize + 'px',
        fontFamily: settings.fontFamily,
        lineHeight: settings.lineHeight,
        backgroundColor: settings.backgroundColor,
        color: settings.textColor
      }">
        <h4 v-if="currentChapter">{{ currentChapter.title }}</h4>
        <div v-if="currentChapter" class="chapter-content">
          {{ currentChapter.content }}
        </div>
      </div>

      <div class="reader-footer">
        <button 
          :disabled="currentChapterIndex === 0"
          @click="prevChapter"
        >
          <Icon icon="mdi:chevron-left" :width="20" />
          上一章
        </button>
        <span>{{ currentChapterIndex + 1 }} / {{ currentBook.chapters.length }}</span>
        <button 
          :disabled="currentChapterIndex === currentBook.chapters.length - 1"
          @click="nextChapter"
        >
          下一章
          <Icon icon="mdi:chevron-right" :width="20" />
        </button>
      </div>

      <div v-if="showChapterList" class="chapter-list-overlay" @click="showChapterList = false">
        <div class="chapter-list" @click.stop>
          <h4>目录</h4>
          <div class="chapters">
            <div 
              v-for="(chapter, index) in currentBook.chapters" 
              :key="chapter.id"
              class="chapter-item"
              :class="{ active: index === currentChapterIndex }"
              @click="goToChapter(index)"
            >
              {{ chapter.title }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.reading-view {
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
}

.upload-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.drop-zone {
  text-align: center;
  padding: 60px 40px;
  border: 2px dashed var(--border-color);
  border-radius: 16px;
  background: var(--card-bg);
  
  h2 {
    margin: 16px 0 8px;
    font-size: 20px;
  }
  
  p {
    color: var(--text-secondary);
    margin-bottom: 16px;
  }
  
  .upload-btn {
    display: inline-block;
    padding: 12px 32px;
    background: var(--primary-color);
    color: white;
    border-radius: 8px;
    cursor: pointer;
    transition: opacity 0.2s;
    
    &:hover {
      opacity: 0.9;
    }
  }
  
  .status {
    color: var(--primary-color);
    margin-top: 16px;
  }
  
  .error {
    color: #f44336;
    margin-top: 16px;
  }
}

.reader-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.reader-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
  
  h3 {
    font-size: 16px;
    font-weight: 500;
  }
  
  .header-actions {
    display: flex;
    gap: 8px;
    
    button {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 12px;
      border-radius: 6px;
      background: var(--background-color);
      transition: background 0.2s;
      
      &:hover {
        background: var(--border-color);
      }
    }
  }
}

.reader-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  
  h4 {
    font-size: 1.2em;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border-color);
  }
  
  .chapter-content {
    white-space: pre-wrap;
    word-break: break-word;
  }
}

.reader-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: var(--card-bg);
  border-top: 1px solid var(--border-color);
  
  button {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 16px;
    border-radius: 6px;
    background: var(--primary-color);
    color: white;
    transition: opacity 0.2s;
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    &:not(:disabled):hover {
      opacity: 0.9;
    }
  }
  
  span {
    color: var(--text-secondary);
    font-size: 14px;
  }
}

.chapter-list-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
  display: flex;
  justify-content: flex-end;
}

.chapter-list {
  width: 300px;
  height: 100%;
  background: var(--card-bg);
  padding: 20px;
  overflow-y: auto;
  
  h4 {
    font-size: 18px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border-color);
  }
  
  .chapters {
    .chapter-item {
      padding: 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.2s;
      font-size: 14px;
      
      &:hover {
        background: var(--background-color);
      }
      
      &.active {
        background: var(--primary-color);
        color: white;
      }
    }
  }
}
</style>
