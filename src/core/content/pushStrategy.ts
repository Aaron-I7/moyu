import type { AppLocale } from '@/core/i18n'
import { localeMetaMap } from '@/core/i18n'

export interface PushStrategy {
  holidayContext: string
  commuteContext: string
  rhythmContext: string
  recommend: string[]
  avoid: string[]
}

const holidayMap: Record<AppLocale, Record<string, string>> = {
  en: {
    '01-01': 'New Year',
    '07-04': 'Independence Day',
    '11-27': 'Thanksgiving',
    '12-25': 'Christmas'
  },
  zh: {
    '01-01': '元旦',
    '05-01': '劳动节',
    '10-01': '国庆',
    '12-31': '跨年'
  }
}

function formatDateKey(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${mm}-${dd}`
}

function getCommuteContext(hour: number): 'pre-commute' | 'commute' | 'work' | 'post-work' | 'night' {
  if (hour >= 6 && hour < 8) return 'pre-commute'
  if (hour >= 8 && hour < 10) return 'commute'
  if (hour >= 10 && hour < 18) return 'work'
  if (hour >= 18 && hour < 21) return 'post-work'
  return 'night'
}

function getRhythmByRegion(region: string): string {
  if (region === 'europe') {
    return '40-hour standard week with strict break awareness'
  }
  if (region === 'americas') {
    return 'high context-switch workflow with short break bursts'
  }
  if (region === 'mena') {
    return 'midday energy dip with evening activity rebound'
  }
  return 'high-density weekday rhythm with commute-driven interruptions'
}

export function buildPushStrategy(locale: AppLocale, date = new Date()): PushStrategy {
  const meta = localeMetaMap[locale]
  const holidayContext = holidayMap[locale][formatDateKey(date)] || 'Regular workday'
  const commuteSlot = getCommuteContext(date.getHours())
  const rhythmContext = getRhythmByRegion(meta.region)

  const recommendBySlot: Record<string, string[]> = {
    'pre-commute': ['White Noise Mixer', 'Novel Reader'],
    commute: ['Novel Reader', 'Rhythm Tap'],
    work: ['Rhythm Tap', 'Pixel Fishing'],
    'post-work': ['Virtual Pet', 'Pixel Fishing'],
    night: ['White Noise Mixer', 'Virtual Pet']
  }

  const avoidBySlot: Record<string, string[]> = {
    'pre-commute': ['Long conversion tasks'],
    commute: ['Precision-heavy interactions'],
    work: ['Long immersion loops'],
    'post-work': ['High cognitive toggling'],
    night: ['High-brightness rapid animation']
  }

  return {
    holidayContext,
    commuteContext: commuteSlot,
    rhythmContext,
    recommend: recommendBySlot[commuteSlot] || [],
    avoid: avoidBySlot[commuteSlot] || []
  }
}
