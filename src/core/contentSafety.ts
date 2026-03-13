export type ContentSafetyResult =
  | { ok: true }
  | { ok: false; reason: 'empty' | 'too_long' | 'contains_illegal' | 'repeat' }

const ILLEGAL_PATTERNS = [
  /(?:操你妈|草泥马|傻逼|他妈的|妈的|去死|cnm)/i,
  /(?:kill\s+yourself|f\*?u\*?c\*?k|n\*?i\*?g\*?g\*?e\*?r)/i,
  /(?:暴力袭击|恐怖袭击|仇恨言论)/i
]

export function checkVentContent(content: string, maxLength = 180): ContentSafetyResult {
  const text = content.trim()
  if (!text) return { ok: false, reason: 'empty' }
  if (text.length > maxLength) return { ok: false, reason: 'too_long' }
  if (/(.)\1{9,}/.test(text)) return { ok: false, reason: 'repeat' }
  for (const pattern of ILLEGAL_PATTERNS) {
    if (pattern.test(text)) {
      return { ok: false, reason: 'contains_illegal' }
    }
  }
  return { ok: true }
}
