const cjkRegex = /[\u3400-\u9FFF\uF900-\uFAFF]/g
const cjkDetectRegex = /[\u3400-\u9FFF\uF900-\uFAFF]/

function sanitizeText(text: string): string {
  const sanitized = text.replace(cjkRegex, '').replace(/\s{2,}/g, ' ').trim()
  if (sanitized) {
    return sanitized
  }
  if (cjkDetectRegex.test(text)) {
    return 'N/A'
  }
  return sanitized
}

function sanitizeElementAttributes(element: Element): void {
  const attrs = ['title', 'aria-label', 'placeholder', 'alt']
  attrs.forEach(attr => {
    const current = element.getAttribute(attr)
    if (!current) {
      return
    }
    const next = sanitizeText(current)
    if (next !== current) {
      element.setAttribute(attr, next)
    }
  })
}

function sanitizeTextNodes(root: Node): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let current = walker.nextNode()
  while (current) {
    const textNode = current as Text
    const value = textNode.nodeValue || ''
    if (value.trim()) {
      const next = sanitizeText(value)
      if (next !== value) {
        textNode.nodeValue = next
      }
    }
    current = walker.nextNode()
  }
}

function sanitizeElementTree(root: Element): void {
  sanitizeElementAttributes(root)
  root.querySelectorAll('*').forEach(node => sanitizeElementAttributes(node))
}

export function createEnTextGuard() {
  let observer: MutationObserver | null = null

  const runFullSanitize = () => {
    sanitizeTextNodes(document.body)
    sanitizeElementTree(document.body)
  }

  const start = () => {
    if (observer) {
      return
    }
    runFullSanitize()
    observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'characterData') {
          const textNode = mutation.target as Text
          const value = textNode.nodeValue || ''
          const next = sanitizeText(value)
          if (next !== value) {
            textNode.nodeValue = next
          }
          return
        }
        if (mutation.type === 'attributes' && mutation.target instanceof Element) {
          sanitizeElementAttributes(mutation.target)
          return
        }
        mutation.addedNodes.forEach(node => {
          sanitizeTextNodes(node)
          if (node instanceof Element) {
            sanitizeElementTree(node)
          }
        })
      })
    })
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['title', 'aria-label', 'placeholder', 'alt']
    })
  }

  const stop = () => {
    observer?.disconnect()
    observer = null
  }

  return { start, stop, runFullSanitize }
}
