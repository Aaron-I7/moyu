<template>
  <div class="tool-menu" :class="{ expanded: isExpanded }">
    <button class="menu-toggle" @click="toggleMenu" :title="isExpanded ? '收起菜单' : '展开菜单'">
      <span class="toggle-icon">{{ isExpanded ? '◀' : '▶' }}</span>
      <span v-if="isExpanded" class="toggle-text">工具栏</span>
    </button>

    <Transition name="slide">
      <div v-if="isExpanded" class="menu-content">
        <div class="menu-section">
          <div class="section-title">
            <span class="section-icon">🎮</span>
            <span>游戏</span>
          </div>
          <div class="menu-items">
            <button
              v-for="item in gamesModules"
              :key="item.id"
              class="menu-item"
              @click="navigateTo(item.route)"
            >
              <span class="item-icon">{{ item.icon }}</span>
              <span class="item-name">{{ item.name }}</span>
            </button>
          </div>
        </div>

        <div class="menu-section">
          <div class="section-title">
            <span class="section-icon">😌</span>
            <span>休闲</span>
          </div>
          <div class="menu-items">
            <button
              v-for="item in relaxModules"
              :key="item.id"
              class="menu-item"
              :class="{ active: currentRoute === item.route }"
              @click="navigateTo(item.route)"
            >
              <span class="item-icon">{{ item.icon }}</span>
              <span class="item-name">{{ item.name }}</span>
            </button>
          </div>
        </div>

        <div class="menu-section">
          <div class="section-title">
            <span class="section-icon">🛠️</span>
            <span>工具</span>
          </div>
          <div class="menu-items">
            <button
              v-for="item in toolsModules"
              :key="item.id"
              class="menu-item"
              @click="navigateTo(item.route)"
            >
              <span class="item-icon">{{ item.icon }}</span>
              <span class="item-name">{{ item.name }}</span>
            </button>
          </div>
        </div>

        <div class="menu-section">
          <div class="section-title">
            <span class="section-icon">📚</span>
            <span>阅读</span>
          </div>
          <div class="menu-items">
            <button
              v-for="item in readingModules"
              :key="item.id"
              class="menu-item"
              @click="navigateTo(item.route)"
            >
              <span class="item-icon">{{ item.icon }}</span>
              <span class="item-name">{{ item.name }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import moduleRegistry from '@/core/module/registry'

const router = useRouter()
const route = useRoute()
const isExpanded = ref(false)

const currentRoute = computed(() => route.path)

const gamesModules = computed(() => moduleRegistry.getByCategory('games'))
const relaxModules = computed(() => moduleRegistry.getByCategory('relax'))
const toolsModules = computed(() => moduleRegistry.getByCategory('tools'))
const readingModules = computed(() => moduleRegistry.getByCategory('reading'))

function toggleMenu() {
  isExpanded.value = !isExpanded.value
}

function navigateTo(path: string) {
  router.push(path)
}
</script>

<style scoped lang="scss">
.tool-menu {
  display: flex;
  align-items: flex-start;
  gap: 0;
  transition: all 0.3s ease;
}

.menu-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow);

  &:hover {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }
}

.toggle-icon {
  font-size: 12px;
  transition: transform 0.3s ease;
}

.toggle-text {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.tool-menu.expanded .menu-toggle {
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

.section-icon {
  font-size: 14px;
}

.menu-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;

  &:hover {
    background: var(--color-background);
  }

  &.active {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%);
    color: var(--color-primary);
  }
}

.item-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.item-name {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  .tool-menu {
    flex-direction: column;
  }

  .tool-menu.expanded .menu-toggle {
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
</style>
