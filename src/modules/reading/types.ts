export interface Chapter {
  id: string
  title: string
  content: string
  startIndex: number
  endIndex: number
}

export interface Book {
  id: string
  name: string
  chapters: Chapter[]
  totalLength: number
  createdAt: number
}

export interface ReaderSettings {
  fontSize: number
  fontFamily: string
  lineHeight: number
  backgroundColor: string
  textColor: string
}
