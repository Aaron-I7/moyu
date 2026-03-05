<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { getDailyHoroscope, type HoroscopeData } from '@/data/horoscopeData'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const data = ref<HoroscopeData | null>(null)
const loading = ref(true)

const refresh = async (forceQuoteOnly = false) => {
  loading.value = true
  try {
    const today = dayjs().format('YYYY-MM-DD')
    const cacheKey = `moyu_fortune_${today}`
    const cached = localStorage.getItem(cacheKey)
    
    // Always fetch new data to get a fresh quote
    const newData = await getDailyHoroscope()
    
    if (forceQuoteOnly && cached) {
      // Refresh click: update quote only, keep fortune
      const parsedCache = JSON.parse(cached)
      const updatedData = {
        ...parsedCache,
        quote: newData.quote
      }
      data.value = updatedData
      localStorage.setItem(cacheKey, JSON.stringify(updatedData))
    } else if (cached) {
      // Initial load with cache: use cached data
      data.value = JSON.parse(cached)
    } else {
      // Initial load without cache: use new data
      data.value = newData
      localStorage.setItem(cacheKey, JSON.stringify(newData))
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  refresh(false)
})
</script>

<template>
  <div class="horoscope-widget" :class="{ 'is-loading': loading }">
    <div v-if="loading && !data" class="loading-state">
      <Icon icon="mdi:loading" class="spin" width="24" />
    </div>
    
    <template v-else-if="data">
      <div class="widget-header">
        <div class="date-info">
          <Icon icon="mdi:calendar-check" width="18" />
          <span>{{ data.date }}</span>
        </div>
        <button class="refresh-btn" @click="refresh(true)" :title="t('divination.refresh')" :disabled="loading">
          <Icon icon="mdi:refresh" width="16" :class="{ spin: loading }" />
        </button>
      </div>
      
      <div class="fortune-content">
        <div class="fortune-item good">
          <span class="label">{{ t('divination.good') }}</span>
          <span class="text">{{ data.good }}</span>
        </div>
        <div class="fortune-item bad">
          <span class="label">{{ t('divination.bad') }}</span>
          <span class="text">{{ data.bad }}</span>
        </div>
      </div>
      
      <div class="quote-section" v-if="data.quote">
        <p class="quote-text">"{{ data.quote.text }}"</p>
        <p class="quote-author" v-if="data.quote.author">— {{ data.quote.author }}</p>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.horoscope-widget {
  background: color-mix(in srgb, var(--color-surface) 94%, transparent);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
  min-height: 180px;
  position: relative;
  
  &:hover {
    border-color: var(--color-primary);
    transform: translateY(-1px);
    box-shadow: var(--shadow);
  }
}

.loading-state {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  background: color-mix(in srgb, var(--color-surface) 90%, transparent);
  border-radius: var(--border-radius);
  z-index: 10;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  
  .date-info {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-secondary);
  }
  
  .refresh-btn {
    color: var(--color-text-secondary);
    opacity: 0.6;
    cursor: pointer;
    transition: all 0.2s;
    background: transparent;
    border: none;
    padding: 4px;
    border-radius: 4px;
    
    &:hover:not(:disabled) {
      opacity: 1;
      transform: rotate(180deg);
      color: var(--color-primary);
      background: color-mix(in srgb, var(--color-surface-muted) 50%, transparent);
    }
    
    &:disabled {
      cursor: not-allowed;
      opacity: 0.4;
    }
  }
}

.fortune-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fortune-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  
  .label {
    font-size: 12px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    flex-shrink: 0;
  }
  
  &.good {
    .label {
      background: color-mix(in srgb, var(--color-success) 15%, transparent);
      color: var(--color-success);
    }
    .text {
      color: var(--color-text);
    }
  }
  
  &.bad {
    .label {
      background: color-mix(in srgb, var(--color-error) 15%, transparent);
      color: var(--color-error);
    }
    .text {
      color: var(--color-text-secondary);
      text-decoration: line-through;
      text-decoration-color: var(--color-border);
    }
  }
}

.quote-section {
  margin-top: auto; /* Push to bottom */
  padding-top: 10px;
  border-top: 1px dashed var(--color-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  
  .quote-text {
    font-size: 12px;
    line-height: 1.5;
    color: var(--color-text-secondary);
    font-style: italic;
    text-align: center;
  }
  
  .quote-author {
    font-size: 11px;
    color: var(--color-text-tertiary);
    font-weight: 500;
  }
}

[data-theme="pixel"] {
  .horoscope-widget {
    border-radius: 0;
    border-width: 2px;
    box-shadow: none;
  }
  
  .fortune-item .label {
    border-radius: 0;
  }
}
</style>