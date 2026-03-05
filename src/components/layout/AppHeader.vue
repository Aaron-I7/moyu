<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import GlobalSettingsModal from '@/components/common/GlobalSettingsModal.vue'
import SharePanel from '@/components/common/SharePanel.vue'
import AuthModal from '@/components/auth/AuthModal.vue'
import { useBossKeyStore } from '@/stores/bossKey'
import { availableLocales, localeMetaMap, setLocale, type AppLocale } from '@/core/i18n'
import { useAuth } from '@/composables/useAuth'
import { useSoundEngine } from '@/modules/tools/pomodoro/composables/useSoundEngine'

const router = useRouter()
const route = useRoute()
const { t, locale } = useI18n({ useScope: 'global' })
const bossKeyStore = useBossKeyStore()
const { user, nickname, logout, initAuth } = useAuth()
const { isPlaying: isMusicPlaying } = useSoundEngine()

const showSettingsModal = ref(false)
const showLocaleMenu = ref(false)
const showShareMenu = ref(false)
const showAuthModal = ref(false)
const showUserMenu = ref(false)
const isMobileMenuOpen = ref(false)
const localePrefixRegex = /^\/(en|zh)(?=\/|$)/

// Click outside handler for dropdowns
onMounted(() => {
  document.addEventListener('click', closeDropdowns)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdowns)
})

const closeDropdowns = () => {
  showLocaleMenu.value = false
  showShareMenu.value = false
  showUserMenu.value = false
}

// Stay duration tracking
const stayDuration = ref(0)
let timerId: number | null = null
let lastTime = Date.now()

const updateDuration = () => {
  const now = Date.now()
  const delta = now - lastTime
  lastTime = now

  // Accumulate time if page is visible OR music is playing
  if (!document.hidden || isMusicPlaying.value) {
    stayDuration.value += delta
  }
}

onMounted(() => {
  initAuth()
  lastTime = Date.now()
  timerId = window.setInterval(updateDuration, 1000)
})

onUnmounted(() => {
  if (timerId) clearInterval(timerId)
})

