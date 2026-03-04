export interface LocalizationTestCase {
  id: string
  locale: string
  timezone: string
  currency: string
  unit: 'metric' | 'imperial'
  direction: 'ltr' | 'rtl'
  expected: string[]
}

export const localizationTestMatrix: LocalizationTestCase[] = [
  {
    id: 'en-us-commute',
    locale: 'en',
    timezone: 'America/New_York',
    currency: 'USD',
    unit: 'imperial',
    direction: 'ltr',
    expected: ['left-dock', 'voice-command-home', 'strategy-work']
  },
  {
    id: 'zh-apac-night',
    locale: 'zh',
    timezone: 'Asia/Shanghai',
    currency: 'CNY',
    unit: 'metric',
    direction: 'ltr',
    expected: ['night-strategy', 'unicode-reader', 'share-entry']
  }
]
