<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  fetchChildHome,
  fetchChildPoints,
  fetchChildRewards,
  fetchChildTasks,
  submitChildRewardRequest,
  submitChildTask
} from '@/features/child-portal/client'
import {
  clearChildPortalSession,
  ensureChildPortalSession,
  updateChildPortalProfile,
  useChildPortalSession
} from '@/features/child-portal/session'
import { createIdempotencyKey, formatDateTime, formatExpiry, formatPoints } from '@/features/child-portal/format'
import type {
  ChildProfile,
  ChildHomeResponse,
  ChildPointsResponse,
  ChildRewardsResponse,
  ChildTasksResponse
} from '@/features/child-portal/types'

type PortalSection = 'home' | 'tasks' | 'rewards' | 'points'

const router = useRouter()
const route = useRoute()
const { childPortalSession } = useChildPortalSession()

const loading = ref(true)
const actionBusy = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const homeData = ref<ChildHomeResponse | null>(null)
const tasksData = ref<ChildTasksResponse | null>(null)
const rewardsData = ref<ChildRewardsResponse | null>(null)
const pointsData = ref<ChildPointsResponse | null>(null)
const rewardForm = ref({
  title: '',
  description: ''
})

const section = computed<PortalSection>(() => {
  const value = String(route.meta.portalSection || 'home')
  return ['home', 'tasks', 'rewards', 'points'].includes(value)
    ? (value as PortalSection)
    : 'home'
})

const navItems = [
  { key: 'home', label: '首页', to: '/child/home' },
  { key: 'tasks', label: '任务', to: '/child/tasks' },
  { key: 'rewards', label: '奖励', to: '/child/rewards' },
  { key: 'points', label: '积分', to: '/child/points' }
] satisfies Array<{ key: PortalSection; label: string; to: string }>

const childProfile = computed<Partial<ChildProfile>>(() => {
  return (
    homeData.value?.child_profile ||
    tasksData.value?.child_profile ||
    rewardsData.value?.child_profile ||
    pointsData.value?.child_profile ||
    childPortalSession.value?.childProfile ||
    {}
  )
})

const currentPoints = computed(() => {
  return Number(
    pointsData.value?.current_points ??
      childProfile.value?.current_points ??
      0
  )
})

const canRetryWithPortalLink = computed(() => Boolean(childPortalSession.value?.lastPortalToken))
const portalExpiryText = computed(() => formatExpiry(childPortalSession.value?.expiresAt))

function setSuccess(message = ''): void {
  successMessage.value = message
}

function resetMessages(): void {
  errorMessage.value = ''
  successMessage.value = ''
}

async function loadCurrentSection(): Promise<void> {
  loading.value = true
  resetMessages()

  try {
    const session = await ensureChildPortalSession()
    if (!session?.webSessionToken) {
      errorMessage.value = '当前浏览器里没有可用会话，请重新打开家长发给你的专属链接。'
      loading.value = false
      return
    }

    if (section.value === 'home') {
      homeData.value = await fetchChildHome(session.webSessionToken)
      updateChildPortalProfile(homeData.value.child_profile)
    } else if (section.value === 'tasks') {
      tasksData.value = await fetchChildTasks(session.webSessionToken)
      updateChildPortalProfile(tasksData.value.child_profile)
    } else if (section.value === 'rewards') {
      rewardsData.value = await fetchChildRewards(session.webSessionToken)
      updateChildPortalProfile(rewardsData.value.child_profile)
    } else {
      pointsData.value = await fetchChildPoints(session.webSessionToken)
      updateChildPortalProfile(pointsData.value.child_profile)
    }
  } catch (error) {
    const message = String((error as { message?: string })?.message || '加载失败')
    errorMessage.value = message
    if (message.includes('session') || message.includes('Portal link')) {
      clearChildPortalSession()
    }
  } finally {
    loading.value = false
  }
}

