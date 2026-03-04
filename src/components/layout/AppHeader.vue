<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import BossKeySettings from '@/components/common/BossKeySettings.vue'
import SharePanel from '@/components/common/SharePanel.vue'
import { useThemeStore, themeList, type ThemeId } from '@/core/theme'
import { useBossKeyStore } from '@/stores/bossKey'
import { availableLocales, localeMetaMap, setLocale, type AppLocale } from '@/core/i18n'

const router = useRouter()
const route = useRoute()
const { t, locale } = useI18n()
const themeStore = useThemeStore()
const bossKeyStore = useBossKeyStore()

const showThemeMenu = ref(false)
const showLocaleMenu = ref(false)
const showShareMenu = ref(false)
const showBossKeySettings = ref(false)
const isMobileMenuOpen = ref(false)

const navItems = computed(() => [
  { path: '/', label: t('nav.home'), icon: 'mdi:home' },
  { path: '/relax', label: t('nav.relax'), icon: 'mdi:spa' },
  { path: '/games', label: t('nav.games'), icon: 'mdi:gamepad-variant' },
  { path: '/tools', label: t('nav.tools'), icon: 'mdi:tools' },
  { path: '/reading', label: t('nav.reading'), icon: 'mdi:book-open-page-variant' }
])

const localeOptions = computed(() =>
  availableLocales.map(code => ({
    code,
    label: t(`locale.${code}`),
    rtl: localeMetaMap[code].rtl
  }))
)

const bossKeyModeLabels: Record<string, string> = {
  code: 'bossKey.modes.code',
  excel: 'bossKey.modes.excel',
  forum: 'bossKey.modes.forum',
  terminal: 'bossKey.modes.terminal'
}

const currentBossKeyLabel = computed(() => t(bossKeyModeLabels[bossKeyStore.mode] || 'bossKey.modes.code'))

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const handleNavigate = (path: string) => {
  router.push(path)
  isMobileMenuOpen.value = false
}

const selectTheme = (themeId: ThemeId) => {
  themeStore.setTheme(themeId)
  showThemeMenu.value = false
}

const selectLocale = async (nextLocale: AppLocale) => {
  await setLocale(nextLocale)
  locale.value = nextLocale
  showLocaleMenu.value = false
}
</script>

<template>
  <header class="app-header">
    <div class="header-inner">
      <div class="header-left">
        <h1 class="logo" @click="handleNavigate('/')">
          <Icon icon="mdi:fish" :width="24" />
          <span>{{ t('app.name') }}</span>
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
        <button class="boss-key-btn" @click="showBossKeySettings = true" :title="t('header.bossMode')">
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
                <span>{{ t(theme.i18nKey, theme.name) }}</span>
              </div>
            </div>
          </Transition>
        </div>

        <div class="locale-selector">
          <button class="theme-btn" @click="showLocaleMenu = !showLocaleMenu">
            <Icon icon="mdi:translate" :width="18" />
          </button>
          <Transition name="fade">
            <div v-if="showLocaleMenu" class="theme-menu">
              <div
                v-for="option in localeOptions"
                :key="option.code"
                class="theme-option"
                :class="{ active: option.code === locale }"
                @click="selectLocale(option.code)"
              >
                <span>{{ option.label }}</span>
                <Icon v-if="option.rtl" icon="mdi:format-textdirection-r-to-l" :width="14" />
              </div>
            </div>
          </Transition>
        </div>

        <div class="share-selector">
          <button class="theme-btn" :title="t('header.share')" @click="showShareMenu = !showShareMenu">
            <Icon icon="mdi:share-variant-outline" :width="18" />
          </button>
          <Transition name="fade">
            <div v-if="showShareMenu" class="share-menu">
              <SharePanel />
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
          <span>{{ t('header.bossMode') }}</span>
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
  top: 14px;
  left: 0;
  right: 0;
  z-index: 100;
  padding-inline: clamp(12px, 3vw, 32px);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 66px;
  padding: 0 18px;
  max-width: 1240px;
  margin: 0 auto;
  background: color-mix(in srgb, var(--color-surface) 88%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-border) 82%, white);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-soft, var(--shadow));
  backdrop-filter: blur(14px);
}

.header-left {
  .logo {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: var(--color-primary);
    
    &:hover {
      opacity: 0.8;
    }
  }
}

.header-nav {
  display: flex;
  gap: 6px;
  
  @media (max-width: 768px) {
    display: none;
  }
  
  .nav-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 14px;
    border-radius: 12px;
    cursor: pointer;
    color: var(--color-text-secondary);
    font-size: 13px;
    font-weight: 600;
    transition: var(--transition);
    
    &:hover {
      color: var(--color-text);
      background: color-mix(in srgb, var(--color-primary) 8%, transparent);
    }
    
    &.active {
      color: var(--color-primary);
      background: color-mix(in srgb, var(--color-primary) 14%, transparent);
    }
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 6px;
  
  .boss-key-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--color-primary) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
    color: var(--color-primary);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: color-mix(in srgb, var(--color-primary) 18%, transparent);
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
  
  .theme-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--color-surface-muted, var(--color-background)) 80%, white);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: var(--transition);
    
    &:hover {
      color: var(--color-text);
      background: color-mix(in srgb, var(--color-primary) 12%, transparent);
    }
  }

  .theme-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 10px;
    padding: 6px;
    background: color-mix(in srgb, var(--color-surface) 95%, transparent);
    border: 1px solid var(--color-border);
    border-radius: 14px;
    box-shadow: var(--shadow);
    min-width: 140px;
  }

  .theme-option {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 10px;
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
  
  .share-selector,
  .locale-selector,
  .theme-selector {
    position: relative;
  }

  .share-menu {
    position: absolute;
    top: 100%;
    inset-inline-end: 0;
    margin-top: 10px;
  }

  .mobile-menu-btn {
    display: none;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--color-surface-muted, var(--color-background)) 80%, white);
    color: var(--color-text-secondary);
    cursor: pointer;
    
    @media (max-width: 768px) {
      display: flex;
    }
  }
}

[data-theme="night"] {
  .header-inner {
    background: color-mix(in srgb, var(--color-surface) 82%, transparent);
    border-color: color-mix(in srgb, var(--color-border) 90%, #0b1220);
  }

  .header-right .theme-btn,
  .header-right .mobile-menu-btn {
    background: color-mix(in srgb, var(--color-surface) 70%, #0a1020);
  }
}

[data-theme="pixel"] {
  .header-inner {
    border-radius: 0;
    border-width: 2px;
    box-shadow: none;
    backdrop-filter: none;
  }

  .header-nav .nav-item,
  .header-right .theme-btn,
  .header-right .boss-key-btn,
  .header-right .mobile-menu-btn {
    border-radius: 0;
    border: 2px solid var(--color-border);
  }

  .header-nav .nav-item.active {
    color: #111;
    background: var(--color-primary);
    border-color: var(--color-primary);
  }
}

.mobile-nav {
  display: none;
  flex-direction: column;
  padding: 10px 14px 14px;
  margin: 10px auto 0;
  max-width: 1240px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: color-mix(in srgb, var(--color-surface) 90%, transparent);
  box-shadow: var(--shadow-soft, var(--shadow));
  
  @media (max-width: 768px) {
    display: flex;
  }
  
  .mobile-nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 12px;
    cursor: pointer;
    color: var(--color-text-secondary);
    font-size: 15px;
    font-weight: 500;
    
    &:hover, &.active {
      color: var(--color-primary);
      background: color-mix(in srgb, var(--color-primary) 12%, transparent);
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

[dir="rtl"] .header-nav {
  flex-direction: row-reverse;
}
</style>
