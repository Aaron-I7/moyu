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

const activeTasks = computed(() => props.tasksData?.active_tasks || [])
const pendingTasks = computed(() => props.tasksData?.pending_tasks || [])
const completedTasks = computed(() => props.tasksData?.completed_tasks || [])
const totalTasks = computed(() => activeTasks.value.length + pendingTasks.value.length + completedTasks.value.length)
const progressValue = computed(() => {
  if (!totalTasks.value) return 0
  return Math.round(((pendingTasks.value.length + completedTasks.value.length) / totalTasks.value) * 100)
})

const campStats = computed(() => [
  {
    key: 'active',
    label: '待出发挑战',
    value: activeTasks.value.length,
    icon: 'ph:rocket-launch-fill',
    tone: 'amber'
  },
  {
    key: 'pending',
    label: '帐篷里等待点亮',
    value: pendingTasks.value.length,
    icon: 'ph:campfire-fill',
    tone: 'sky'
  },
  {
    key: 'completed',
    label: '今天带回的徽章',
    value: completedTasks.value.length,
    icon: 'ph:shield-star-fill',
    tone: 'mint'
  }
])

function canCompleteTask(task: ChildTaskItem) {
  return (task.type || 'active') === 'active'
}

function getTaskHint(task: ChildTaskItem) {
  if (task.type === 'completed') {
    return task.description || '这枚徽章已经稳稳收进背包啦。'
  }

  if (task.type === 'pending') {
    return task.description || '任务已经送到家长确认帐篷，等一下就会点亮。'
  }

  if (task.auto_confirm_completion) {
    return task.description || '完成后会自己点亮并收入星星。'
  }

  return task.description || '完成它，把星星和新的徽章带回营地。'
}
</script>

<template>
  <section class="challenge-camp">
    <header class="challenge-camp__sign">
      <div class="challenge-camp__hero">
        <span class="challenge-camp__eyebrow">冒险世界 · 挑战营地</span>
        <h2>今天先攻下哪一关？</h2>
        <p>把当前最重要的挑战先完成，等点亮后再把徽章收进今天的战利品墙。</p>
      </div>

      <div class="challenge-camp__meta">
        <span class="challenge-camp__date">
          <Icon icon="ph:calendar-blank-fill" />
          {{ recordDate || '今天' }}
        </span>
        <div class="challenge-camp__progress-card">
          <strong>{{ progressValue }}%</strong>
          <span>今日旅程推进度</span>
          <div class="challenge-camp__progress-track">
            <span :style="{ width: `${Math.max(progressValue, totalTasks ? 10 : 0)}%` }" />
          </div>
        </div>
      </div>
    </header>

    <section class="challenge-camp__overview">
      <article v-for="item in campStats" :key="item.key" class="camp-stat" :class="`camp-stat--${item.tone}`">
        <div class="camp-stat__icon">
          <Icon :icon="item.icon" />
        </div>
        <div class="camp-stat__content">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </article>
    </section>

    <div v-if="totalTasks" class="challenge-camp__sections">
      <section v-if="activeTasks.length" class="camp-panel">
        <div class="camp-panel__title camp-panel__title--amber">
          <Icon icon="ph:rocket-launch-fill" />
          <h3>下一步挑战</h3>
          <span>{{ activeTasks.length }}</span>
        </div>

        <div class="mission-grid">
          <article
            v-for="item in activeTasks"
            :key="item.task_id"
            class="mission-card"
            :class="`mission-card--${getTaskStatusTone(item.type)}`"
          >
            <div class="mission-card__media" :class="`mission-card__media--${getTaskStatusTone(item.type)}`">
              <img v-if="item.image_url" :src="item.image_url" :alt="item.title" />
              <Icon v-else :icon="getTaskVisualIcon(item.type)" />
            </div>

            <div class="mission-card__body">
              <span class="mission-card__tag">
                <Icon :icon="item.auto_confirm_completion ? 'ph:magic-wand-fill' : 'ph:compass-fill'" />
                {{ item.auto_confirm_completion ? '自动点亮任务' : '主线挑战' }}
              </span>
              <h4>{{ item.title }}</h4>
              <p>{{ getTaskHint(item) }}</p>
            </div>

            <div class="mission-card__footer">
              <div class="mission-card__reward">
                <Icon icon="ph:shooting-star-fill" />
                <strong>+{{ formatPoints(item.points) }}</strong>
              </div>
              <button
                v-if="canCompleteTask(item)"
                type="button"
                class="mission-card__action"
                :disabled="actionBusy"
                @click="emit('complete', item.task_id)"
              >
                完成这关
              </button>
            </div>
          </article>
        </div>
      </section>

      <section v-if="pendingTasks.length" class="camp-panel">
        <div class="camp-panel__title camp-panel__title--sky">
          <Icon icon="ph:campfire-fill" />
          <h3>确认帐篷</h3>
          <span>{{ pendingTasks.length }}</span>
        </div>

        <div class="tent-list">
          <article v-for="item in pendingTasks" :key="item.task_id" class="tent-card">
            <div class="tent-card__icon">
              <img v-if="item.image_url" :src="item.image_url" :alt="item.title" />
              <Icon v-else :icon="getTaskVisualIcon(item.type)" />
            </div>
            <div class="tent-card__content">
              <div class="tent-card__header">
                <strong>{{ item.title }}</strong>
                <span class="tent-card__reward">+{{ formatPoints(item.points) }}</span>
              </div>
              <p>{{ getTaskHint(item) }}</p>
            </div>
            <div class="tent-card__status">
              <Icon icon="ph:hourglass-medium-fill" />
              <span>{{ getTaskStatusLabel(item.type) }}</span>
            </div>
          </article>
        </div>
      </section>

      <section v-if="completedTasks.length" class="camp-panel">
        <div class="camp-panel__title camp-panel__title--mint">
          <Icon icon="ph:shield-star-fill" />
          <h3>今日战利品墙</h3>
          <span>{{ completedTasks.length }}</span>
        </div>

        <div class="trophy-grid">
          <article v-for="item in completedTasks" :key="item.task_id" class="trophy-card">
            <div class="trophy-card__stamp">
              <Icon icon="ph:seal-check-fill" />
            </div>
            <div class="trophy-card__crest" :class="`trophy-card__crest--${getTaskStatusTone(item.type)}`">
              <img v-if="item.image_url" :src="item.image_url" :alt="item.title" />
              <Icon v-else :icon="getTaskVisualIcon(item.type)" />
            </div>
            <strong>{{ item.title }}</strong>
            <span class="trophy-card__points">+{{ formatPoints(item.points) }}</span>
            <p>{{ getTaskHint(item) }}</p>
          </article>
        </div>
      </section>
    </div>

    <div v-else class="challenge-camp__empty">
      <Icon icon="ph:backpack-fill" />
      <p>今天的挑战营地还没有挂上新的任务牌。</p>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '../adventure-theme.scss' as theme;

