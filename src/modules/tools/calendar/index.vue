<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { Solar } from 'lunar-javascript'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import { getHolidayInfo, type CalendarRegion } from './holidayEngine'
import SharedDivinationCard from '@/components/common/SharedDivinationCard.vue'

const { t, locale } = useI18n()
const currentDate = ref(dayjs())
const selectedDate = ref(dayjs())

// Region Switcher
const regions: Array<{ id: CalendarRegion; name: string; icon: string }> = [
  { id: 'cn', name: '中国', icon: 'twemoji:flag-china' },
  { id: 'sg', name: '新加坡', icon: 'twemoji:flag-singapore' },
  { id: 'my', name: '马来西亚', icon: 'twemoji:flag-malaysia' },
  { id: 'kr', name: '韩国', icon: 'twemoji:flag-south-korea' },
  { id: 'jp', name: '日本', icon: 'twemoji:flag-japan' },
]
const currentRegion = ref<CalendarRegion>('cn')
const isRegionMenuOpen = ref(false)
const currentRegionInfo = computed(() => regions.find(r => r.id === currentRegion.value))

onMounted(() => {
  document.addEventListener('click', closeRegionMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeRegionMenu)
})

const toggleRegionMenu = () => {
  isRegionMenuOpen.value = !isRegionMenuOpen.value
}

const selectRegion = (regionId: CalendarRegion) => {
  currentRegion.value = regionId
  isRegionMenuOpen.value = false
}

const closeRegionMenu = () => {
  isRegionMenuOpen.value = false
}

// Generate calendar grid
const calendarDays = computed(() => {
  const startOfMonth = currentDate.value.startOf('month')
  const endOfMonth = currentDate.value.endOf('month')
  const startOfWeek = startOfMonth.startOf('week')
  const endOfWeek = endOfMonth.endOf('week')

  const days = []
  let day = startOfWeek

  while (day.isBefore(endOfWeek) || day.isSame(endOfWeek, 'day')) {
    const solar = Solar.fromYmd(day.year(), day.month() + 1, day.date())
    const lunar = solar.getLunar()
    const holiday = getHolidayInfo(day.toDate(), currentRegion.value)

    days.push({
      date: day,
      isCurrentMonth: day.month() === currentDate.value.month(),
      isToday: day.isSame(dayjs(), 'day'),
      isSelected: day.isSame(selectedDate.value, 'day'),
      lunarDay: lunar.getDayInChinese(),
      lunarMonth: lunar.getMonthInChinese(),
      term: lunar.getJieQi(),
      holiday: holiday?.name || null,
      isWork: holiday?.isWorkday || false
    })
    day = day.add(1, 'day')
  }
  return days
})

const weekDays = computed(() => {
  return locale.value === 'zh' 
    ? ['日', '一', '二', '三', '四', '五', '六']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
})

const handlePrevMonth = () => {
  currentDate.value = currentDate.value.subtract(1, 'month')
}

const handleNextMonth = () => {
  currentDate.value = currentDate.value.add(1, 'month')
}

const handleToday = () => {
  currentDate.value = dayjs()
  selectedDate.value = dayjs()
}

const selectDate = (day: any) => {
  selectedDate.value = day.date
  if (!day.isCurrentMonth) {
    currentDate.value = day.date
  }
}

// Formatters
const currentMonthYear = computed(() => {
  return currentDate.value.format(locale.value === 'zh' ? 'YYYY年 M月' : 'MMMM YYYY')
})

