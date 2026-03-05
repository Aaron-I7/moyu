import Holidays from 'date-holidays'
import { HolidayUtil } from 'lunar-javascript'

export type CalendarRegion = 'cn' | 'sg' | 'my' | 'kr' | 'jp'

export interface CalendarHolidayInfo {
  name: string
  isWorkday: boolean
}

const countryCodeMap: Record<Exclude<CalendarRegion, 'cn'>, string> = {
  sg: 'SG',
  my: 'MY',
  kr: 'KR',
  jp: 'JP'
}

const holidayInstanceCache = new Map<string, Holidays>()

function getHolidayInstance(region: Exclude<CalendarRegion, 'cn'>): Holidays {
  const code = countryCodeMap[region]
  const existing = holidayInstanceCache.get(code)
  if (existing) {
    return existing
  }
  const created = new Holidays(code)
  holidayInstanceCache.set(code, created)
  return created
}

export function getHolidayInfo(date: Date, region: CalendarRegion): CalendarHolidayInfo | null {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  if (region === 'cn') {
    const holiday = HolidayUtil.getHoliday(year, month, day)
    if (!holiday) {
      return null
    }
    return {
      name: holiday.getName(),
      isWorkday: holiday.isWork()
    }
  }

  const engine = getHolidayInstance(region)
  const holidayResult = engine.isHoliday(date)
  if (!holidayResult) {
    return null
  }
  const firstHoliday = Array.isArray(holidayResult) ? holidayResult[0] : holidayResult
  if (!firstHoliday) {
    return null
  }
  return {
    name: firstHoliday.name,
    isWorkday: false
  }
}