.challenge-camp {
  @include theme.page-shell;
}

.challenge-camp__sign {
  @include theme.sign-shell(linear-gradient(135deg, #ffd679 0%, #ffb86a 45%, #ff9d6c 100%), #643b00, #d5841f);
}

.challenge-camp__hero,
.challenge-camp__meta {
  position: relative;
  z-index: 1;
}

.challenge-camp__hero {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 620px;

  h2 {
    margin: 0;
    font-size: clamp(28px, 4vw, 38px);
    line-height: 1.08;
    font-weight: 900;
  }

  p {
    margin: 0;
    font-size: 15px;
    line-height: 1.7;
    color: rgba(100, 59, 0, 0.82);
    max-width: 520px;
  }
}

.challenge-camp__eyebrow {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 7px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.06em;
}

.challenge-camp__meta {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: min(240px, 100%);
}

.challenge-camp__date {
  @include theme.stat-chip;
  justify-content: center;
  color: #724109;
  font-weight: 900;
}

.challenge-camp__progress-card {
  @include theme.surface-card(18px 20px, 24px);
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: min(220px, 100%);

  strong {
    font-size: 34px;
    line-height: 1;
    color: #5f3800;
  }

  span {
    font-size: 13px;
    font-weight: 800;
    color: rgba(95, 56, 0, 0.72);
  }
}

.challenge-camp__progress-track {
  height: 12px;
  border-radius: 999px;
  background: rgba(102, 61, 0, 0.12);
  overflow: hidden;

  span {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #fff6a5 0%, #63c56f 100%);
    box-shadow: 0 0 12px rgba(99, 197, 111, 0.3);
    transition: width 0.25s ease;
  }
}

.challenge-camp__overview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.camp-stat {
  @include theme.surface-card(18px 20px, 24px);
  display: flex;
  align-items: center;
  gap: 14px;

  &__icon {
    width: 58px;
    height: 58px;
    border-radius: 20px;
    display: grid;
    place-items: center;
    font-size: 30px;
    color: white;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28);
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 2px;

    span {
      font-size: 13px;
      font-weight: 800;
      color: #627894;
    }

    strong {
      font-size: 28px;
      line-height: 1.1;
      color: #233950;
    }
  }
}

.camp-stat--amber .camp-stat__icon { background: linear-gradient(135deg, #ffcb63 0%, #f59e0b 100%); }
.camp-stat--sky .camp-stat__icon { background: linear-gradient(135deg, #75d6ff 0%, #4f8cff 100%); }
.camp-stat--mint .camp-stat__icon { background: linear-gradient(135deg, #92e6a7 0%, #39b56d 100%); }

.challenge-camp__sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.camp-panel {
  @include theme.surface-card(24px, 30px);
}

.camp-panel__title {
  @include theme.title-pill(linear-gradient(135deg, #ffe082 0%, #ffc44d 100%), #5f3800);
  margin-bottom: 18px;

  h3 {
    margin: 0;
    font-size: 20px;
  }

  span {
    min-width: 28px;
    height: 28px;
    padding: 0 8px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    background: rgba(255, 255, 255, 0.34);
    font-size: 14px;
  }
}

.camp-panel__title--sky { @include theme.title-pill(linear-gradient(135deg, #a1e7ff 0%, #65afff 100%), #1f4f81); }
.camp-panel__title--mint { @include theme.title-pill(linear-gradient(135deg, #b3f5bc 0%, #67cd79 100%), #245a32); }

.mission-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 18px;
}

.mission-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 18px;
  padding: 22px;
  border-radius: 28px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 249, 236, 0.92) 100%);
  border: 3px solid rgba(255, 206, 100, 0.2);
  box-shadow: 0 14px 22px rgba(119, 85, 34, 0.08);

  &__media {
    width: 92px;
    height: 92px;
    border-radius: 26px;
    display: grid;
    place-items: center;
    font-size: 42px;
    color: white;
    box-shadow: 0 10px 18px rgba(0, 0, 0, 0.1);
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__media--amber { background: linear-gradient(135deg, #ffc85a 0%, #f59e0b 100%); }
  &__media--sky { background: linear-gradient(135deg, #8fddff 0%, #5b9bff 100%); }
  &__media--mint { background: linear-gradient(135deg, #aef1b4 0%, #43bc74 100%); }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;

    h4 {
      margin: 0;
      font-size: 22px;
      line-height: 1.15;
      color: #27384d;
      font-weight: 900;
    }

    p {
      margin: 0;
      font-size: 14px;
      line-height: 1.7;
      color: #667b94;
    }
  }

  &__tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    width: fit-content;
    padding: 7px 12px;
    border-radius: 999px;
    background: rgba(255, 211, 112, 0.22);
    color: #8f5500;
    font-size: 12px;
    font-weight: 900;
  }

  &__footer {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding-top: 6px;
  }

  &__reward {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #ff9d00;
    font-size: 18px;

    strong {
      font-size: 22px;
      line-height: 1;
      font-weight: 900;
    }
  }

  &__action {
    padding: 14px 22px;
    border-radius: 18px;
    border: none;
    background: linear-gradient(135deg, #51dd73 0%, #2fb35f 100%);
    color: white;
    font-size: 16px;
    font-weight: 900;
    box-shadow: 0 8px 0 rgba(47, 179, 95, 0.3);
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
    }

    &:active:not(:disabled) {
      transform: translateY(4px);
      box-shadow: 0 4px 0 rgba(47, 179, 95, 0.3);
    }

    &:disabled {
      opacity: 0.56;
      cursor: not-allowed;
      box-shadow: 0 4px 0 rgba(47, 179, 95, 0.2);
    }
  }
}

.tent-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.tent-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  padding: 18px;
  border-radius: 24px;
  background: linear-gradient(145deg, rgba(242, 250, 255, 0.95) 0%, rgba(253, 255, 255, 0.98) 100%);
  border: 2px solid rgba(125, 184, 255, 0.22);

  &__icon {
    width: 64px;
    height: 64px;
    border-radius: 20px;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, #90dcff 0%, #5a9dff 100%);
    color: white;
    font-size: 30px;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__content {
    min-width: 0;

    p {
      margin: 6px 0 0;
      font-size: 14px;
      line-height: 1.7;
      color: #67829f;
    }
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    justify-content: space-between;

    strong {
      font-size: 18px;
      color: #1f4068;
      font-weight: 900;
    }
  }

  &__reward {
    font-size: 14px;
    font-weight: 900;
    color: #ff9d00;
    white-space: nowrap;
  }

  &__status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 999px;
    background: rgba(104, 168, 255, 0.12);
    color: #2f5f94;
    font-size: 13px;
    font-weight: 900;
    white-space: nowrap;
  }
}

.trophy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.trophy-card {
  position: relative;
  padding: 22px 18px 18px;
  border-radius: 26px;
  text-align: center;
  background: linear-gradient(145deg, rgba(245, 255, 246, 0.98) 0%, rgba(255, 255, 255, 0.96) 100%);
  border: 2px solid rgba(106, 205, 121, 0.18);
  overflow: hidden;

  strong {
    display: block;
    margin-top: 14px;
    font-size: 18px;
    line-height: 1.2;
    color: #214836;
  }

  p {
    margin: 10px 0 0;
    font-size: 13px;
    line-height: 1.65;
    color: #648671;
  }
}

.trophy-card__stamp {
  position: absolute;
  right: -8px;
  top: -8px;
  font-size: 76px;
  color: rgba(76, 219, 94, 0.15);
  transform: rotate(-14deg);
}

.trophy-card__crest {
  width: 76px;
  height: 76px;
  margin: 0 auto;
  border-radius: 24px;
  display: grid;
  place-items: center;
  font-size: 34px;
  color: white;
  box-shadow: 0 10px 18px rgba(59, 145, 70, 0.18);
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.trophy-card__crest--mint {
  background: linear-gradient(135deg, #b4f3be 0%, #58c16d 100%);
}

.trophy-card__points {
  display: inline-flex;
  margin-top: 8px;
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(255, 208, 102, 0.18);
  color: #c97a00;
  font-size: 13px;
  font-weight: 900;
}

.challenge-camp__empty {
  @include theme.empty-state(240px);
}

@include theme.respond-max(tablet) {
  .challenge-camp__sign {
    flex-direction: column;
    align-items: stretch;
  }

  .challenge-camp__overview {
    grid-template-columns: 1fr;
  }
}

@include theme.respond-max(phone) {
  .challenge-camp__meta,
  .challenge-camp__progress-card {
    width: 100%;
  }

  .camp-stat {
    padding: 16px 18px;
    gap: 12px;
  }

  .camp-stat__icon {
    width: 50px;
    height: 50px;
    border-radius: 18px;
    font-size: 26px;
  }

  .camp-stat__content strong {
    font-size: 24px;
  }

  .camp-panel {
    padding: 20px;
    border-radius: 28px;
  }

  .mission-card {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 18px;
    border-radius: 24px;
  }

  .mission-card__media {
    width: 78px;
    height: 78px;
    border-radius: 22px;
    font-size: 36px;
  }

  .mission-card__body h4 {
    font-size: 20px;
  }

  .mission-card__footer {
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .mission-card__action {
    width: 100%;
    justify-content: center;
  }

  .mission-card__footer,
  .tent-card {
    grid-template-columns: 1fr;
    justify-items: start;
  }

  .tent-card {
    padding: 16px;
    border-radius: 22px;
  }

  .tent-card__icon {
    width: 56px;
    height: 56px;
    border-radius: 18px;
    font-size: 26px;
  }

  .tent-card__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .tent-card__status {
    width: 100%;
    justify-content: center;
  }

  .trophy-grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }

  .trophy-card {
    padding: 18px 16px 16px;
  }

  .trophy-card__crest {
    width: 68px;
    height: 68px;
    border-radius: 20px;
    font-size: 30px;
  }
}

@include theme.respond-max(narrow) {
  .challenge-camp__hero h2 {
    font-size: clamp(24px, 8vw, 30px);
  }

  .challenge-camp__hero p {
    font-size: 14px;
    line-height: 1.6;
  }

  .challenge-camp__progress-card {
    padding: 16px;

    strong {
      font-size: 28px;
    }
  }

  .camp-panel__title h3 {
    font-size: 17px;
  }

  .mission-grid {
    gap: 14px;
  }

  .mission-card {
    padding: 16px;
    gap: 14px;
  }

  .mission-card__media {
    width: 68px;
    height: 68px;
    border-radius: 20px;
    font-size: 32px;
  }

  .mission-card__tag {
    padding: 6px 10px;
    font-size: 11px;
  }

  .mission-card__body h4 {
    font-size: 18px;
  }

  .mission-card__body p {
    font-size: 13px;
    line-height: 1.6;
  }

  .mission-card__reward {
    font-size: 15px;

    strong {
      font-size: 19px;
    }
  }

  .mission-card__action {
    padding: 12px 16px;
    font-size: 15px;
  }

  .tent-card__icon {
    width: 52px;
    height: 52px;
    font-size: 24px;
  }

  .tent-card__header strong {
    font-size: 16px;
  }

  .tent-card__content p {
    font-size: 13px;
    line-height: 1.6;
  }

  .trophy-grid {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 12px;
  }

  .trophy-card strong {
    font-size: 16px;
  }

  .trophy-card__stamp {
    font-size: 64px;
  }

  .trophy-card__crest {
    width: 60px;
    height: 60px;
    border-radius: 18px;
    font-size: 28px;
  }
}
</style>
