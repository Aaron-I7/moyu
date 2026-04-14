import {
  getChildAccessFunctionName,
  getChildExtensionFunctionName,
  getChildPortalCloudbaseApp
} from './cloudbase'
import { buildFallbackGrowthAdvice, buildFallbackGrowthStats } from './growth-stats'
import type {
  ChildGrowthAdviceResponse,
  ChildGrowthRange,
  ChildGrowthStatsResponse,
  ChildHomeResponse,
  ChildPointsResponse,
  ChildPortalSessionResponse,
  ChildRewardsResponse,
  ChildTasksResponse
} from './types'

const MEDIA_URL_CACHE_BUFFER_MS = 30 * 1000
const MEDIA_FIELD_NAMES = new Set([
  'image_url',
  'avatar_url',
  'child_avatar_url',
  'imageUrl',
  'avatarUrl',
  'childAvatarUrl'
])

const mediaUrlCache = new Map<string, { url: string; expiresAt: number | null }>()
const mediaUrlPromiseCache = new Map<string, Promise<string>>()
let childAccessFeatureStatus: 'unknown' | 'ready' | 'unavailable' = 'unknown'
let childExtensionStatus: 'unknown' | 'ready' | 'unavailable' = 'unknown'

export class ChildPortalApiError extends Error {
  code: number

  constructor(message: string, code = 50099) {
    super(message)
    this.name = 'ChildPortalApiError'
    this.code = code
  }
}

function normalizeSdkError(error: unknown): ChildPortalApiError {
  const message = String((error as { message?: string })?.message || '')

  if (!message) {
    return new ChildPortalApiError('儿童入口暂时不可用，请稍后重试')
  }

  if (message.includes('VITE_CLOUDBASE_ENV_ID')) {
    return new ChildPortalApiError('CloudBase 环境还没有配置好')
  }

  if (message.includes('Failed to fetch') || message.includes('Network')) {
    return new ChildPortalApiError('无法连接儿童入口服务，请检查 CloudBase Web 安全域名配置')
  }

  if (message.includes('PERMISSION_DENIED') || message.includes('Permission denied')) {
    return new ChildPortalApiError('CloudBase 云函数还没有开放 Web 调用权限')
  }

  return new ChildPortalApiError(message)
}

function shouldUseChildExtensionFallback(error: unknown): boolean {
  const message = String((error as { message?: string })?.message || '')
  const code = Number((error as { code?: number })?.code || 0)

  return (
    message.includes('Unsupported action') ||
    message.includes('not found') ||
    message.includes('temporarily unavailable') ||
    message.includes('temporarily') ||
    code >= 50000
  )
}

