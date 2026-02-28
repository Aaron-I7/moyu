<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import moduleRegistry from '@/core/module/registry'
import ModuleIcon from '@/components/common/ModuleIcon.vue'
import type { ModuleConfig } from '@/core/module/types'

const router = useRouter()

const games = computed(() => moduleRegistry.getByCategory('games'))

const handleModuleClick = (module: ModuleConfig) => {
  router.push(module.route)
}
</script>

<template>
  <div class="page">
    <div class="page-inner">
      <div class="page-header">
        <h1>游戏</h1>
        <p>放松心情，享受碎片时光</p>
      </div>
      
      <div v-if="games.length > 0" class="module-list">
        <div 
          v-for="game in games" 
          :key="game.id"
          class="module-card"
          @click="handleModuleClick(game)"
        >
          <div class="card-icon">
            <ModuleIcon :config="game" :size="40" />
          </div>
          <div class="card-content">
            <h3>{{ game.name }}</h3>
            <p>{{ game.description }}</p>
          </div>
          <div v-if="game.tags && game.tags.length > 0" class="card-tags">
            <span v-for="tag in game.tags.slice(0, 3)" :key="tag" class="tag">
              {{ tag }}
            </span>
          </div>
        </div>
      </div>
      
      <div v-else class="empty">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M16 16s-1.5-2-4-2-4 2-4 2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
        </div>
        <h3>暂无游戏</h3>
        <p>游戏正在开发中，敬请期待</p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding-top: 56px;
}

.page-inner {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px;
}

.page-header {
  margin-bottom: 32px;
  
  h1 {
    font-size: 28px;
    font-weight: 700;
    color: var(--color-text);
    margin-bottom: 4px;
  }
  
  p {
    font-size: 15px;
    color: var(--color-text-secondary);
  }
}

.module-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.module-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: var(--transition);
  
  &:hover {
    border-color: var(--color-primary);
    
    .card-icon {
      transform: scale(1.05);
    }
  }
  
  .card-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-primary);
    flex-shrink: 0;
    transition: var(--transition);
  }
  
  .card-content {
    flex: 1;
    min-width: 0;
    
    h3 {
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: 2px;
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
    
    .tag {
      padding: 4px 10px;
      border-radius: 12px;
      background: var(--color-background);
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

[data-theme="retro"] {
  .module-card {
    &:hover {
      border-color: var(--color-primary);
      box-shadow: 0 0 15px rgba(139, 92, 246, 0.2);
    }
  }
}

@media (max-width: 480px) {
  .module-card {
    flex-wrap: wrap;
    
    .card-tags {
      width: 100%;
      margin-top: 8px;
      padding-left: 64px;
    }
  }
}
</style>
