<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { Solar, HolidayUtil } from 'lunar-javascript'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'

import { useRouter } from 'vue-router'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const router = useRouter()
const { t, locale } = useI18n()
const currentDate = ref(dayjs())
const selectedDate = ref(dayjs())

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
    const holiday = HolidayUtil.getHoliday(day.year(), day.month() + 1, day.date())

    days.push({
      date: day,
      isCurrentMonth: day.month() === currentDate.value.month(),
      isToday: day.isSame(dayjs(), 'day'),
      isSelected: day.isSame(selectedDate.value, 'day'),
      lunarDay: lunar.getDayInChinese(),
      lunarMonth: lunar.getMonthInChinese(),
      term: lunar.getJieQi(),
      holiday: holiday ? (locale.value === 'zh' ? holiday.getName() : holiday.getName()) : null, // Simplified for now
      isWork: holiday ? holiday.isWork() : false
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

const handleMore = () => {
  emit('close')
  router.push(locale.value === 'zh' ? '/zh/tools/calendar' : '/en/tools/calendar')
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

const selectedDateDetail = computed(() => {
  const solar = Solar.fromYmd(selectedDate.value.year(), selectedDate.value.month() + 1, selectedDate.value.date())
  const lunar = solar.getLunar()
  const holiday = HolidayUtil.getHoliday(selectedDate.value.year(), selectedDate.value.month() + 1, selectedDate.value.date())
  
  return {
    solarDate: selectedDate.value.format('YYYY-MM-DD'),
    lunarDate: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    weekDay: locale.value === 'zh' ? `星期${lunar.getWeekInChinese()}` : selectedDate.value.format('dddd'),
    term: lunar.getJieQi(),
    holiday: holiday ? holiday.getName() : null,
    desc: holiday ? (holiday.isWork() ? '调休上班' : '假期') : ''
  }
})
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="modal-overlay" @click.self="emit('close')">
      <div class="modal-content">
        <header>
          <div class="header-left">
            <h3>{{ t('tools.calendar.title') }}</h3>
            <button class="today-btn" @click="handleToday">{{ t('tools.calendar.today') }}</button>
          </div>
          <div class="header-actions">
            <button class="more-btn" @click="handleMore">
              {{ t('common.more') }} <Icon icon="mdi:open-in-new" width="16" />
            </button>
            <button class="close-btn" @click="emit('close')">
              <Icon icon="mdi:close" width="24" />
            </button>
          </div>
        </header>

        <div class="calendar-container">
          <!-- Calendar Header -->
          <div class="calendar-nav">
            <button @click="handlePrevMonth"><Icon icon="mdi:chevron-left" width="24" /></button>
            <span class="current-month">{{ currentMonthYear }}</span>
            <button @click="handleNextMonth"><Icon icon="mdi:chevron-right" width="24" /></button>
          </div>

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
          
          <!-- Selected Day Detail -->
          <div class="date-detail-panel">
            <div class="detail-main">
              <span class="detail-solar">{{ selectedDateDetail.solarDate }}</span>
              <span class="detail-week">{{ selectedDateDetail.weekDay }}</span>
            </div>
            <div class="detail-sub">
              <span class="detail-lunar">{{ selectedDateDetail.lunarDate }}</span>
              <span v-if="selectedDateDetail.term" class="detail-term">{{ selectedDateDetail.term }}</span>
            </div>
            <div v-if="selectedDateDetail.holiday" class="detail-holiday">
              <span class="holiday-name">{{ selectedDateDetail.holiday }}</span>
              <span class="holiday-desc">{{ selectedDateDetail.desc }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(4px);
  padding: 20px;
}

.modal-content {
  background: var(--color-surface);
  width: 100%;
  max-width: 480px; /* Calendar size */
  border-radius: 24px;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border);

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    
    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
  }

  .today-btn {
    font-size: 12px;
    padding: 4px 12px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--color-primary) 10%, transparent);
    color: var(--color-primary);
    border: none;
    cursor: pointer;
    font-weight: 500;
    
    &:hover {
      background: var(--color-primary);
      color: white;
    }
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.more-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  
  &:hover {
    background: var(--color-background);
    color: var(--color-primary);
  }
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 4px;
  border-radius: 50%;
  
  &:hover {
    background: var(--color-background);
  }
}

.calendar-container {
  padding: 20px;
}

.calendar-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  
  .current-month {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text);
  }
  
  button {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-text-secondary);
    padding: 4px;
    border-radius: 50%;
    
    &:hover {
      background: var(--color-background);
      color: var(--color-text);
    }
  }
}

.week-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 8px;
  
  .week-day {
    text-align: center;
    font-size: 13px;
    color: var(--color-text-secondary);
    font-weight: 500;
  }
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 20px;
}

.day-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  border: 1px solid transparent;

  &:hover {
    background: var(--color-background);
  }
  
  &.other-month {
    opacity: 0.3;
  }
  
  &.is-today {
    background: color-mix(in srgb, var(--color-primary) 10%, transparent);
    color: var(--color-primary);
    font-weight: 600;
  }
  
  &.is-selected {
    border-color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 5%, transparent);
  }
  
  &.is-holiday {
    .lunar-day {
      color: var(--color-error); /* Holiday text red */
    }
  }
  
  .solar-day {
    font-size: 16px;
    line-height: 1.2;
  }
  
  .lunar-day {
    font-size: 10px;
    color: var(--color-text-secondary);
    transform: scale(0.9);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .holiday-badge {
    position: absolute;
    top: 2px;
    right: 2px;
    font-size: 8px;
    line-height: 1;
    padding: 1px 2px;
    border-radius: 2px;
    color: white;
    background: var(--color-error); /* 休 */
    
    &.work {
      background: var(--color-text-secondary); /* 班 */
      opacity: 0.7;
    }
  }
}

.date-detail-panel {
  background: var(--color-background);
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  
  .detail-main {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 4px;
    
    .detail-solar {
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text);
    }
    
    .detail-week {
      font-size: 14px;
      color: var(--color-text-secondary);
    }
  }
  
  .detail-sub {
    display: flex;
    gap: 12px;
    font-size: 14px;
    color: var(--color-text-secondary);
  }
  
  .detail-holiday {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed var(--color-border);
    display: flex;
    gap: 8px;
    align-items: center;
    
    .holiday-name {
      color: var(--color-error);
      font-weight: 600;
    }
    
    .holiday-desc {
      font-size: 12px;
      color: var(--color-text-secondary);
      background: var(--color-surface);
      padding: 2px 6px;
      border-radius: 4px;
    }
  }
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
  
  .modal-content {
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  
  .modal-content {
    transform: scale(0.95) translateY(10px);
  }
}
</style>