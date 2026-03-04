<template>
  <div class="interaction-log">
    <header class="log-header">
      <h3 class="log-title">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
        </svg>
        {{ isEn ? 'Activity Log' : '互动记录' }}
      </h3>
      <span class="log-count">{{ isEn ? `${count} total` : `共 ${count} 次` }}</span>
    </header>

    <div class="log-content">
      <div v-if="props.interactions.length === 0" class="empty-state">
        <span class="empty-icon">📝</span>
        <p>{{ isEn ? 'No activity yet' : '暂无互动记录' }}</p>
      </div>

      <TransitionGroup v-else name="list" tag="ul" class="log-list">
        <li
          v-for="item in props.interactions"
          :key="item.id"
          class="log-item"
        >
          <span class="item-icon">{{ getActionIcon(item.action) }}</span>
          <div class="item-content">
            <span class="item-action">{{ getActionLabel(item.action) }}</span>
            <span v-if="item.detail" class="item-detail">{{ isEn ? getActionDetail(item.action) : item.detail }}</span>
          </div>
            <span class="item-time">{{ formatTimeAgo(item.timestamp) }}</span>
        </li>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface InteractionItem {
  id: string
  action: string
  timestamp: number
  detail?: string
  timeAgo: string
}

const props = defineProps<{
  interactions: InteractionItem[]
  count: number
}>()
const { locale } = useI18n()
const isEn = computed(() => locale.value === 'en')

function getActionIcon(action: string): string {
  const icons: Record<string, string> = {
    adopt: '🏠',
    feed: '🍖',
    play: '🎾',
    pet: '✋',
    sleep: '😴',
    wakeUp: '☀️',
    bath: '🛁',
    special: '⭐',
  }
  return icons[action] || '🐾'
}

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    adopt: isEn.value ? 'Adopt' : '领养',
    feed: isEn.value ? 'Feed' : '喂食',
    play: isEn.value ? 'Play' : '玩耍',
    pet: isEn.value ? 'Pet' : '抚摸',
    sleep: isEn.value ? 'Sleep' : '睡觉',
    wakeUp: isEn.value ? 'Wake up' : '醒来',
    bath: isEn.value ? 'Bath' : '洗澡',
    special: isEn.value ? 'Special' : '特殊互动',
  }
  return labels[action] || action
}

function getActionDetail(action: string): string {
  const details: Record<string, string> = {
    adopt: 'New companion joined',
    feed: 'Meal completed',
    play: 'Play session done',
    pet: 'Pat and comfort',
    sleep: 'Started sleeping',
    wakeUp: 'Woke up',
    bath: 'Bath completed',
    special: 'Special interaction'
  }
  return details[action] || 'Interaction'
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (isEn.value) {
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }
  if (seconds < 60) return '刚刚'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}
</script>

<style scoped lang="scss">
.interaction-log {
  background: var(--color-surface);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  border: 1px solid var(--color-border);
  overflow: hidden;
  height: fit-content;
  max-height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.log-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;

  svg {
    color: var(--color-primary);
  }
}

.log-count {
  font-size: 12px;
  color: var(--color-text-secondary);
  background: var(--color-background);
  padding: 4px 10px;
  border-radius: 12px;
}

.log-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--color-text-secondary);

  .empty-icon {
    font-size: 32px;
    margin-bottom: 8px;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

.log-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--color-background);
  border-radius: calc(var(--border-radius) - 4px);
  transition: var(--transition);

  &:hover {
    background: var(--color-surface);
    box-shadow: var(--shadow);
  }
}

.item-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.item-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-action {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.item-detail {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.item-time {
  font-size: 11px;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
