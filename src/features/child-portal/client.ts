import {
  getChildAccessFunctionName,
  getChildPortalCloudbaseApp
} from './cloudbase'
import type {
  ChildHomeResponse,
  ChildPointsResponse,
  ChildPortalSessionResponse,
  ChildRewardsResponse,
  ChildTasksResponse
} from './types'

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
  return callChildAccessFunction<ChildHomeResponse>('home', {
    web_session_token: webSessionToken
  })
}

export async function fetchChildTasks(webSessionToken: string): Promise<ChildTasksResponse> {
  return callChildAccessFunction<ChildTasksResponse>('tasks', {
    web_session_token: webSessionToken
  })
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
  return callChildAccessFunction<ChildRewardsResponse>('rewards', {
    web_session_token: webSessionToken
  })
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
