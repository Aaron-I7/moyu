<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import { useSoundEngine } from '@/modules/tools/pomodoro/composables/useSoundEngine'
import CalendarModal from './CalendarModal.vue'

const router = useRouter()
const route = useRoute()
const { t } = useI18n({ useScope: 'global' })
const { isGlobalMixerOpen } = useSoundEngine()
const currentLocale = computed(() => (route.params.locale === 'zh' ? 'zh' : 'en'))
const showCalendar = ref(false)

// Mock data for popular tools - in a real app this could come from usage stats
const tools = computed(() => [
  {
    id: 'pomodoro',
    name: t('tools.pomodoro.title'),
    desc: t('tools.pomodoro.desc'),
    icon: 'mdi:timer-outline',
    color: '#FF6B6B',
    path: '/tools/pomodoro'
  },
  {
    id: 'text-workbench',
    name: t('tools.textWorkbench.title'),
    desc: t('tools.textWorkbench.desc'),
    icon: 'mdi:text-box-multiple-outline',
    color: '#4ECDC4',
    path: '/tools/text-workbench'
  },
  {
    id: 'noise',
    name: t('tools.noise.title'),
    desc: t('tools.noise.desc'),
    icon: 'mdi:headphones',
    color: '#A8D0E6',
    action: () => { isGlobalMixerOpen.value = true }
  },
  {
    id: 'calendar',
    name: t('tools.calendar.title'),
    desc: t('tools.calendar.desc'),
    icon: 'mdi:calendar-month',
    color: '#FFD93D',
    action: () => { showCalendar.value = true }
  }
])

const handleNavigate = (tool: any) => {
  if (tool.action) {
    tool.action()
    return
  }
  if (tool.path && tool.path.startsWith('/')) {
    router.push(`/${currentLocale.value}${tool.path}`)
  }
}
</script>

<template>
  <div class="popular-tools">
    <div class="section-header">
      <h2 class="section-title">
        <Icon icon="mdi:fire" class="title-icon" />
        {{ t('home.popularTools') }}
      </h2>
      <button class="more-btn" @click="handleNavigate({ path: '/tools' })">
        {{ t('common.more') }} <Icon icon="mdi:chevron-right" />
      </button>
    </div>
    
    <div class="tools-grid">
      <div 
        v-for="tool in tools" 
        :key="tool.id" 
        class="tool-card glass-panel hover-lift"
        @click="handleNavigate(tool)"
        :style="{ '--tool-color': tool.color }"
      >
        <div class="tool-icon">
          <Icon :icon="tool.icon" width="24" />
        </div>
        <div class="tool-info">
          <h3 class="tool-name">{{ tool.name }}</h3>
          <p class="tool-desc">{{ tool.desc }}</p>
        </div>
      </div>
    </div>

    <CalendarModal :show="showCalendar" @close="showCalendar = false" />
  </div>
</template>

<style scoped lang="scss">
.popular-tools {
  margin-top: 24px;
  padding: 0 18px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  
  .section-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text);
    display: flex;
    align-items: center;
    gap: 8px;
    
    .title-icon {
      color: #FF6B6B;
    }
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
    transition: all 0.2s;
    
    &:hover {
      background: color-mix(in srgb, var(--color-text-secondary) 10%, transparent);
      color: var(--color-primary);
    }
  }
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.tool-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  cursor: pointer;
  
  &:hover {
    .tool-icon {
      background: var(--tool-color);
      color: white;
    }
    
    .tool-name {
      color: var(--tool-color);
    }
  }
  
  .tool-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--tool-color) 15%, transparent);
    color: var(--tool-color);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  
  .tool-info {
    flex: 1;
    min-width: 0;
    
    .tool-name {
      font-size: 15px;
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: 2px;
      transition: color 0.2s;
    }
    
    .tool-desc {
      font-size: 12px;
      color: var(--color-text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

@media (max-width: 600px) {
  .tools-grid {
    grid-template-columns: 1fr;
  }
}
</style>