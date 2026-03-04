import { reactive, ref, computed } from 'vue'
import type { Book, Chapter, ReaderSettings } from '../types'
import { i18n } from '@/core/i18n'

export function useTxtParser() {
  const isParsing = ref(false)
  const error = ref<string | null>(null)

  const detectEncoding = async (buffer: ArrayBuffer): Promise<string> => {
    const uint8Array = new Uint8Array(buffer)
    
    if (uint8Array[0] === 0xEF && uint8Array[1] === 0xBB && uint8Array[2] === 0xBF) {
      return 'utf-8'
    }
    
    if (uint8Array[0] === 0xFF && uint8Array[1] === 0xFE) {
      return 'utf-16le'
    }
    
    if (uint8Array[0] === 0xFE && uint8Array[1] === 0xFF) {
      return 'utf-16be'
    }
    
    return 'utf-8'
  }

  const detectChapters = (content: string): Chapter[] => {
    const chapters: Chapter[] = []
    const patterns = [
      /^第[零一二三四五六七八九十百千万\d]+[章节回][\s\S]*?(?=第[零一二三四五六七八九十百千万\d]+[章节回]|$)/gm,
      /^Chapter\s*\d+[\s\S]*?(?=Chapter\s*\d+|$)/gim,
      /^[^\n]{1,50}\n[^\n]*$/gm
    ]

    for (const pattern of patterns) {
      const matches = content.match(pattern)
      if (matches && matches.length >= 3) {
        let index = 0
        for (const match of matches) {
          const startIndex = content.indexOf(match, index)
          const lines = match.split('\n')
          const firstLine = lines[0]
          const title = firstLine
            ? firstLine.trim().slice(0, 50)
            : ((i18n.global.locale as any).value === 'en' ? `Part ${chapters.length + 1}` : `第 ${chapters.length + 1} 部分`)
          chapters.push({
            id: `chapter-${chapters.length}`,
            title,
            content: match.trim(),
            startIndex,
            endIndex: startIndex + match.length
          })
          index = startIndex + 1
        }
        break
      }
    }

    if (chapters.length === 0) {
      const lines = content.split('\n')
      const chunkSize = 500
      for (let i = 0; i < lines.length; i += chunkSize) {
        const chunk = lines.slice(i, i + chunkSize).join('\n')
        chapters.push({
          id: `chapter-${chapters.length}`,
          title: (i18n.global.locale as any).value === 'en' ? `Part ${chapters.length + 1}` : `第 ${chapters.length + 1} 部分`,
          content: chunk,
          startIndex: 0,
          endIndex: 0
        })
      }
    }

    return chapters
  }

  const parse = async (file: File): Promise<Book | null> => {
    isParsing.value = true
    error.value = null

    try {
      const buffer = await file.arrayBuffer()
      const encoding = await detectEncoding(buffer)
      
      const decoder = new TextDecoder(encoding)
      let content = decoder.decode(buffer)
      
      content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
      
      const chapters = detectChapters(content)

      const book: Book = {
        id: `book-${Date.now()}`,
        name: file.name.replace(/\.txt$/i, ''),
        chapters,
        totalLength: content.length,
        createdAt: Date.now()
      }

      return book
    } catch (e) {
      error.value = e instanceof Error ? e.message : ((i18n.global.locale as any).value === 'en' ? 'Parse failed' : '解析失败')
      return null
    } finally {
      isParsing.value = false
    }
  }

  return {
    parse,
    isParsing,
    error
  }
}

export function useReader() {
  const currentBook = ref<Book | null>(null)
  const currentChapterIndex = ref(0)
  const settings = reactive<ReaderSettings>({
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

  const loadBook = (book: Book) => {
    currentBook.value = book
    currentChapterIndex.value = 0
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
    if (currentBook.value && index >= 0 && index < currentBook.value.chapters.length) {
      currentChapterIndex.value = index
    }
  }

  const updateSettings = (newSettings: Partial<ReaderSettings>) => {
    Object.assign(settings, newSettings)
  }

  return {
    currentBook,
    currentChapterIndex,
    currentChapter,
    settings,
    loadBook,
    nextChapter,
    prevChapter,
    goToChapter,
    updateSettings
  }
}
