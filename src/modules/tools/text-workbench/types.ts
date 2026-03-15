export type TabKey =
  | 'diff'
  | 'formatter'
  | 'dedupe'
  | 'replace'
  | 'structured'
  | 'base64'
  | 'urlCodec'
  | 'unicodeEscape'

export type ProcessState = 'idle' | 'processing' | 'success' | 'empty' | 'error'

export type DiffRow = {
  type: 'same' | 'add' | 'remove'
  left: string
  right: string
}