const formattedDuration = computed(() => {
  const totalSeconds = Math.floor(stayDuration.value / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

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

const currentLocale = computed<AppLocale>(() => (route.params.locale === 'zh' ? 'zh' : 'en'))
const routePathWithoutLocale = computed(() => {
  const path = route.path.replace(localePrefixRegex, '')
  return path || '/'
})

const isActive = (path: string) => {
  if (path === '/') return routePathWithoutLocale.value === '/'
  return routePathWithoutLocale.value.startsWith(path)
}

const buildLocalizedPath = (path: string, nextLocale = currentLocale.value) => {
  const normalized = path === '/' ? '' : path
  return `/${nextLocale}${normalized}`
}

const handleNavigate = (path: string) => {
  router.push(buildLocalizedPath(path))
  isMobileMenuOpen.value = false
}

const selectLocale = async (nextLocale: AppLocale) => {
  await setLocale(nextLocale)
  locale.value = nextLocale
  await router.push({
    path: buildLocalizedPath(routePathWithoutLocale.value, nextLocale),
    query: route.query,
    hash: route.hash
  })
  showLocaleMenu.value = false
}

const handleLogout = async () => {
  showUserMenu.value = false
  await logout()
}

// Stop propagation for dropdown toggles
const toggleLocale = (e: Event) => {
  e.stopPropagation()
  showLocaleMenu.value = !showLocaleMenu.value
  showShareMenu.value = false
  showUserMenu.value = false
}

const toggleShare = (e: Event) => {
  e.stopPropagation()
  showShareMenu.value = !showShareMenu.value
  showLocaleMenu.value = false
  showUserMenu.value = false
}

const toggleUser = (e: Event) => {
  e.stopPropagation()
  showUserMenu.value = !showUserMenu.value
  showLocaleMenu.value = false
  showShareMenu.value = false
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
        <div class="stay-duration" :title="t('header.stayDuration')">
          <Icon icon="mdi:clock-outline" :width="16" />
          <span>{{ formattedDuration }}</span>
        </div>

        <button class="boss-key-btn" @click="handleNavigate('/about')" :title="t('routeTitle.about')">
          <Icon icon="mdi:information-variant-circle-outline" :width="18" />
        </button>

        <div class="share-selector">
          <button class="theme-btn" :title="t('header.share')" @click="toggleShare">
            <Icon icon="mdi:share-variant-outline" :width="18" />
          </button>
          <Transition name="fade">
            <div v-if="showShareMenu" class="share-menu" @click.stop>
              <SharePanel />
            </div>
          </Transition>
        </div>

        <div class="locale-selector">
          <button class="theme-btn" @click="toggleLocale">
            <Icon icon="mdi:translate" :width="18" />
          </button>
          <Transition name="fade">
            <div v-if="showLocaleMenu" class="theme-menu" @click.stop>
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

        <button class="theme-btn" @click="showSettingsModal = true" :title="t('settings.title')">
          <Icon icon="mdi:cog" :width="18" />
        </button>

        <div class="user-selector">
          <button v-if="user" class="theme-btn user-btn" @click="toggleUser" :title="nickname">
            <Icon icon="mdi:account" :width="18" />
            <span class="user-name">{{ nickname }}</span>
          </button>
          <button v-else class="theme-btn login-btn" @click="showAuthModal = true" title="Login / Register">
            <Icon icon="mdi:login" :width="18" />
          </button>
          
          <Transition name="fade">
            <div v-if="showUserMenu && user" class="user-menu" @click.stop>
              <div class="user-header">
                <div class="user-avatar">
                  <Icon icon="mdi:account-circle" width="32" />
                </div>
                <div class="user-info">
                  <span class="name">{{ nickname }}</span>
                  <span class="status">Online</span>
                </div>
              </div>
              <div class="menu-divider" />
              <div class="menu-item" @click="handleLogout">
                <Icon icon="mdi:logout" width="16" />
                <span>Logout</span>
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
        
        <div class="mobile-nav-item" @click="showSettingsModal = true; isMobileMenuOpen = false">
          <Icon icon="mdi:cog" :width="20" />
          <span>{{ t('settings.title') }}</span>
        </div>
      </nav>
    </Transition>
    
    <GlobalSettingsModal 
      :visible="showSettingsModal" 
      :current-mode="bossKeyStore.mode"
      @close="showSettingsModal = false"
      @change-boss-key-mode="bossKeyStore.setMode"
    />
    
    <AuthModal :show="showAuthModal" @close="showAuthModal = false" />
  </header>
</template>

<style scoped lang="scss">
.app-header {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 0;
  background: color-mix(in srgb, var(--color-surface) 88%, transparent);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(14px);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;
  max-width: 1240px;
  margin: 0 auto;
  border: none;
  border-radius: 0;
  box-shadow: none;
  backdrop-filter: none;
  background: transparent;
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
    
    .stay-duration {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 0 10px;
      height: 36px;
      border-radius: 12px;
      background: color-mix(in srgb, var(--color-surface-muted, var(--color-background)) 50%, transparent);
      color: var(--color-text-secondary);
      font-size: 13px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      margin-right: 6px;
      cursor: help;
      
      @media (max-width: 600px) {
        display: none;
      }
    }
  
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
  .theme-selector,
  .user-selector {
    position: relative;
  }
  
  .user-btn {
    width: auto;
    padding: 0 10px;
    gap: 6px;
    
    .user-name {
      font-size: 13px;
      font-weight: 600;
      max-width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      
      @media (max-width: 600px) {
        display: none;
      }
    }
  }
  
  .user-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 10px;
    width: 240px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    box-shadow: var(--shadow-lg);
    padding: 16px;
    z-index: 200;
    
    .user-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      
      .user-avatar {
        color: var(--color-primary);
        background: color-mix(in srgb, var(--color-primary) 10%, transparent);
        padding: 8px;
        border-radius: 50%;
        display: flex;
      }
      
      .user-info {
        display: flex;
        flex-direction: column;
        
        .name {
          font-weight: 600;
          color: var(--color-text);
          font-size: 15px;
        }
        
        .status {
          font-size: 12px;
          color: var(--color-success);
          display: flex;
          align-items: center;
          gap: 4px;
          
          &::before {
            content: '';
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: currentColor;
          }
        }
      }
    }
    
    .menu-divider {
      height: 1px;
      background: var(--color-border);
      margin: 8px 0;
    }
    
    .menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      cursor: pointer;
      color: var(--color-text-secondary);
      font-size: 14px;
      transition: all 0.2s;
      
      &:hover {
        background: var(--color-background);
        color: var(--color-error);
      }
    }
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
  .app-header {
    background: color-mix(in srgb, var(--color-surface) 95%, transparent);
    border-bottom: 1px solid var(--color-border);
  }

  .header-right .theme-btn,
  .header-right .mobile-menu-btn {
    background: color-mix(in srgb, var(--color-surface) 70%, #0a1020);
  }
}

[data-theme="pixel"] {
  .app-header {
    background: var(--color-surface);
    border-bottom: 2px solid var(--color-border);
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
