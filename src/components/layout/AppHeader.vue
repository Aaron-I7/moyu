<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useThemeStore, themeList } from '@/core/theme'
import { useBossKeyStore } from '@/stores/bossKey'
import { ref, computed } from 'vue'
import BossKeySettings from '@/components/common/BossKeySettings.vue'

const router = useRouter()
const route = useRoute()
const themeStore = useThemeStore()
const bossKeyStore = useBossKeyStore()

const showThemeMenu = ref(false)
const showBossKeySettings = ref(false)
const isMobileMenuOpen = ref(false)

const navItems = [
  { path: '/', label: '首页', icon: 'mdi:home' },
  { path: '/relax', label: '休闲', icon: 'mdi:spa' },
  { path: '/games', label: '游戏', icon: 'mdi:gamepad-variant' },
  { path: '/tools', label: '工具', icon: 'mdi:tools' },
  { path: '/reading', label: '阅读', icon: 'mdi:book-open-page-variant' }
]

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const handleNavigate = (path: string) => {
  router.push(path)
  isMobileMenuOpen.value = false
}

const selectTheme = (themeId: 'default' | 'pixel' | 'retro') => {
  themeStore.setTheme(themeId)
  showThemeMenu.value = false
}

const bossKeyModeLabels: Record<string, string> = {
  code: '代码编辑器',
  excel: 'Excel表格',
  forum: '技术论坛',
  terminal: '终端命令'
}

const currentBossKeyLabel = computed(() => bossKeyModeLabels[bossKeyStore.mode])
</script>

<template>
  <header class="app-header">
    <div class="header-inner">
      <div class="header-left">
        <h1 class="logo" @click="handleNavigate('/')">
          <Icon icon="mdi:fish" :width="24" />
          <span>摸鱼吧</span>
        </h1>
      </div>
      
      <nav class="header-nav">
        <div 
          v-for="item in navItems" 
          :key="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
          @click="handleNavigate(item.path)"
        >
          <Icon :icon="item.icon" :width="18" />
          <span>{{ item.label }}</span>
        </div>
      </nav>
      
      <div class="header-right">
        <button class="boss-key-btn" @click="showBossKeySettings = true" title="老板键设置">
          <Icon icon="mdi:shield-account" :width="18" />
          <span class="boss-key-label">{{ currentBossKeyLabel }}</span>
        </button>
        
        <div class="theme-selector">
          <button class="theme-btn" @click="showThemeMenu = !showThemeMenu">
            <Icon :icon="themeStore.currentTheme.icon" :width="18" />
          </button>
          
          <Transition name="fade">
            <div v-if="showThemeMenu" class="theme-menu">
              <div 
                v-for="theme in themeList" 
                :key="theme.id"
                class="theme-option"
                :class="{ active: theme.id === themeStore.currentThemeId }"
                @click="selectTheme(theme.id)"
              >
                <Icon :icon="theme.icon" :width="16" />
                <span>{{ theme.name }}</span>
              </div>
            </div>
          </Transition>
        </div>
        
        <button class="mobile-menu-btn" @click="isMobileMenuOpen = !isMobileMenuOpen">
          <Icon :icon="isMobileMenuOpen ? 'mdi:close' : 'mdi:menu'" :width="22" />
        </button>
      </div>
    </div>
    
    <Transition name="slide">
      <nav v-if="isMobileMenuOpen" class="mobile-nav">
        <div 
          v-for="item in navItems" 
          :key="item.path"
          class="mobile-nav-item"
          :class="{ active: isActive(item.path) }"
          @click="handleNavigate(item.path)"
        >
          <Icon :icon="item.icon" :width="20" />
          <span>{{ item.label }}</span>
        </div>
        
        <div class="mobile-nav-divider" />
        
        <div class="mobile-nav-item" @click="showBossKeySettings = true; isMobileMenuOpen = false">
          <Icon icon="mdi:shield-account" :width="20" />
          <span>老板键设置</span>
        </div>
      </nav>
    </Transition>
    
    <BossKeySettings 
      :visible="showBossKeySettings" 
      :current-mode="bossKeyStore.mode"
      @close="showBossKeySettings = false"
      @change-mode="bossKeyStore.setMode"
    />
  </header>
</template>

<style scoped lang="scss">
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.header-left {
  .logo {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 18px;
    font-weight: 600;
    color: var(--color-primary);
    
    &:hover {
      opacity: 0.8;
    }
  }
}

.header-nav {
  display: flex;
  gap: 4px;
  
  @media (max-width: 768px) {
    display: none;
  }
  
  .nav-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    color: var(--color-text-secondary);
    font-size: 14px;
    font-weight: 500;
    transition: var(--transition);
    
    &:hover {
      color: var(--color-text);
      background: var(--color-background);
    }
    
    &.active {
      color: var(--color-primary);
      background: rgba(16, 185, 129, 0.1);
    }
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .boss-key-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 8px;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: var(--color-primary);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%);
      border-color: var(--color-primary);
    }
    
    @media (max-width: 900px) {
      .boss-key-label {
        display: none;
      }
    }
    
    @media (max-width: 768px) {
      display: none;
    }
  }
  
  .theme-selector {
    position: relative;
    
    .theme-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: var(--color-background);
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: var(--transition);
      
      &:hover {
        color: var(--color-text);
      }
    }
    
    .theme-menu {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 8px;
      padding: 6px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      box-shadow: var(--shadow);
      min-width: 140px;
      
      .theme-option {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        color: var(--color-text-secondary);
        transition: var(--transition);
        
        &:hover {
          background: var(--color-background);
          color: var(--color-text);
        }
        
        &.active {
          background: var(--color-primary);
          color: white;
        }
      }
    }
  }
  
  .mobile-menu-btn {
    display: none;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: var(--color-background);
    color: var(--color-text-secondary);
    cursor: pointer;
    
    @media (max-width: 768px) {
      display: flex;
    }
  }
}

.mobile-nav {
  display: none;
  flex-direction: column;
  padding: 8px 16px 16px;
  border-top: 1px solid var(--color-border);
  
  @media (max-width: 768px) {
    display: flex;
  }
  
  .mobile-nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 8px;
    cursor: pointer;
    color: var(--color-text-secondary);
    font-size: 15px;
    font-weight: 500;
    
    &:hover, &.active {
      color: var(--color-primary);
      background: rgba(16, 185, 129, 0.1);
    }
  }
  
  .mobile-nav-divider {
    height: 1px;
    background: var(--color-border);
    margin: 8px 0;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

[data-theme="pixel"] {
  .header-nav .nav-item {
    border-radius: 0;
    
    &.active {
      background: var(--color-primary);
      color: var(--color-text);
    }
  }
  
  .theme-btn, .mobile-menu-btn, .boss-key-btn {
    border-radius: 0;
  }
  
  .theme-menu {
    border-radius: 0;
    border-width: 2px;
    
    .theme-option {
      border-radius: 0;
    }
  }
  
  .mobile-nav-item {
    border-radius: 0;
  }
}

[data-theme="retro"] {
  .app-header {
    border-bottom-color: var(--color-border);
  }
  
  .header-nav .nav-item.active {
    box-shadow: 0 0 10px rgba(139, 92, 246, 0.3);
  }
  
  .theme-menu {
    border-color: var(--color-primary);
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.2);
  }
}
</style>
