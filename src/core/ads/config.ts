export type AdsProvider = 'none' | 'adsense' | 'admanager'

export interface AdsConfig {
  enabled: boolean
  provider: AdsProvider
  adsenseClient?: string
  slots: {
    topBanner?: string
    inFeed?: string
    stickyBottom?: string
  }
}

export const adsConfig: AdsConfig = {
  enabled: import.meta.env.VITE_ADS_ENABLED === 'true',
  provider: (import.meta.env.VITE_ADS_PROVIDER as AdsProvider) || 'none',
  adsenseClient: import.meta.env.VITE_ADSENSE_CLIENT,
  slots: {
    topBanner: import.meta.env.VITE_ADSENSE_SLOT_TOP_BANNER,
    inFeed: import.meta.env.VITE_ADSENSE_SLOT_IN_FEED,
    stickyBottom: import.meta.env.VITE_ADSENSE_SLOT_STICKY_BOTTOM
  }
}
