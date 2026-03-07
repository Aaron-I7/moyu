<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const route = useRoute()
const { t } = useI18n({ useScope: 'global' })
const currentLocale = computed(() => (route.params.locale === 'zh' ? 'zh' : 'en'))

const relaxItems = computed(() => [
  {
    id: 'wooden-fish',
    name: t('modules.woodenFish.name'),
    desc: t('modules.woodenFish.description'),
    icon: 'mdi:circle-outline',
    color: '#8B5CF6',
    path: '/relax/wooden-fish'
  },
  {
    id: 'virtual-pet',
    name: t('modules.virtualPet.name'),
    desc: t('modules.virtualPet.description'),
    icon: 'mdi:cat',
    color: '#EC4899',
    path: '/relax/virtual-pet'
  }
])

const handleNavigate = (item: any) => {
  if (item.path && item.path.startsWith('/')) {
    router.push(`/${currentLocale.value}${item.path}`)
  }
}
</script>

<template>
  <div class="popular-relax">
    <div class="section-header">
      <h2 class="section-title">
        <Icon icon="mdi:spa" class="title-icon" />
        {{ t('home.popularRelax') }}
      </h2>
      <button class="more-btn" @click="handleNavigate({ path: '/relax' })">
        {{ t('common.more') }} <Icon icon="mdi:chevron-right" />
      </button>
    </div>
    
    <div class="relax-grid">
      <div 
        v-for="item in relaxItems" 
        :key="item.id" 
        class="relax-card glass-panel hover-lift"
        @click="handleNavigate(item)"
        :style="{ '--relax-color': item.color }"
      >
        <div class="relax-icon">
          <Icon :icon="item.icon" width="24" />
        </div>
        <div class="relax-info">
          <h3 class="relax-name">{{ item.name }}</h3>
          <p class="relax-desc">{{ item.desc }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.popular-relax {
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
      color: #8B5CF6;
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

.relax-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.relax-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  cursor: pointer;
  
  &:hover {
    .relax-icon {
      background: var(--relax-color);
      color: white;
    }
    
    .relax-name {
      color: var(--relax-color);
    }
  }
  
  .relax-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--relax-color) 15%, transparent);
    color: var(--relax-color);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  
  .relax-info {
    flex: 1;
    min-width: 0;
    
    .relax-name {
      font-size: 15px;
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: 2px;
      transition: color 0.2s;
    }
    
    .relax-desc {
      font-size: 12px;
      color: var(--color-text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

@media (max-width: 600px) {
  .relax-grid {
    grid-template-columns: 1fr;
  }
}
</style>