const dateExtraInfo = computed(() => {
  const yearStart = selectedDate.value.startOf('year')
  const dayOfYear = selectedDate.value.diff(yearStart, 'day') + 1

  const temp = selectedDate.value.startOf('day')
  const isoDay = (temp.day() + 6) % 7
  temp.add(3 - isoDay, 'day')
  const firstThursday = dayjs(new Date(temp.year(), 0, 1)).startOf('day')
  const firstIsoDay = (firstThursday.day() + 6) % 7
  firstThursday.add(3 - firstIsoDay, 'day')
  const weekOfYear = 1 + Math.round(temp.diff(firstThursday, 'day') / 7)

  const daysToWeekend = selectedDate.value.day() === 6 ? 0 : 6 - selectedDate.value.day()
  const weekDay = selectedDate.value.day()
  const weekDayText = locale.value === 'zh'
    ? `星期${'日一二三四五六'.charAt(weekDay)}`
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][weekDay]
  
  const dayInfoText = locale.value === 'zh'
    ? `${selectedDate.value.format('YYYY')}年 第${dayOfYear}天，第${weekOfYear}周 ${weekDayText}`
    : `${selectedDate.value.format('YYYY')} Day ${dayOfYear}, Week ${weekOfYear} ${weekDayText}`
  
  const countdownText = locale.value === 'zh'
    ? (daysToWeekend === 0 ? '今天' : `${daysToWeekend}天后`)
    : (daysToWeekend === 0 ? 'Today' : `${daysToWeekend} day(s) later`)

  // Determine countdown icon based on context (weekend/holiday vs workday)
  // If it's 0 days to weekend (Saturday) or Sunday, use holiday icon
  // Otherwise use workday icon
  const isHolidayOrWeekend = daysToWeekend === 0 || selectedDate.value.day() === 0
  const countdownIcon = isHolidayOrWeekend ? 'mdi:beach' : 'mdi:briefcase-clock'

  return {
    dayInfoText,
    countdownText,
    countdownIcon
  }
})

const selectedDateDetail = computed(() => {
  const solar = Solar.fromYmd(selectedDate.value.year(), selectedDate.value.month() + 1, selectedDate.value.date())
  const lunar = solar.getLunar()
  const holiday = getHolidayInfo(selectedDate.value.toDate(), currentRegion.value)
  const lunarAny = lunar as any
  const eightChar = typeof lunarAny.getEightChar === 'function' ? lunarAny.getEightChar() : null
  const safeCall = (target: any, method: string) =>
    target && typeof target[method] === 'function' ? target[method]() : ''
  
  // Almanac details
  const ganzhi = `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInGanZhi()}月 ${lunar.getDayInGanZhi()}日`
  const wuxingFromLunar = [
    safeCall(lunarAny, 'getYearWuXing'),
    safeCall(lunarAny, 'getMonthWuXing'),
    safeCall(lunarAny, 'getDayWuXing')
  ].filter(Boolean).join(' ')
  const wuxingFromEightChar = [
    safeCall(eightChar, 'getYearWuXing'),
    safeCall(eightChar, 'getMonthWuXing'),
    safeCall(eightChar, 'getDayWuXing')
  ].filter(Boolean).join(' ')
  const wuxingFromNaYin = [
    safeCall(lunarAny, 'getYearNaYin'),
    safeCall(lunarAny, 'getMonthNaYin'),
    safeCall(lunarAny, 'getDayNaYin')
  ].filter(Boolean).join(' ')
  const wuxing = wuxingFromLunar || wuxingFromEightChar || wuxingFromNaYin || '—'
  const chong = `冲${lunar.getDayChongDesc()}`
  const sha = `煞${lunar.getDaySha()}`
  const zheng = `正${lunar.getZheng()}`
  const fu = `副${lunar.getFu()}`
  const yi = lunar.getDayYi().join('、')
  const ji = lunar.getDayJi().join('、')

  return {
    solarDate: selectedDate.value.format('YYYY-MM-DD'),
    lunarDate: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    weekDay: locale.value === 'zh' ? `星期${lunar.getWeekInChinese()}` : selectedDate.value.format('dddd'),
    term: lunar.getJieQi(),
    holiday: holiday?.name || null,
    desc: holiday ? (holiday.isWorkday ? (locale.value === 'zh' ? '调休上班' : 'Make-up Workday') : (locale.value === 'zh' ? '假期' : 'Holiday')) : '',
    ganzhi,
    wuxing,
    chong,
    sha,
    zheng,
    fu,
    yi,
    ji,
    shenghua: lunar.getYearShengXiao()
  }
})

const zodiacMetaMap: Record<string, { icon: string }> = {
  鼠: { icon: 'mdi:mouse' },
  牛: { icon: 'mdi:cow' },
  虎: { icon: 'mdi:paw' },
  兔: { icon: 'mdi:rabbit' },
  龙: { icon: 'mdi:dragon' },
  蛇: { icon: 'mdi:snake' },
  马: { icon: 'mdi:horse' },
  羊: { icon: 'mdi:sheep' },
  猴: { icon: 'mdi:monkey' },
  鸡: { icon: 'mdi:bird' },
  狗: { icon: 'mdi:dog' },
  猪: { icon: 'mdi:pig' }
}

