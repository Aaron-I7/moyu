<template>
  <div class="global-tool-menu" :class="{ expanded: isExpanded }">
    <BaseButton
      class="menu-toggle"
      :type="isExpanded ? 'primary' : 'default'"
      @click="toggleMenu"
      :title="isExpanded ? t('header.menuCollapse') : t('header.menuExpand')"
    >
      <Icon :icon="isExpanded ? 'mdi:chevron-left' : 'mdi:chevron-right'" :width="16" />
      <span v-if="isExpanded" class="toggle-text">{{ t('toolMenu.title') }}</span>
    </BaseButton>

    <Transition name="slide">
      <div v-if="isExpanded" class="menu-content">
        <div class="menu-section">
          <div class="section-title">
            <Icon icon="mdi:gamepad-variant" :width="16" />
            <span>{{ t('category.games') }}</span>
          </div>
          <div class="menu-items">
            <div
              v-for="item in gamesModules"
              :key="item.id"
              class="menu-item"
              :class="{ active: currentRoute === item.route }"
              @click="navigateTo(item.route)"
            >
              <Icon :icon="item.icon as string" :width="16" />
              <span>{{ resolveModuleName(t, item) }}</span>
            </div>
          </div>
        </div>

        <div class="menu-section">
          <div class="section-title">
            <Icon icon="mdi:spa" :width="16" />
            <span>{{ t('category.relax') }}</span>
          </div>
          <div class="menu-items">
            <div
              v-for="item in relaxModules"
              :key="item.id"
              class="menu-item"
              :class="{ active: currentRoute === item.route }"
              @click="navigateTo(item.route)"
            >
              <Icon :icon="item.icon as string" :width="16" />
              <span>{{ resolveModuleName(t, item) }}</span>
            </div>
          </div>
        </div>

        <div class="menu-section">
          <div class="section-title">
            <Icon icon="mdi:tools" :width="16" />
            <span>{{ t('category.tools') }}</span>
          </div>
          <div class="menu-items">
            <div
              v-for="item in toolsModules"
              :key="item.id"
              class="menu-item"
              @click="navigateTo(item.route)"
            >
              <Icon :icon="item.icon as string" :width="16" />
              <span>{{ resolveModuleName(t, item) }}</span>
            </div>
          </div>
        </div>

        <div class="menu-section">
          <div class="section-title">
            <Icon icon="mdi:book-open-page-variant" :width="16" />
            <span>{{ t('category.reading') }}</span>
          </div>
          <div class="menu-items">
            <div
              v-for="item in readingModules"
              :key="item.id"
              class="menu-item"
              @click="navigateTo(item.route)"
            >
              <Icon :icon="item.icon as string" :width="16" />
              <span>{{ resolveModuleName(t, item) }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import BaseButton from '@/components/common/BaseButton.vue'
import moduleRegistry from '@/core/module/registry'
import { resolveModuleName } from '@/core/module/i18n'

const router = useRouter()
const route = useRoute()
const { t } = useI18n({ useScope: 'global' })
const isExpanded = ref(false)
const localePrefixRegex = /^\/(en|zh)(?=\/|$)/
const currentLocale = computed(() => (route.params.locale === 'zh' ? 'zh' : 'en'))

const currentRoute = computed(() => {
  const path = route.path.replace(localePrefixRegex, '')
  return path || '/'
})

const gamesModules = computed(() => moduleRegistry.getByCategory('games'))
const relaxModules = computed(() => moduleRegistry.getByCategory('relax'))
const toolsModules = computed(() => moduleRegistry.getByCategory('tools'))
const readingModules = computed(() => moduleRegistry.getByCategory('reading'))

function toggleMenu() {
  isExpanded.value = !isExpanded.value
}

function navigateTo(path: string) {
  const normalized = path === '/' ? '' : path
  router.push(`/${currentLocale.value}${normalized}`)
}
</script>

<style scoped lang="scss">
.global-tool-menu {
  position: fixed;
  inset-inline-start: 24px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
  display: flex;
  align-items: flex-start;
  gap: 0;
  transition: all 0.3s ease;

  @media (max-width: 1200px) {
    inset-inline-start: 12px;
  }

  @media (max-width: 900px) {
    inset-inline-start: 12px;
    top: auto;
    bottom: 84px;
    transform: none;
  }
}

.menu-toggle {
  box-shadow: var(--shadow);

  .toggle-text {
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
  }
}

.global-tool-menu.expanded .menu-toggle {
  border-radius: var(--border-radius) 0 0 var(--border-radius);
  border-right: none;
}

.menu-content {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0 var(--border-radius) var(--border-radius) 0;
  padding: 12px;
  min-width: 160px;
  max-height: 70vh;
  overflow-y: auto;
  box-shadow: var(--shadow);
}

.menu-section {
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  padding: 4px 0;
  margin-bottom: 6px;
  border-bottom: 1px solid var(--color-border);
}

.menu-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: var(--transition);

  &:hover {
    background: var(--color-background);
    color: var(--color-text);
  }

  &.active {
    background: rgba(16, 185, 129, 0.1);
    color: var(--color-primary);
  }
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

@media (max-width: 900px) {
  .global-tool-menu {
    flex-direction: column;
  }

  .global-tool-menu.expanded .menu-toggle {
    border-radius: var(--border-radius) var(--border-radius) 0 0;
    border-right: 1px solid var(--color-border);
    border-bottom: none;
  }

  .menu-content {
    border-radius: 0 0 var(--border-radius) var(--border-radius);
    min-width: auto;
    max-height: 50vh;
  }
}

[dir="rtl"] .slide-enter-from,
[dir="rtl"] .slide-leave-to {
  transform: translateX(10px);
}
</style>