async function handleCompleteTask(taskId: string): Promise<void> {
  if (actionBusy.value) {
    return
  }

  actionBusy.value = true
  resetMessages()

  try {
    const session = await ensureChildPortalSession()
    if (!session?.webSessionToken) {
      throw new Error('当前会话已经失效，请重新打开专属链接。')
    }

    await submitChildTask(session.webSessionToken, {
      task_id: taskId,
      record_date: tasksData.value?.record_date || homeData.value?.record_date || new Date().toISOString().slice(0, 10),
      idempotency_key: createIdempotencyKey('child_web_task')
    })
    setSuccess('任务已提交，等家长确认一下就会更新。')
    await loadCurrentSection()
  } catch (error) {
    errorMessage.value = String((error as { message?: string })?.message || '提交任务失败')
  } finally {
    actionBusy.value = false
  }
}

async function handleSubmitRewardRequest(): Promise<void> {
  if (actionBusy.value) {
    return
  }

  const title = rewardForm.value.title.trim()
  if (!title) {
    errorMessage.value = '先写一个想申请的奖励名字吧。'
    return
  }

  actionBusy.value = true
  resetMessages()

  try {
    const session = await ensureChildPortalSession()
    if (!session?.webSessionToken) {
      throw new Error('当前会话已经失效，请重新打开专属链接。')
    }

    await submitChildRewardRequest(session.webSessionToken, {
      title,
      description: rewardForm.value.description.trim(),
      reward_type: 'physical',
      idempotency_key: createIdempotencyKey('child_web_reward')
    })

    rewardForm.value = {
      title: '',
      description: ''
    }
    setSuccess('愿望已经提交给家长啦。')
    await loadCurrentSection()
  } catch (error) {
    errorMessage.value = String((error as { message?: string })?.message || '提交愿望失败')
  } finally {
    actionBusy.value = false
  }
}

async function reopenPortalLink(): Promise<void> {
  const token = childPortalSession.value?.lastPortalToken
  if (!token) {
    return
  }

  await router.replace(`/child/portal/${encodeURIComponent(token)}`)
}

onMounted(() => {
  void loadCurrentSection()
})

watch(
  () => section.value,
  () => {
    void loadCurrentSection()
  }
)
</script>

