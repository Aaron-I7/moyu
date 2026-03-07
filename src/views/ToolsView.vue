<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import moduleRegistry from '@/core/module/registry'
import ModuleIcon from '@/components/common/ModuleIcon.vue'
import type { ModuleConfig } from '@/core/module/types'
import { resolveModuleDescription, resolveModuleName, resolveModuleTags } from '@/core/module/i18n'

const router = useRouter()
const route = useRoute()
const { t } = useI18n({ useScope: 'global' })
const currentLocale = computed(() => (route.params.locale === 'zh' ? 'zh' : 'en'))

const tools = computed(() => moduleRegistry.getByCategory('tools'))

const handleModuleClick = (module: ModuleConfig) => {
  router.push(`/${currentLocale.value}${module.route}`)
}
</script>

<template>
  <div class="page moyu-page">
    <div class="page-inner">
      <div class="page-header moyu-panel">
        <p>{{ t('views.toolsDesc') }}</p>
      </div>
      
      <div v-if="tools.length > 0" class="module-list">
        <div 
          v-for="tool in tools" 
          :key="tool.id"
          class="module-card moyu-panel"
          @click="handleModuleClick(tool)"
        >
          <div class="card-icon">
            <ModuleIcon :config="tool" :size="40" />
          </div>
          <div class="card-content">
            <h3>{{ resolveModuleName(t, tool) }}</h3>
            <p>{{ resolveModuleDescription(t, tool) }}</p>
          </div>
          <div v-if="resolveModuleTags(t, tool).length > 0" class="card-tags">
            <span v-for="tag in resolveModuleTags(t, tool).slice(0, 3)" :key="tag" class="tag">
              {{ tag }}
            </span>
          </div>
        </div>
      </div>
      
      <div v-else class="empty">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M16 16s-1.5-2-4-2-4 2-4 2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
        </div>
        <h3>{{ t('views.emptyTools') }}</h3>
        <p>{{ t('views.emptyToolsDesc') }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: auto;
}

.page-inner {
  flex: 1;
  max-width: 1160px;
  width: 100%;
  margin: 0 auto;
  padding: 14px 8px 26px;
  display: flex;
  flex-direction: column;
}

.page-header {
  margin-bottom: 14px;
  flex-shrink: 0;
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  background: color-mix(in srgb, var(--color-surface) 86%, transparent);
  
  p {
    font-size: 14px;
    color: var(--color-text-secondary);
    line-height: 1.55;
  }
}

.module-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  flex: 1;

  @media (max-width: 880px) {
    grid-template-columns: 1fr;
  }
}

.module-card {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: color-mix(in srgb, var(--color-surface) 94%, transparent);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: var(--transition);
  box-shadow: var(--shadow);
  
  &:hover {
    border-color: color-mix(in srgb, var(--color-secondary) 45%, var(--color-border));
    transform: translateY(-2px);
    
    .card-icon {
      transform: scale(1.05);
    }
  }
  
  .card-icon {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-secondary);
    flex-shrink: 0;
    transition: var(--transition);
    border-radius: 14px;
    background: color-mix(in srgb, var(--color-secondary) 10%, transparent);
  }
  
  .card-content {
    flex: 1;
    min-width: 0;
    
    h3 {
      font-size: 17px;
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: 4px;
    }
    
    p {
      font-size: 14px;
      color: var(--color-text-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  
  .card-tags {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
    grid-column: 1 / -1;
    padding-left: 70px;
    
    .tag {
      padding: 5px 10px;
      border-radius: 999px;
      background: var(--color-surface-muted, var(--color-background));
      font-size: 12px;
      color: var(--color-text-secondary);
    }
  }
}

.empty {
  text-align: center;
  padding: 60px 20px;
  
  .empty-icon {
    margin-bottom: 16px;
    color: var(--color-text-secondary);
    opacity: 0.5;
  }
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 4px;
  }
  
  p {
    font-size: 14px;
    color: var(--color-text-secondary);
  }
}

[data-theme="pixel"] {
  .module-card {
    border-radius: 0;
    border-width: 2px;
    
    &:hover {
      box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.3);
    }
    
    .card-tags .tag {
      border-radius: 0;
      border: 1px solid var(--color-border);
    }
  }
}

[data-theme="night"] {
  .module-card {
    &:hover {
      border-color: var(--color-secondary);
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-secondary) 45%, transparent);
    }
  }
}

[data-theme="pixel"] {
  .page-header {
    border-radius: 0;
    border-width: 2px;
  }

  .module-card {
    border-radius: 0;
    border-width: 2px;
    box-shadow: none;
  }
}

@media (max-width: 480px) {
  .module-card .card-tags {
    padding-left: 0;
  }
}
</style>