function normalizeMediaKey(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function isCloudbaseFileId(value: unknown): value is string {
  return normalizeMediaKey(value).startsWith('cloud://')
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(normalizeMediaKey(value))
}

function parseMediaUrlExpiry(url: string): number | null {
  try {
    const parsed = new URL(url)
    const expiry = Number(parsed.searchParams.get('t') || '')

    if (!Number.isFinite(expiry) || expiry <= 0) {
      return null
    }

    return expiry > 1e12 ? expiry : expiry * 1000
  } catch {
    return null
  }
}

function readCachedMediaUrl(fileId: string): string | null {
  const cacheKey = normalizeMediaKey(fileId)
  const cached = mediaUrlCache.get(cacheKey)
  if (!cached) {
    return null
  }

  if (
    cached.expiresAt !== null &&
    cached.expiresAt <= Date.now() + MEDIA_URL_CACHE_BUFFER_MS
  ) {
    mediaUrlCache.delete(cacheKey)
    return null
  }

  return cached.url
}

function cacheMediaUrl(fileId: string, url: string): void {
  const cacheKey = normalizeMediaKey(fileId)
  const normalizedUrl = normalizeMediaKey(url)

  if (!cacheKey || !normalizedUrl) {
    return
  }

  mediaUrlCache.set(cacheKey, {
    url: normalizedUrl,
    expiresAt: parseMediaUrlExpiry(normalizedUrl)
  })
}

async function resolveMediaUrl(url?: string): Promise<string> {
  const source = normalizeMediaKey(url)

  if (!source) {
    return ''
  }

  if (isHttpUrl(source)) {
    return source
  }

  if (!isCloudbaseFileId(source)) {
    return source
  }

  const cachedUrl = readCachedMediaUrl(source)
  if (cachedUrl) {
    return cachedUrl
  }

  const pending = mediaUrlPromiseCache.get(source)
  if (pending) {
    return pending
  }

  const promise = (async () => {
    try {
      const app = getChildPortalCloudbaseApp()
      const response = await app.getTempFileURL({ fileList: [source] })
      const fileList = Array.isArray((response as { fileList?: unknown[] })?.fileList)
        ? (response as {
            fileList: Array<{
              code?: string
              download_url?: string
              fileID?: string
              fileid?: string
              tempFileURL?: string
            }>
          }).fileList
        : []

      const match = fileList.find((item) => normalizeMediaKey(item?.fileID || item?.fileid) === source)
      const resolvedUrl = normalizeMediaKey(match?.tempFileURL || match?.download_url)

      if ((match?.code === 'SUCCESS' || !match?.code) && resolvedUrl) {
        cacheMediaUrl(source, resolvedUrl)
        return resolvedUrl
      }
    } catch {
    } finally {
      mediaUrlPromiseCache.delete(source)
    }

    return ''
  })()

  mediaUrlPromiseCache.set(source, promise)
  return promise
}

async function normalizeMediaFieldsDeep<T>(value: T): Promise<T> {
  if (!value || typeof value !== 'object') {
    return value
  }

  if (Array.isArray(value)) {
    return Promise.all(value.map((item) => normalizeMediaFieldsDeep(item))) as Promise<T>
  }

  const normalizedEntries = await Promise.all(
    Object.entries(value as Record<string, unknown>).map(async ([key, fieldValue]) => {
      if (MEDIA_FIELD_NAMES.has(key) && typeof fieldValue === 'string') {
        return [key, await resolveMediaUrl(fieldValue)] as const
      }

      return [key, await normalizeMediaFieldsDeep(fieldValue)] as const
    })
  )

  const normalizedObject = Object.fromEntries(normalizedEntries) as T

  const mediaRecord = normalizedObject as Record<string, unknown>
  const normalizedImageUrl = normalizeMediaKey(mediaRecord.image_url) || normalizeMediaKey(mediaRecord.imageUrl)
  const normalizedAvatarUrl = normalizeMediaKey(mediaRecord.avatar_url) || normalizeMediaKey(mediaRecord.avatarUrl)
  const normalizedChildAvatarUrl =
    normalizeMediaKey(mediaRecord.child_avatar_url) || normalizeMediaKey(mediaRecord.childAvatarUrl)

  if (normalizedImageUrl) {
    mediaRecord.image_url = normalizedImageUrl
    mediaRecord.imageUrl = normalizedImageUrl
  }

  if (normalizedAvatarUrl) {
    mediaRecord.avatar_url = normalizedAvatarUrl
    mediaRecord.avatarUrl = normalizedAvatarUrl
  }

  if (normalizedChildAvatarUrl) {
    mediaRecord.child_avatar_url = normalizedChildAvatarUrl
    mediaRecord.childAvatarUrl = normalizedChildAvatarUrl
  }

  return normalizedObject
}

async function normalizeResponseMedia<T>(response: T): Promise<T> {
  return normalizeMediaFieldsDeep(response)
}

async function callChildFunction<T>(
  functionName: string,
  action: string,
  payload: Record<string, unknown>
): Promise<T> {
  try {
    const app = getChildPortalCloudbaseApp()
    const response = await app.callFunction(
      {
        name: functionName,
        data: {
          action,
          payload
        }
      },
      undefined,
      { timeout: 60000 }
    )

    const envelope = (response as { result?: any })?.result || response || {}
    if (Number(envelope.code) !== 0) {
      throw new ChildPortalApiError(
        String(envelope.message || '儿童入口请求失败'),
        Number(envelope.code) || 50099
      )
    }

    return envelope.data as T
  } catch (error) {
    if (error instanceof ChildPortalApiError) {
      throw error
    }

    throw normalizeSdkError(error)
  }
}

async function callChildAccessFunction<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  return callChildFunction<T>(getChildAccessFunctionName(), action, payload)
}

async function callChildExtensionFunction<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const result = await callChildFunction<T>(getChildExtensionFunctionName(), action, payload)
  childExtensionStatus = 'ready'
  return result
}

async function callChildFeatureFunction<T>(
  action: string,
  payload: Record<string, unknown>
): Promise<T> {
  let lastError: unknown = null

  if (childAccessFeatureStatus !== 'unavailable') {
    try {
      const result = await callChildAccessFunction<T>(action, payload)
      childAccessFeatureStatus = 'ready'
      return result
    } catch (error) {
      if (!shouldUseChildExtensionFallback(error)) {
        throw error
      }

      childAccessFeatureStatus = 'unavailable'
      lastError = error
    }
  }

  if (childExtensionStatus !== 'unavailable') {
    try {
      return await callChildExtensionFunction<T>(action, payload)
    } catch (error) {
      if (!shouldUseChildExtensionFallback(error)) {
        throw error
      }

      childExtensionStatus = 'unavailable'
      lastError = error
    }
  }

  throw lastError || new ChildPortalApiError('儿童入口功能暂时不可用，请稍后再试。')
}