const zodiacMeta = computed(() => {
  const meta = zodiacMetaMap[selectedDateDetail.value.shenghua]
  return {
    icon: meta ? meta.icon : 'mdi:help-circle-outline'
  }
})
</script>

<template>
  <div class="calendar-tool">
    <div class="main-layout">
      <!-- Left: Calendar -->
      <div class="calendar-card">
        <header>
          <div class="header-left">
            <button class="today-btn" @click="handleToday">{{ t('tools.calendar.today') }}</button>
          </div>
          <div class="calendar-nav">
            <button @click="handlePrevMonth"><Icon icon="mdi:chevron-left" width="24" /></button>
            <span class="current-month">{{ currentMonthYear }}</span>
            <button @click="handleNextMonth"><Icon icon="mdi:chevron-right" width="24" /></button>
          </div>
          <div class="header-right">
            <div class="region-selector" @click.stop>
              <button class="current-region" type="button" @click="toggleRegionMenu">
                <Icon :icon="currentRegionInfo?.icon || 'mdi:earth'" width="18" />
                <span class="region-name">{{ currentRegionInfo?.name }}</span>
                <Icon icon="mdi:chevron-down" width="16" :class="{ open: isRegionMenuOpen }" />
              </button>
              <div v-if="isRegionMenuOpen" class="region-dropdown">
                <div 
                  v-for="r in regions" 
                  :key="r.id" 
                  class="region-item"
                  :class="{ active: currentRegion === r.id }"
                  @click="selectRegion(r.id)"
                >
                  <Icon :icon="r.icon" width="18" />
                  <span>{{ r.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div class="calendar-container">
          <!-- Week Days -->
          <div class="week-row">
            <span v-for="day in weekDays" :key="day" class="week-day">{{ day }}</span>
          </div>

          <!-- Days Grid -->
          <div class="days-grid">
            <div 
              v-for="day in calendarDays" 
              :key="day.date.toString()"
              class="day-cell"
              :class="{
                'other-month': !day.isCurrentMonth,
                'is-today': day.isToday,
                'is-selected': day.isSelected,
                'is-holiday': !!day.holiday && !day.isWork,
                'is-work': day.isWork
              }"
              @click="selectDate(day)"
            >
              <span class="solar-day">{{ day.date.date() }}</span>
              <span class="lunar-day">
                {{ day.holiday || day.term || day.lunarDay }}
              </span>
              <span v-if="day.holiday" class="holiday-badge" :class="{ work: day.isWork }">
                {{ day.isWork ? '班' : '休' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Almanac & Divination -->
      <div class="side-panel">
        <!-- Selected Day Detail (Almanac) -->
        <div class="almanac-card">
          <div class="almanac-header">
            <div class="solar-section">
              <div class="year-month">{{ currentMonthYear }}</div>
              <div class="day-wrapper">
                <span class="day-number">{{ selectedDate.date() }}</span>
              </div>
              <div class="week-day">{{ selectedDateDetail.weekDay }}</div>
            </div>
            
            <div class="lunar-section">
              <div class="lunar-date">{{ selectedDateDetail.lunarDate }}</div>
              
              <div class="badge-row">
                <div class="zodiac-badge">
                  <div class="zodiac-icon-box">
                    <Icon :icon="zodiacMeta.icon" width="24" />
                  </div>
                  <div class="zodiac-info">
                    <span class="zodiac-name">{{ selectedDateDetail.shenghua }}{{ locale === 'zh' ? '年' : '' }}</span>
                  </div>
                </div>

                <div class="countdown-badge" :class="{ 'is-today': dateExtraInfo.countdownText === '今天' || dateExtraInfo.countdownText === 'Today' }">
                  <div class="countdown-icon-box">
                    <Icon :icon="dateExtraInfo.countdownIcon" width="24" />
                  </div>
                  <div class="countdown-info">
                    <span class="countdown-text">{{ dateExtraInfo.countdownText }}</span>
                  </div>
                </div>
              </div>

              <div class="meta-info">
                <span class="day-counter">{{ dateExtraInfo.dayInfoText }}</span>
              </div>
            </div>
          </div>

          <div class="almanac-body">
            <div class="ganzhi-row">
              <span class="label">{{ t('almanac.ganzhi') }}</span>
              <span class="value">{{ selectedDateDetail.ganzhi }}</span>
            </div>
            <div class="wuxing-row">
              <span class="label">{{ t('almanac.wuxing') }}</span>
              <span class="value">{{ selectedDateDetail.wuxing }}</span>
            </div>
            <div class="chong-sha-row">
              <div class="item">
                <span class="label">{{ t('almanac.chong') }}</span>
                <span class="value chong">{{ selectedDateDetail.chong.replace('冲', '') }}</span>
              </div>
              <div class="item">
                <span class="label">{{ t('almanac.sha') }}</span>
                <span class="value sha">{{ selectedDateDetail.sha.replace('煞', '') }}</span>
              </div>
            </div>
            
            <div class="yi-ji-container">
              <div class="yi-ji-item yi">
                <div class="label">{{ t('almanac.yi') }}</div>
                <div class="content">{{ selectedDateDetail.yi }}</div>
              </div>
              <div class="yi-ji-item ji">
                <div class="label">{{ t('almanac.ji') }}</div>
                <div class="content">{{ selectedDateDetail.ji }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Daily Divination Widget -->
        <SharedDivinationCard class="divination-card" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.calendar-tool {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.main-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 24px;
}

.calendar-card {
  background: var(--color-surface);
  border-radius: 24px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
  overflow: hidden;
  height: fit-content;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border);

  .today-btn {
    font-size: 13px;
    padding: 6px 16px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--color-primary) 10%, transparent);
    color: var(--color-primary);
    border: none;
    cursor: pointer;
    font-weight: 500;
  }
}

.region-selector {
  position: relative;
  
  .current-region {
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-radius: 999px;
    border: 1px solid var(--color-border);
    background: var(--color-background);
    transition: all 0.2s;
    padding: 0 10px;
    cursor: pointer;
    
    &:hover {
      background: var(--color-border);
    }

    .region-name {
      font-size: 12px;
      color: var(--color-text);
    }

    .open {
      transform: rotate(180deg);
    }
  }

  .region-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    box-shadow: var(--shadow-lg);
    z-index: 100;
    width: 160px;
    padding: 6px;
    display: block;
    
    .region-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 14px;
      transition: all 0.2s;
      
      &:hover {
        background: var(--color-background);
      }
      
      &.active {
        background: color-mix(in srgb, var(--color-primary) 10%, transparent);
        color: var(--color-primary);
      }
    }
  }
  
}