<template>
  <div class="child-portal">
    <header class="portal-hero">
      <div class="hero-copy">
        <p class="hero-kicker">成长小站</p>
        <h1>{{ childProfile.name || childProfile.nickname || '小朋友' }}，欢迎回来</h1>
        <p class="hero-desc">
          这里会显示你今天的任务、积分和奖励进度。
        </p>
      </div>
      <div class="hero-stat">
        <span class="hero-stat__label">当前积分</span>
        <strong>{{ currentPoints }}</strong>
        <span class="hero-stat__hint">{{ portalExpiryText }}</span>
      </div>
    </header>

    <nav class="portal-tabs" aria-label="儿童入口导航">
      <button
        v-for="item in navItems"
        :key="item.key"
        type="button"
        class="portal-tab"
        :class="{ 'portal-tab--active': section === item.key }"
        @click="router.push(item.to)"
      >
        {{ item.label }}
      </button>
    </nav>

    <div v-if="errorMessage" class="portal-banner portal-banner--error">
      <span>{{ errorMessage }}</span>
      <button v-if="canRetryWithPortalLink" type="button" @click="reopenPortalLink">重新打开专属链接</button>
    </div>
    <div v-if="successMessage" class="portal-banner portal-banner--success">
      <span>{{ successMessage }}</span>
    </div>

    <section v-if="loading" class="portal-panel portal-loading">
      正在加载最新内容……
    </section>

    <template v-else>
      <section v-if="section === 'home'" class="portal-grid">
        <article class="portal-panel portal-summary">
          <h2>今日概览</h2>
          <div class="summary-grid">
            <div>
              <span>进行中任务</span>
              <strong>{{ homeData?.today_active_count || 0 }}</strong>
            </div>
            <div>
              <span>待确认任务</span>
              <strong>{{ homeData?.today_pending_count || 0 }}</strong>
            </div>
            <div>
              <span>已完成任务</span>
              <strong>{{ homeData?.today_completed_count || 0 }}</strong>
            </div>
            <div>
              <span>待处理愿望</span>
              <strong>{{ homeData?.pending_reward_request_count || 0 }}</strong>
            </div>
          </div>
        </article>

        <article class="portal-panel">
          <div class="panel-head">
            <h2>今天的任务</h2>
            <button type="button" class="text-link" @click="router.push('/child/tasks')">查看全部</button>
          </div>
          <ul v-if="homeData?.today_tasks?.length" class="item-list">
            <li v-for="item in homeData.today_tasks" :key="item.task_id" class="item-card">
              <div>
                <strong>{{ item.title }}</strong>
                <p>{{ item.description || '完成后就能累计成长积分。' }}</p>
              </div>
              <span class="pill" :class="`pill--${item.type || 'active'}`">
                {{ item.type === 'completed' ? '已完成' : item.type === 'pending' ? '待确认' : '进行中' }}
              </span>
            </li>
          </ul>
          <p v-else class="empty-copy">今天暂时没有任务，去放松一下也不错。</p>
        </article>
      </section>

      <section v-else-if="section === 'tasks'" class="portal-grid portal-grid--stack">
        <article class="portal-panel">
          <div class="panel-head">
            <h2>进行中的任务</h2>
            <span>{{ tasksData?.record_date || '今天' }}</span>
          </div>
          <ul v-if="tasksData?.active_tasks?.length" class="item-list">
            <li v-for="item in tasksData.active_tasks" :key="item.task_id" class="item-card item-card--action">
              <div>
                <strong>{{ item.title }}</strong>
                <p>{{ item.description || '完成后记得来这里提交。' }}</p>
                <small>{{ formatPoints(item.points) }}</small>
              </div>
              <button type="button" class="primary-btn" :disabled="actionBusy" @click="handleCompleteTask(item.task_id)">
                标记完成
              </button>
            </li>
          </ul>
          <p v-else class="empty-copy">今天的进行中任务已经清空啦。</p>
        </article>

        <article class="portal-panel">
          <h2>等待家长确认</h2>
          <ul v-if="tasksData?.pending_tasks?.length" class="item-list">
            <li v-for="item in tasksData.pending_tasks" :key="item.task_id" class="item-card">
              <div>
                <strong>{{ item.title }}</strong>
                <p>已经提交，等家长看一眼就好。</p>
              </div>
              <span class="pill pill--pending">待确认</span>
            </li>
          </ul>
          <p v-else class="empty-copy">目前没有待确认任务。</p>
        </article>

        <article class="portal-panel">
          <h2>已经完成</h2>
          <ul v-if="tasksData?.completed_tasks?.length" class="item-list">
            <li v-for="item in tasksData.completed_tasks" :key="item.task_id" class="item-card">
              <div>
                <strong>{{ item.title }}</strong>
                <p>做得很好，继续保持。</p>
              </div>
              <span class="pill pill--completed">已完成</span>
            </li>
          </ul>
          <p v-else class="empty-copy">完成的任务会显示在这里。</p>
        </article>
      </section>

      <section v-else-if="section === 'rewards'" class="portal-grid">
        <article class="portal-panel">
          <h2>可以努力兑换的奖励</h2>
          <ul v-if="rewardsData?.rewards?.length" class="item-list">
            <li v-for="item in rewardsData.rewards" :key="item.reward_id" class="item-card">
              <div>
                <strong>{{ item.title }}</strong>
                <p>{{ item.reward_type || '奖励' }}</p>
              </div>
              <span class="pill pill--reward">{{ formatPoints(item.cost_points) }}</span>
            </li>
          </ul>
          <p v-else class="empty-copy">家长还没有放入奖励，先完成任务攒积分吧。</p>
        </article>

        <article class="portal-panel">
          <div class="panel-head">
            <h2>提交一个新愿望</h2>
            <span>家长确认后会加入奖励池</span>
          </div>
          <form class="reward-form" @submit.prevent="handleSubmitRewardRequest">
            <label>
              <span>愿望名称</span>
              <input v-model="rewardForm.title" maxlength="30" placeholder="比如：去动物园" />
            </label>
            <label>
              <span>补充说明</span>
              <textarea
                v-model="rewardForm.description"
                maxlength="120"
                rows="4"
                placeholder="可以写上你为什么想要它"
              />
            </label>
            <button type="submit" class="primary-btn" :disabled="actionBusy">提交给家长</button>
          </form>
        </article>

        <article class="portal-panel">
          <h2>最近的愿望申请</h2>
          <ul v-if="rewardsData?.request_history?.length" class="item-list">
            <li v-for="item in rewardsData.request_history" :key="item.request_id" class="item-card">
              <div>
                <strong>{{ item.title }}</strong>
                <p>{{ item.review_remark || '等待家长查看' }}</p>
              </div>
              <span class="pill" :class="`pill--${item.status || 'pending'}`">
                {{ item.status === 'approved' ? '已通过' : item.status === 'rejected' ? '已拒绝' : '等待中' }}
              </span>
            </li>
          </ul>
          <p v-else class="empty-copy">提交过的愿望会显示在这里。</p>
        </article>
      </section>

      <section v-else class="portal-grid portal-grid--stack">
        <article class="portal-panel portal-summary">
          <h2>积分总览</h2>
          <div class="summary-grid">
            <div>
              <span>当前积分</span>
              <strong>{{ pointsData?.current_points || 0 }}</strong>
            </div>
            <div>
              <span>累计获得</span>
              <strong>{{ pointsData?.total_points_earned || 0 }}</strong>
            </div>
            <div>
              <span>累计花费</span>
              <strong>{{ pointsData?.total_points_spent || 0 }}</strong>
            </div>
          </div>
        </article>

        <article class="portal-panel">
          <h2>积分记录</h2>
          <ul v-if="pointsData?.list?.length" class="item-list">
            <li
              v-for="(item, index) in pointsData.list"
              :key="item.ledger_id || `${item.record_date || 'record'}-${index}`"
              class="item-card"
            >
              <div>
                <strong>{{ item.remark || item.biz_type || '积分变动' }}</strong>
                <p>{{ item.record_date || formatDateTime(item.created_at) }}</p>
              </div>
              <span class="pill" :class="item.change_type === 'decrease' ? 'pill--rejected' : 'pill--completed'">
                {{ item.change_type === 'decrease' ? '-' : '+' }}{{ Number(item.amount) || 0 }}
              </span>
            </li>
          </ul>
          <p v-else class="empty-copy">积分变化会一条条记在这里。</p>
        </article>
      </section>
    </template>
  </div>
