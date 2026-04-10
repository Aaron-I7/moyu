<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import {
  getTaskStatusLabel,
  getTaskStatusTone,
  getTaskVisualIcon
} from '@/features/child-portal/helpers'
import { formatPoints } from '@/features/child-portal/format'
import type { ChildTaskItem, ChildTasksResponse } from '@/features/child-portal/types'

const props = defineProps<{
  actionBusy: boolean
  recordDate: string
  tasksData: ChildTasksResponse | null
}>()

const emit = defineEmits<{
  complete: [taskId: string]
}>()

const taskColumns = computed(() => [
  {
    key: 'active',
    title: '去完成',
    icon: 'ph:rocket-launch-fill',
    tone: 'amber',
    items: props.tasksData?.active_tasks || []
  },
  {
    key: 'pending',
    title: '待确认',
    icon: 'ph:hourglass-medium-fill',
    tone: 'sky',
    items: props.tasksData?.pending_tasks || []
  },
  {
    key: 'completed',
    title: '已完成',
    icon: 'ph:seal-check-fill',
    tone: 'mint',
    items: props.tasksData?.completed_tasks || []
  }
])

function canCompleteTask(task: ChildTaskItem) {
  return (task.type || 'active') === 'active'
}
</script>

<template>
  <section class="quest-board">
    <!-- 顶部卷轴/木牌风格的装饰 -->
    <header class="quest-board__sign">
      <h2>任务布告栏</h2>
      <span class="quest-board__date">{{ recordDate || '今天' }}</span>
    </header>

    <div class="quest-sections">
      <template v-for="column in taskColumns" :key="column.key">
        <section v-if="column.items.length" class="quest-section">
          <div class="quest-section__header" :class="`quest-section__header--${column.tone}`">
            <Icon :icon="column.icon" />
            <h3>{{ column.title }}</h3>
            <span class="quest-section__count">{{ column.items.length }}</span>
          </div>

          <div class="quest-grid">
            <article v-for="item in column.items" :key="item.task_id" class="quest-card" :class="`quest-card--${getTaskStatusTone(item.type)}`">
              <div class="quest-card__stamp" v-if="item.type === 'completed'">
                <Icon icon="ph:seal-check-fill" />
              </div>
              <div class="quest-card__badge" :class="`quest-card__badge--${getTaskStatusTone(item.type)}`">
                <img v-if="item.image_url" :src="item.image_url" :alt="item.title" />
                <Icon v-else :icon="getTaskVisualIcon(item.type)" />
              </div>

              <div class="quest-card__body">
                <h4>{{ item.title }}</h4>
                <div class="quest-card__reward">
                  <Icon icon="ph:shooting-star-fill" />
                  <span>+{{ formatPoints(item.points) }}</span>
                </div>
              </div>

              <div class="quest-card__actions">
                <button
                  v-if="canCompleteTask(item)"
                  type="button"
                  class="quest-btn quest-btn--primary"
                  :disabled="actionBusy"
                  @click="emit('complete', item.task_id)"
                >
                  完成！
                </button>
                <div v-else class="quest-status-text">
                  {{ getTaskStatusLabel(item.type) }}
                </div>
              </div>
            </article>
          </div>
        </section>
      </template>
      
      <!-- 如果所有任务都空 -->
      <div v-if="!tasksData?.active_tasks?.length && !tasksData?.pending_tasks?.length && !tasksData?.completed_tasks?.length" class="quest-board__empty">
        <Icon icon="ph:mask-sad-light" />
        <p>今天还没有任务哦</p>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.quest-board {
  display: flex;
  flex-direction: column;
  gap: 24px;
  animation: boardRise 0.4s ease;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.quest-board__sign {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px;
  background: linear-gradient(180deg, #ffdf85, #ffb636);
  border-radius: 24px;
  border: 4px solid #fff;
  box-shadow: 0 12px 0 rgba(217, 128, 20, 0.2), 0 16px 24px rgba(0,0,0,0.1);
  color: #603400;
  
  h2 {
    margin: 0;
    font-size: 32px;
    font-weight: 900;
    letter-spacing: 0.05em;
  }
}

.quest-board__date {
  padding: 6px 16px;
  background: rgba(255,255,255,0.6);
  border-radius: 999px;
  font-weight: 800;
  font-size: 14px;
}

.quest-sections {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.quest-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.quest-section__header {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding: 8px 16px;
  border-radius: 16px;
  color: white;
  font-size: 20px;
  
  h3 { margin: 0; font-size: 20px; font-weight: 900; }
  svg { font-size: 24px; }
}

.quest-section__count {
  background: rgba(255,255,255,0.3);
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 900;
}

.quest-section__header--amber { background: linear-gradient(135deg, #ffd772, #f8a93d); color: #5f3800; }
.quest-section__header--sky { background: linear-gradient(135deg, #92dcff, #68a8ff); color: #1f4f81; }
.quest-section__header--mint { background: linear-gradient(135deg, #a4ecae, #63c56f); color: #245a32; }

.quest-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.quest-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 24px;
  background: white;
  border: 3px solid rgba(0,0,0,0.05);
  box-shadow: 0 8px 0 rgba(0,0,0,0.05);
  transition: transform 0.2s;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-4px);
  }
}

.quest-card--completed {
  opacity: 0.8;
  background: #f0fdf4;
}

.quest-card__stamp {
  position: absolute;
  right: -10px;
  top: -10px;
  font-size: 80px;
  color: rgba(76, 219, 94, 0.2);
  transform: rotate(-15deg);
  pointer-events: none;
}

.quest-card__badge {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 20px;
  display: grid;
  place-items: center;
  font-size: 32px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  overflow: hidden;
  
  img { width: 100%; height: 100%; object-fit: cover; }
}

.quest-card__badge--amber { background: linear-gradient(135deg, #ffd772, #f8a93d); color: #5f3800; }
.quest-card__badge--sky { background: linear-gradient(135deg, #92dcff, #68a8ff); color: #1f4f81; }
.quest-card__badge--mint { background: linear-gradient(135deg, #a4ecae, #63c56f); color: #245a32; }

.quest-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  
  h4 {
    margin: 0;
    font-size: 18px;
    font-weight: 900;
    color: #2c3e50;
    line-height: 1.2;
  }
}

.quest-card__reward {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #ff9100;
  font-weight: 900;
  font-size: 16px;
  
  svg { font-size: 20px; }
}

.quest-card__actions {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.quest-btn {
  padding: 10px 20px;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 900;
  border: none;
  cursor: pointer;
  transition: all 0.1s;
}

.quest-btn--primary {
  background: linear-gradient(135deg, #4cdb5e, #34c759);
  color: white;
  box-shadow: 0 6px 0 #28a745;
  
  &:active:not(:disabled) {
    transform: translateY(6px);
    box-shadow: 0 0 0 #28a745;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.quest-status-text {
  font-size: 14px;
  font-weight: 800;
  color: #8da2b5;
  padding: 8px 12px;
  background: rgba(0,0,0,0.04);
  border-radius: 999px;
}

.quest-board__empty {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #8da2b5;
  font-size: 18px;
  font-weight: 800;
  
  svg { font-size: 48px; }
}

@keyframes boardRise {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .quest-grid { grid-template-columns: 1fr; }
  .quest-card { padding: 12px; }
  .quest-card__badge { width: 56px; height: 56px; font-size: 28px; }
}
</style>