.calendar-nav {
  display: flex;
  align-items: center;
  gap: 16px;
  
  .current-month {
    font-size: 18px;
    font-weight: 600;
    min-width: 140px;
    text-align: center;
  }
  
  button {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-text-secondary);
    padding: 4px;
    border-radius: 50%;
    &:hover { background: var(--color-background); }
  }
}

.calendar-container {
  padding: 24px;
}

.week-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 12px;
  .week-day {
    text-align: center;
    font-size: 14px;
    color: var(--color-text-secondary);
  }
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
}

.day-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  border: 2px solid transparent;

  &:hover { background: var(--color-background); }
  &.other-month { opacity: 0.3; }
  &.is-today {
    background: color-mix(in srgb, var(--color-primary) 10%, transparent);
    color: var(--color-primary);
    font-weight: 600;
  }
  &.is-selected {
    border-color: var(--color-primary);
  }
  &.is-holiday .lunar-day { color: var(--color-error); }
  
  .solar-day { font-size: 20px; font-weight: 500; }
  .lunar-day { font-size: 11px; color: var(--color-text-secondary); margin-top: 2px; }
  
  .holiday-badge {
    position: absolute;
    top: 6px;
    right: 6px;
    font-size: 10px;
    padding: 2px 4px;
    border-radius: 4px;
    color: white;
    background: var(--color-error);
    &.work { background: var(--color-text-secondary); opacity: 0.8; }
  }
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.almanac-card {
  background: var(--color-surface);
  border-radius: 24px;
  border: 1px solid var(--color-border);
  padding: 24px;
  
      .almanac-header {
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding-bottom: 24px;
        border-bottom: 1px dashed var(--color-border);
        margin-bottom: 24px;
        
        .solar-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          
          .year-month {
            font-size: 14px;
            color: #164E63;
            font-weight: 600;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
            font-family: 'Fira Code', monospace;
          }
          
          .day-wrapper {
            position: relative;
            display: flex;
            justify-content: center;
            
            .day-number {
              font-size: 80px;
              line-height: 1;
              font-weight: 800;
              color: #0891B2;
              background: none;
              -webkit-background-clip: unset;
              -webkit-text-fill-color: unset;
              letter-spacing: -2px;
              font-family: 'Fira Sans', sans-serif;
            }
          }
          
          .week-day {
            font-size: 16px;
            font-weight: 600;
            color: #164E63;
            margin-top: 4px;
            background: #ECFEFF;
            padding: 4px 12px;
            border-radius: 99px;
            font-family: 'Fira Sans', sans-serif;
          }
        }
        
        .lunar-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
          
          .lunar-date {
            font-size: 18px;
            font-weight: 700;
            text-align: center;
            color: #164E63;
            font-family: 'Fira Sans', sans-serif;
          }
          
          .badge-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .zodiac-badge, .countdown-badge {
            display: flex;
            align-items: center;
            background: #ECFEFF;
            border: 1px solid #22D3EE;
            border-radius: 16px;
            padding: 8px 12px;
            gap: 12px;
            
            .zodiac-icon-box, .countdown-icon-box {
              background: white;
              width: 36px;
              height: 36px;
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #0891B2;
              box-shadow: var(--shadow-sm);
              flex-shrink: 0;
            }
            
            .zodiac-info, .countdown-info {
              display: flex;
              flex-direction: column;
              justify-content: center;
              
              .zodiac-name, .countdown-text {
                font-size: 15px;
                font-weight: 700;
                color: #164E63;
              }
            }
          }
          
          .countdown-badge {
            border-color: #22C55E;
            background: #F0FDF4;
            
            .countdown-icon-box {
              color: #16A34A;
            }
            
            .countdown-text {
              color: #14532D;
            }
            
            &.is-today {
              border-color: #F59E0B;
              background: #FFFBEB;
              .countdown-icon-box { color: #D97706; }
              .countdown-text { color: #92400E; }
            }
          }
          
          .meta-info {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-top: 4px;
            
            .day-counter {
              font-size: 12px;
              color: #164E63;
              opacity: 0.8;
              font-family: 'Fira Code', monospace;
            }
          }
        }
      }
}