</template>

<style scoped lang="scss">
.child-portal {
  min-height: 100vh;
  padding: clamp(18px, 3vw, 34px);
  background:
    radial-gradient(circle at top left, rgba(255, 205, 123, 0.28), transparent 24%),
    radial-gradient(circle at top right, rgba(100, 182, 255, 0.2), transparent 28%),
    linear-gradient(180deg, #fffaf1 0%, #f4f8ff 100%);
  color: #24364c;
}

.portal-hero {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: stretch;
  margin: 0 auto 18px;
  max-width: 1120px;
  padding: clamp(22px, 4vw, 34px);
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(230, 181, 84, 0.24);
  box-shadow: 0 18px 42px rgba(58, 90, 132, 0.08);
}

.hero-copy {
  h1 {
    margin: 8px 0 10px;
    font-size: clamp(32px, 5vw, 52px);
    line-height: 1.02;
  }
}

.hero-kicker {
  margin: 0;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #db8a00;
}

.hero-desc {
  margin: 0;
  max-width: 52ch;
  font-size: 16px;
  line-height: 1.7;
  color: #52647b;
}

.hero-stat {
  min-width: 200px;
  padding: 18px 20px;
  border-radius: 24px;
  background: linear-gradient(160deg, #203f66 0%, #325f9c 100%);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;

  strong {
    font-size: clamp(34px, 5vw, 48px);
    line-height: 1;
    margin: 8px 0;
  }
}

.hero-stat__label,
.hero-stat__hint {
  font-size: 13px;
  opacity: 0.88;
}

.portal-tabs,
.portal-banner,
.portal-grid,
.portal-loading {
  max-width: 1120px;
  margin-inline: auto;
}

.portal-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.portal-tab {
  border: none;
  border-radius: 999px;
  padding: 12px 18px;
  background: rgba(255, 255, 255, 0.86);
  color: #44607c;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 10px 22px rgba(70, 97, 132, 0.08);
}

.portal-tab--active {
  background: linear-gradient(135deg, #ffbf66 0%, #ff8a5c 100%);
  color: white;
}

.portal-banner {
  margin-bottom: 16px;
  padding: 14px 16px;
  border-radius: 18px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;

  button {
    border: none;
    border-radius: 999px;
    padding: 10px 14px;
    background: rgba(36, 54, 76, 0.08);
    color: inherit;
    cursor: pointer;
    font-weight: 700;
  }
}

.portal-banner--error {
  background: #fff1ec;
  color: #a14734;
}

.portal-banner--success {
  background: #edf9ef;
  color: #2d6b3b;
}

.portal-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.portal-grid--stack {
  grid-template-columns: 1fr;
}

.portal-panel {
  padding: 20px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(214, 225, 240, 0.8);
  box-shadow: 0 18px 36px rgba(76, 104, 137, 0.08);

  h2 {
    margin: 0 0 16px;
    font-size: 22px;
    color: #22364e;
  }
}

.portal-summary {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(244, 248, 255, 0.9) 100%);
}

.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 14px;

  h2 {
    margin: 0;
  }

  span {
    font-size: 13px;
    color: #67809f;
  }
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;

  div {
    padding: 16px;
    border-radius: 20px;
    background: rgba(244, 247, 252, 0.96);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  span {
    font-size: 13px;
    color: #5f7591;
  }

  strong {
    font-size: 28px;
    line-height: 1;
    color: #203751;
  }
}

.item-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 12px;
}

.item-card {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  padding: 16px;
  border-radius: 20px;
  background: rgba(246, 249, 255, 0.92);

  strong {
    display: block;
    margin-bottom: 6px;
    font-size: 17px;
    color: #203751;
  }

  p,
  small {
    margin: 0;
    color: #60748d;
    line-height: 1.6;
  }
}

.item-card--action {
  align-items: flex-start;
}

.pill {
  flex-shrink: 0;
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 700;
  background: #eef3ff;
  color: #39557a;
}

.pill--active {
  background: #fff4d8;
  color: #a06300;
}

.pill--pending {
  background: #eef4ff;
  color: #4168a4;
}

.pill--completed {
  background: #eaf8ed;
  color: #2f7b47;
}

.pill--reward {
  background: #f7ecff;
  color: #7d4fb2;
}

.pill--approved {
  background: #eaf8ed;
  color: #2f7b47;
}

.pill--rejected {
  background: #fff0ec;
  color: #a14734;
}

.primary-btn,
.text-link {
  border: none;
  cursor: pointer;
  font-weight: 700;
}

.primary-btn {
  border-radius: 999px;
  padding: 12px 18px;
  background: linear-gradient(135deg, #ffba5c 0%, #ff855c 100%);
  color: white;
}

.primary-btn:disabled {
  cursor: default;
  opacity: 0.6;
}

.text-link {
  background: transparent;
  color: #3465a4;
}

.reward-form {
  display: grid;
  gap: 14px;

  label {
    display: grid;
    gap: 8px;
    font-weight: 700;
    color: #344d69;
  }

  input,
  textarea {
    width: 100%;
    border: 1px solid rgba(172, 192, 221, 0.9);
    border-radius: 18px;
    padding: 12px 14px;
    font: inherit;
    color: #21364d;
    background: white;
    resize: vertical;
  }
}

.empty-copy {
  margin: 0;
  color: #71859e;
  line-height: 1.7;
}

.portal-loading {
  text-align: center;
  font-size: 16px;
  color: #5f7591;
}

@media (max-width: 840px) {
  .portal-hero {
    flex-direction: column;
  }

  .hero-stat {
    min-width: 0;
  }

  .portal-grid {
    grid-template-columns: 1fr;
  }
}
</style>