export async function resolvePortalSession(accessToken: string): Promise<ChildPortalSessionResponse> {
  const response = await callChildAccessFunction<ChildPortalSessionResponse>('resolveWebPortalSession', {
    access_token: accessToken
  })

  return normalizeResponseMedia(response)
}

export async function fetchChildHome(webSessionToken: string): Promise<ChildHomeResponse> {
  const response = await callChildAccessFunction<ChildHomeResponse>('home', {
    web_session_token: webSessionToken
  })

  return normalizeResponseMedia(response)
}

export async function fetchChildTasks(webSessionToken: string): Promise<ChildTasksResponse> {
  const response = await callChildAccessFunction<ChildTasksResponse>('tasks', {
    web_session_token: webSessionToken
  })

  return normalizeResponseMedia(response)
}

export async function submitChildTask(
  webSessionToken: string,
  payload: {
    idempotency_key: string
    record_date: string
    task_id: string
  }
): Promise<void> {
  await callChildAccessFunction('submitTask', {
    ...payload,
    web_session_token: webSessionToken
  })
}

export async function fetchChildRewards(webSessionToken: string): Promise<ChildRewardsResponse> {
  const response = await callChildAccessFunction<ChildRewardsResponse>('rewards', {
    web_session_token: webSessionToken
  })

  return normalizeResponseMedia(response)
}

export async function submitChildRewardRequest(
  webSessionToken: string,
  payload: {
    description?: string
    idempotency_key: string
    reward_type?: string
    title: string
  }
): Promise<void> {
  await callChildAccessFunction('submitRewardRequest', {
    ...payload,
    web_session_token: webSessionToken
  })
}

export async function submitChildRewardRedemption(
  webSessionToken: string,
  payload: {
    idempotency_key: string
    reward_id: string
  }
): Promise<void> {
  if (childAccessFeatureStatus === 'unavailable' && childExtensionStatus === 'unavailable') {
    throw new ChildPortalApiError('兑换入口正在发布中，请稍后再试。')
  }

  try {
    await callChildFeatureFunction('submitRewardRedemption', {
      ...payload,
      web_session_token: webSessionToken
    })
  } catch (error) {
    if (shouldUseChildExtensionFallback(error)) {
      childAccessFeatureStatus = 'unavailable'
      childExtensionStatus = 'unavailable'
      throw new ChildPortalApiError('兑换入口正在发布中，请稍后再试。')
    }

    throw error
  }
}

export async function confirmChildRewardFulfillment(
  webSessionToken: string,
  payload: {
    request_id: string
  }
): Promise<void> {
  await callChildAccessFunction('confirmRewardFulfillment', {
    ...payload,
    web_session_token: webSessionToken
  })
}

export async function fetchChildPoints(webSessionToken: string): Promise<ChildPointsResponse> {
  const response = await callChildAccessFunction<ChildPointsResponse>('pointsLedger', {
    web_session_token: webSessionToken
  })

  return normalizeResponseMedia(response)
}

export async function fetchChildGrowthStats(
  webSessionToken: string,
  range: ChildGrowthRange
): Promise<ChildGrowthStatsResponse> {
  try {
    const response = await callChildFeatureFunction<ChildGrowthStatsResponse>('growthStats', {
      range,
      web_session_token: webSessionToken
    })

    return normalizeResponseMedia(response)
  } catch (error) {
    if (!shouldUseChildExtensionFallback(error)) {
      throw error
    }
  }

  const [home, tasks, rewards, points] = await Promise.all([
    fetchChildHome(webSessionToken),
    fetchChildTasks(webSessionToken).catch(() => null),
    fetchChildRewards(webSessionToken),
    fetchChildPoints(webSessionToken)
  ])
  const fallbackResponse = buildFallbackGrowthStats({
    range,
    home,
    tasks,
    rewards,
    points,
    session: null
  })

  return normalizeResponseMedia(fallbackResponse)
}

export async function fetchChildGrowthAdvice(
  webSessionToken: string,
  range: ChildGrowthRange
): Promise<ChildGrowthAdviceResponse> {
  try {
    return await callChildFeatureFunction<ChildGrowthAdviceResponse>('growthAdvice', {
      range,
      web_session_token: webSessionToken
    })
  } catch (error) {
    if (!shouldUseChildExtensionFallback(error)) {
      throw error
    }
  }

  const stats = await fetchChildGrowthStats(webSessionToken, range)
  return buildFallbackGrowthAdvice(stats)
}