.almanac-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  .ganzhi-row, .wuxing-row {
    display: flex;
    gap: 12px;
    font-size: 14px;
    .label { color: var(--color-text-secondary); min-width: 40px; }
    .value { font-weight: 500; }
  }
  
  .chong-sha-row {
    display: flex;
    gap: 24px;
    .item {
      display: flex;
      gap: 12px;
      font-size: 14px;
      .label { color: var(--color-text-secondary); }
      .value { font-weight: 600; }
      .chong { color: var(--color-error); }
      .sha { color: var(--color-warning); }
    }
  }
}

.yi-ji-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 8px;
  
  .yi-ji-item {
    padding: 12px;
    border-radius: 12px;
    .label {
      font-size: 20px;
      font-weight: 800;
      margin-bottom: 8px;
    }
    .content {
      font-size: 13px;
      line-height: 1.6;
    }
    
    &.yi {
      background: color-mix(in srgb, var(--color-success) 8%, transparent);
      .label { color: var(--color-success); }
    }
    &.ji {
      background: color-mix(in srgb, var(--color-error) 8%, transparent);
      .label { color: var(--color-error); }
    }
  }
}

.divination-card {
  background: var(--color-surface);
  border-radius: 24px;
  border: 1px solid var(--color-border);
  padding: 24px;
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

@media (max-width: 1000px) {
  .main-layout { grid-template-columns: 1fr; }
  .side-panel { order: 2; }
  .almanac-card .almanac-header .solar-section .day-wrapper .day-number {
    font-size: 60px;
  }
}
</style>
