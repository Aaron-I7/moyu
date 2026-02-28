<template>
  <div class="interaction-log">
    <header class="log-header">
      <h3 class="log-title">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
        </svg>
        互动记录
      </h3>
      <span class="log-count">共 {{ count }} 次</span>
    </header>

    <div class="log-content">
      <div v-if="interactions.length === 0" class="empty-state">
        <span class="empty-icon">📝</span>
        <p>暂无互动记录</p>
      </div>

      <TransitionGroup v-else name="list" tag="ul" class="log-list">
        <li
          v-for="item in interactions"
          :key="item.id"
          class="log-item"
        >
          <span class="item-icon">{{ getActionIcon(item.action) }}</span>
          <div class="item-content">
            <span class="item-action">{{ getActionLabel(item.action) }}</span>
            <span v-if="item.detail" class="item-detail">{{ item.detail }}</span>
          </div>
          <span class="item-time">{{ item.timeAgo }}</span>
        </li>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
interface InteractionItem {
  id: string
  action: string
  timestamp: number
  detail?: string
  timeAgo: string
}

defineProps<{
  interactions: InteractionItem[]
  count: number
}>()

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
    adopt: '领养',
    feed: '喂食',
    play: '玩耍',
    pet: '抚摸',
    sleep: '睡觉',
    wakeUp: '醒来',
    bath: '洗澡',
    special: '特殊互动',
  }
  return labels[action] || action
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
