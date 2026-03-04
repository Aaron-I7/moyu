export type SharePlatform = 'x' | 'tiktok' | 'instagram'

export interface SharePayload {
  title: string
  text: string
  url: string
}

function buildPlatformUrl(platform: SharePlatform, payload: SharePayload): string {
  if (platform === 'x') {
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(payload.text)}&url=${encodeURIComponent(payload.url)}`
  }
  if (platform === 'tiktok') {
    return 'https://www.tiktok.com/upload'
  }
  return 'https://www.instagram.com/'
}

export async function shareWithWebApi(payload: SharePayload): Promise<boolean> {
  if (!navigator.share) {
    return false
  }
  try {
    await navigator.share(payload)
    return true
  } catch {
    return false
  }
}

export async function shareToPlatform(platform: SharePlatform, payload: SharePayload): Promise<void> {
  const opened = await shareWithWebApi(payload)
  if (opened) {
    return
  }
  window.open(buildPlatformUrl(platform, payload), '_blank', 'noopener,noreferrer')
}
