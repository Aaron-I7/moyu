import cloudbase from '@cloudbase/js-sdk'

const envId = import.meta.env.VITE_CLOUDBASE_ENV_ID
const region = import.meta.env.VITE_CLOUDBASE_REGION || 'ap-shanghai'
const accessKey = import.meta.env.VITE_CLOUDBASE_ACCESS_KEY
const childAccessFunction = import.meta.env.VITE_CHILD_ACCESS_FUNCTION || 'baby-grow-childAccess'
const childExtensionFunction = import.meta.env.VITE_CHILD_EXTENSION_FUNCTION || 'baby-grow-childExtension'

let childPortalApp: any = null

export function hasChildPortalCloudbaseConfig(): boolean {
  return Boolean(envId)
}

export function getChildAccessFunctionName(): string {
  return childAccessFunction
}

export function getChildExtensionFunctionName(): string {
  return childExtensionFunction
}

export function getChildPortalCloudbaseApp(): any {
  if (!childPortalApp) {
    if (!envId) {
      throw new Error('VITE_CLOUDBASE_ENV_ID is not configured')
    }

    const initOptions: any = {
      env: envId,
      region,
      timeout: 60000
    }

    if (accessKey) {
      initOptions.accessKey = accessKey
    }

    childPortalApp = cloudbase.init(initOptions)
  }

  return childPortalApp
}
