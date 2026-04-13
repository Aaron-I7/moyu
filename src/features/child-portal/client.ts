import {
  getChildAccessFunctionName,
  getChildPortalCloudbaseApp
} from './cloudbase'
import type {
  ChildProfile,
  ChildHomeResponse,
  ChildPointsResponse,
  ChildRewardItem,
  ChildPortalSessionResponse,
  ChildRewardsResponse,
  ChildTaskItem,
  ChildTasksResponse
} from './types'

const MEDIA_URL_CACHE_BUFFER_MS = 30 * 1000

const mediaUrlCache = new Map<string, { url: string; expiresAt: number | null }>()

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

function isCloudbaseFileId(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('cloud://')
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
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
  const cached = mediaUrlCache.get(fileId)
  if (!cached) {
    return null
  }

  if (
    cached.expiresAt !== null &&
    cached.expiresAt <= Date.now() + MEDIA_URL_CACHE_BUFFER_MS
  ) {
    mediaUrlCache.delete(fileId)
    return null
  }

  return cached.url
}

function cacheMediaUrl(fileId: string, url: string): void {
  if (!fileId || !url) {
    return
  }

  mediaUrlCache.set(fileId, {
    url,
    expiresAt: parseMediaUrlExpiry(url)
  })
}

async function ensureResolvedMediaUrls(urls: Array<string | undefined>): Promise<void> {
  const pendingFileIds = [...new Set(
    urls
      .filter(isCloudbaseFileId)
      .filter((fileId) => !readCachedMediaUrl(fileId))
  )]

  if (!pendingFileIds.length) {
    return
  }

  try {
    const app = getChildPortalCloudbaseApp()
    const response = await app.getTempFileURL({ fileList: pendingFileIds })
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

    fileList.forEach((item) => {
      const fileId = String(item?.fileID || item?.fileid || '')
      const url = String(item?.tempFileURL || item?.download_url || '')

      if ((item?.code === 'SUCCESS' || !item?.code) && fileId && url) {
        cacheMediaUrl(fileId, url)
      }
    })
  } catch (error) {
    console.warn('[child-portal] failed to normalize media urls', error)
  }
}

function normalizeMediaUrl(url?: string): string {
  if (!url) {
    return ''
  }

  if (isHttpUrl(url)) {
    return url
  }

  if (!isCloudbaseFileId(url)) {
    return url
  }

  return readCachedMediaUrl(url) || ''
}

function normalizeChildProfileMedia(profile: ChildProfile): ChildProfile {
  const nextAvatarUrl = normalizeMediaUrl(profile.avatar_url)
  const nextAvatarUrlCamel = normalizeMediaUrl(
    (profile as ChildProfile & { avatarUrl?: string }).avatarUrl
  )

  if (
    nextAvatarUrl === (profile.avatar_url || '') &&
    nextAvatarUrlCamel === String((profile as ChildProfile & { avatarUrl?: string }).avatarUrl || '')
  ) {
    return profile
  }

  return {
    ...profile,
    avatar_url: nextAvatarUrl,
    ...(Object.prototype.hasOwnProperty.call(profile, 'avatarUrl')
      ? { avatarUrl: nextAvatarUrlCamel }
      : {})
  }
}

function collectChildProfileMediaUrls(profile: ChildProfile): Array<string | undefined> {
  return [
    profile.avatar_url,
    (profile as ChildProfile & { avatarUrl?: string }).avatarUrl
  ]
}

function normalizeTaskListMedia(tasks: ChildTaskItem[]): ChildTaskItem[] {
  return tasks.map((task) => {
    const nextImageUrl = normalizeMediaUrl(task.image_url)
    if (nextImageUrl === (task.image_url || '')) {
      return task
    }

    return {
      ...task,
      image_url: nextImageUrl
    }
  })
}

function normalizeRewardListMedia(rewards: ChildRewardItem[]): ChildRewardItem[] {
  return rewards.map((reward) => {
    const nextImageUrl = normalizeMediaUrl(reward.image_url)
    if (nextImageUrl === (reward.image_url || '')) {
      return reward
    }

    return {
      ...reward,
      image_url: nextImageUrl
    }
  })
}

async function normalizeHomeResponseMedia(response: ChildHomeResponse): Promise<ChildHomeResponse> {
  await ensureResolvedMediaUrls([
    ...collectChildProfileMediaUrls(response.child_profile),
    ...response.today_tasks.map((task) => task.image_url)
  ])

  return {
    ...response,
    child_profile: normalizeChildProfileMedia(response.child_profile),
    today_tasks: normalizeTaskListMedia(response.today_tasks)
  }
}

async function normalizeTasksResponseMedia(response: ChildTasksResponse): Promise<ChildTasksResponse> {
  await ensureResolvedMediaUrls([
    ...collectChildProfileMediaUrls(response.child_profile),
    ...response.active_tasks.map((task) => task.image_url),
    ...response.pending_tasks.map((task) => task.image_url),
    ...response.completed_tasks.map((task) => task.image_url)
  ])

  return {
    ...response,
    child_profile: normalizeChildProfileMedia(response.child_profile),
    active_tasks: normalizeTaskListMedia(response.active_tasks),
    pending_tasks: normalizeTaskListMedia(response.pending_tasks),
    completed_tasks: normalizeTaskListMedia(response.completed_tasks)
  }
}

async function normalizeRewardsResponseMedia(response: ChildRewardsResponse): Promise<ChildRewardsResponse> {
  await ensureResolvedMediaUrls([
    ...collectChildProfileMediaUrls(response.child_profile),
    ...response.rewards.map((reward) => reward.image_url)
  ])

  return {
    ...response,
    child_profile: normalizeChildProfileMedia(response.child_profile),
    rewards: normalizeRewardListMedia(response.rewards)
  }
}

async function callChildAccessFunction<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  try {
    const app = getChildPortalCloudbaseApp()
    const response = await app.callFunction(
      {
        name: getChildAccessFunctionName(),
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

export async function resolvePortalSession(accessToken: string): Promise<ChildPortalSessionResponse> {
  return callChildAccessFunction<ChildPortalSessionResponse>('resolveWebPortalSession', {
    access_token: accessToken
  })
}

export async function fetchChildHome(webSessionToken: string): Promise<ChildHomeResponse> {
  const response = await callChildAccessFunction<ChildHomeResponse>('home', {
    web_session_token: webSessionToken
  })

  return normalizeHomeResponseMedia(response)
}

export async function fetchChildTasks(webSessionToken: string): Promise<ChildTasksResponse> {
  const response = await callChildAccessFunction<ChildTasksResponse>('tasks', {
    web_session_token: webSessionToken
  })

  return normalizeTasksResponseMedia(response)
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

  return normalizeRewardsResponseMedia(response)
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

export async function fetchChildPoints(webSessionToken: string): Promise<ChildPointsResponse> {
  return callChildAccessFunction<ChildPointsResponse>('pointsLedger', {
    web_session_token: webSessionToken
  })
}
