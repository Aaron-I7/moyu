<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'

const router = useRouter()

const mainEntries = [
  { 
    path: '/relax', 
    label: '休闲', 
    icon: 'mdi:spa', 
    color: '#8B5CF6',
    desc: '放松身心，享受悠闲时光'
  },
  { 
    path: '/games', 
    label: '游戏', 
    icon: 'mdi:gamepad-variant', 
    color: '#10B981',
    desc: '解压小游戏，放松一下'
  },
  { 
    path: '/tools', 
    label: '工具', 
    icon: 'mdi:tools', 
    color: '#3B82F6',
    desc: '实用小工具，提升效率'
  },
  { 
    path: '/reading', 
    label: '阅读', 
    icon: 'mdi:book-open-page-variant', 
    color: '#F59E0B',
    desc: '本地小说，随时阅读'
  }
]

const features = [
  { icon: 'mdi:lightning-bolt', text: '秒开加载' },
  { icon: 'mdi:shield-check', text: '隐私安全' },
  { icon: 'mdi:cellphone', text: '多端适配' },
  { icon: 'mdi:heart', text: '完全免费' }
]

const handleNavigate = (path: string) => {
  router.push(path)
}
</script>

<template>
  <div class="home-page">
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">摸鱼吧</h1>
        <p class="hero-subtitle">碎片时光好去处</p>
        <p class="hero-desc">无需登录，即开即用，用完即走</p>
      </div>
    </section>

    <section class="entries">
      <div class="entries-grid">
        <div 
          v-for="entry in mainEntries" 
          :key="entry.path"
          class="entry-card"
          @click="handleNavigate(entry.path)"
        >
          <div class="entry-icon" :style="{ backgroundColor: entry.color + '15', color: entry.color }">
            <Icon :icon="entry.icon" :width="32" />
          </div>
          <div class="entry-content">
            <h3>{{ entry.label }}</h3>
            <p>{{ entry.desc }}</p>
          </div>
          <div class="entry-arrow">
            <Icon icon="mdi:arrow-right" :width="20" />
          </div>
        </div>
      </div>
    </section>

    <section class="features">
      <div class="features-list">
        <div v-for="feature in features" :key="feature.text" class="feature-item">
          <Icon :icon="feature.icon" :width="18" />
          <span>{{ feature.text }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.home-page {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.hero {
  padding: 40px 24px 30px;
  text-align: center;
  flex-shrink: 0;
  
  .hero-content {
    max-width: 480px;
    margin: 0 auto;
  }
  
  .hero-title {
    font-size: 42px;
    font-weight: 700;
    color: var(--color-text);
    margin-bottom: 8px;
    
    @media (max-width: 480px) {
      font-size: 36px;
    }
  }
  
  .hero-subtitle {
    font-size: 20px;
    color: var(--color-primary);
    font-weight: 500;
    margin-bottom: 12px;
  }
  
  .hero-desc {
    font-size: 15px;
    color: var(--color-text-secondary);
  }
}

.entries {
  padding: 0 16px 20px;
  flex: 1;
  display: flex;
  align-items: center;
  overflow: hidden;
  
  @media (max-width: 480px) {
    padding: 0 12px 16px;
  }
}

.entries-grid {
  width: 60%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  
  @media (max-width: 768px) {
    width: 80%;
  }
  
  @media (max-width: 480px) {
    width: 95%;
  }
}

.entry-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: var(--transition);
  
  &:hover {
    border-color: var(--color-primary);
    
    .entry-arrow {
      transform: translateX(4px);
      color: var(--color-primary);
    }
  }
  
  .entry-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .entry-content {
    flex: 1;
    
    h3 {
      font-size: 17px;
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: 2px;
    }
    
    p {
      font-size: 13px;
      color: var(--color-text-secondary);
    }
  }
  
  .entry-arrow {
    color: var(--color-text-secondary);
    transition: var(--transition);
  }
}

.features {
  padding: 0 24px 30px;
  flex-shrink: 0;
  
  .features-list {
    display: flex;
    justify-content: center;
    gap: 24px;
    flex-wrap: wrap;
  }
  
  .feature-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: var(--color-text-secondary);
    
    @media (max-width: 480px) {
      font-size: 13px;
    }
  }
}

[data-theme="pixel"] {
  .hero-title {
    font-family: 'Press Start 2P', cursive;
    font-size: 28px;
    
    @media (max-width: 480px) {
      font-size: 24px;
    }
  }
  
  .entry-card {
    border-radius: 0;
    border-width: 2px;
    
    &:hover {
      box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.3);
    }
    
    .entry-icon {
      border-radius: 0;
    }
  }
  
  .theme-btn {
    border-radius: 0;
    border-width: 2px;
    
    &.active {
      box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.3);
    }
  }
}

[data-theme="retro"] {
  .hero-title {
    text-shadow: 0 0 20px var(--color-primary);
  }
  
  .entry-card {
    &:hover {
      border-color: var(--color-primary);
      box-shadow: 0 0 20px rgba(139, 92, 246, 0.2);
    }
  }
  
  .theme-btn.active {
    box-shadow: 0 0 15px rgba(139, 92, 246, 0.4);
  }
}
</style>
