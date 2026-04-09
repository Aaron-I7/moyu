export function formatDateTime(value?: number | string): string {
  if (!value) {
    return '暂无记录'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '暂无记录'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

export function formatPoints(value?: number): string {
  return `${Number(value) || 0} 分`
}

export function formatExpiry(expiresAt?: number): string {
  if (!expiresAt) {
    return '未设置'
  }

  const diff = expiresAt - Date.now()
  if (diff <= 0) {
    return '已过期'
  }

  const hours = Math.floor(diff / (60 * 60 * 1000))
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))

  if (hours > 0) {
    return `约 ${hours} 小时 ${minutes} 分钟后过期`
  }

  return `约 ${Math.max(minutes, 1)} 分钟后过期`
}

export function createIdempotencyKey(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}
