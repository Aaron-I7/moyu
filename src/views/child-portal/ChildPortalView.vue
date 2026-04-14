<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  confirmChildRewardFulfillment,
  fetchChildHome,
  fetchChildPoints,
  fetchChildRewards,
  fetchChildTasks,
  submitChildRewardRedemption,
  submitChildRewardRequest,
  submitChildTask
} from '@/features/child-portal/client'
import ChildPortalDashboard from '@/features/child-portal/components/ChildPortalDashboard.vue'
import ChildPortalPointsTimeline from '@/features/child-portal/components/ChildPortalPointsTimeline.vue'
import ChildPortalRewardStore from '@/features/child-portal/components/ChildPortalRewardStore.vue'
import ChildPortalShell from '@/features/child-portal/components/ChildPortalShell.vue'
import ChildPortalTaskBoard from '@/features/child-portal/components/ChildPortalTaskBoard.vue'
import { createIdempotencyKey, formatExpiry } from '@/features/child-portal/format'
import { getLevelProgress } from '@/features/child-portal/helpers'
import {
  clearChildPortalSession,
  ensureChildPortalSession,
  updateChildPortalProfile,
  useChildPortalSession
} from '@/features/child-portal/session'
import type {
  ChildHomeResponse,
  ChildPointsResponse,
  ChildProfile,
  ChildRewardsResponse,
  ChildTaskItem,
  ChildTasksResponse,
  PortalSection
} from '@/features/child-portal/types'

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
  {
    key: 'home',
    label: '首页',
    shortLabel: '仪表盘',
    to: '/child/home',
    icon: 'ph:house-line-fill',
    accent: '#ffbf5c'
  },
  {
    key: 'tasks',
    label: '任务',
    shortLabel: '看板',
    to: '/child/tasks',
    icon: 'ph:rocket-launch-fill',
    accent: '#f7943d'
  },
  {
    key: 'rewards',
    label: '奖励',
    shortLabel: '宝藏',
    to: '/child/rewards',
    icon: 'ph:gift-fill',
    accent: '#68c8ff'
  },
  {
    key: 'points',
    label: '积分',
    shortLabel: '星星账本',
    to: '/child/points',
    icon: 'ph:coins-fill',
    accent: '#7fd36b'
  },
  {
    key: 'growth-stats',
    label: '成长统计',
    shortLabel: '图表舱',
    to: '/child/growth-stats',
    icon: 'ph:chart-line-up-fill',
    accent: '#0f766e'
  }
] as const

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
const levelProgress = computed(() => getLevelProgress({
  ...childProfile.value,
  current_points: currentPoints.value
}))

const overview = computed(() => ({
  activeCount: tasksData.value?.active_tasks?.length ?? homeData.value?.today_active_count ?? 0,
  pendingCount: tasksData.value?.pending_tasks?.length ?? homeData.value?.today_pending_count ?? 0,
  completedCount: tasksData.value?.completed_tasks?.length ?? homeData.value?.today_completed_count ?? 0,
  pendingRewardCount: homeData.value?.pending_reward_request_count ?? rewardsData.value?.request_history?.filter(item => item.status === 'pending').length ?? 0
}))

function setSuccess(message = ''): void {
  successMessage.value = message
}

function resetMessages(): void {
  errorMessage.value = ''
  successMessage.value = ''
}

function cloneTaskItem(task: ChildTaskItem): ChildTaskItem {
  return { ...task }
}

function cloneHomeResponse(data: ChildHomeResponse | null): ChildHomeResponse | null {
  if (!data) {
    return null
  }

  return {
    ...data,
    today_tasks: data.today_tasks.map(cloneTaskItem)
  }
}

function cloneTasksResponse(data: ChildTasksResponse | null): ChildTasksResponse | null {
  if (!data) {
    return null
  }

  return {
    ...data,
    active_tasks: data.active_tasks.map(cloneTaskItem),
    pending_tasks: data.pending_tasks.map(cloneTaskItem),
    completed_tasks: data.completed_tasks.map(cloneTaskItem)
  }
}

function applyOptimisticTaskPending(taskId: string, submittedAt: number): boolean {
  let changed = false

  if (homeData.value) {
    const nextTasks = homeData.value.today_tasks.map((task) => {
      if (task.task_id !== taskId || task.type !== 'active') {
        return task
      }

      changed = true
      const nextTask: ChildTaskItem = {
        ...task,
        type: 'pending',
        submitted_at: submittedAt
      }

      return nextTask
    })

    if (changed) {
      homeData.value = {
        ...homeData.value,
        today_tasks: nextTasks,
        today_active_count: Math.max(0, homeData.value.today_active_count - 1),
        today_pending_count: homeData.value.today_pending_count + 1
      }
    }
  }

  if (tasksData.value) {
    const taskIndex = tasksData.value.active_tasks.findIndex((task) => task.task_id === taskId)
    if (taskIndex > -1) {
      const task = tasksData.value.active_tasks[taskIndex]
      if (task) {
        const nextPendingTask: ChildTaskItem = {
          ...task,
          type: 'pending',
          submitted_at: submittedAt
        }

        tasksData.value = {
          ...tasksData.value,
          active_tasks: tasksData.value.active_tasks.filter((item) => item.task_id !== taskId),
          pending_tasks: [...tasksData.value.pending_tasks, nextPendingTask]
        }
        changed = true
      }
    }
  }

  return changed
}

function syncChildProfile(profile: ChildProfile): void {
  updateChildPortalProfile(profile)
}

async function loadDashboard(webSessionToken: string): Promise<void> {
  const [nextHome, nextRewards, nextPoints] = await Promise.all([
    fetchChildHome(webSessionToken),
    fetchChildRewards(webSessionToken),
    fetchChildPoints(webSessionToken)
  ])

  homeData.value = nextHome
  rewardsData.value = nextRewards
  pointsData.value = nextPoints
  syncChildProfile(nextHome.child_profile)
}

async function loadCurrentSection(showLoading = true): Promise<void> {
  if (showLoading) loading.value = true
  resetMessages()

  try {
    const session = await ensureChildPortalSession()
    if (!session?.webSessionToken) {
      errorMessage.value = '当前浏览器里没有可用会话，请重新打开家长发给你的专属链接。'
      if (showLoading) loading.value = false
      return
    }

    if (section.value === 'home') {
      await loadDashboard(session.webSessionToken)
    } else if (section.value === 'tasks') {
      tasksData.value = await fetchChildTasks(session.webSessionToken)
      syncChildProfile(tasksData.value.child_profile)
    } else if (section.value === 'rewards') {
      rewardsData.value = await fetchChildRewards(session.webSessionToken)
      syncChildProfile(rewardsData.value.child_profile)
    } else {
      pointsData.value = await fetchChildPoints(session.webSessionToken)
      syncChildProfile(pointsData.value.child_profile)
    }
  } catch (error) {
    const message = String((error as { message?: string })?.message || '加载失败')
    errorMessage.value = message
    if (message.includes('session') || message.includes('Portal link') || message.includes('失效')) {
      clearChildPortalSession()
    }
  } finally {
    if (showLoading) loading.value = false
  }
}

async function handleCompleteTask(taskId: string): Promise<void> {
  if (actionBusy.value) {
    return
  }

  actionBusy.value = true
  resetMessages()
  const previousHome = cloneHomeResponse(homeData.value)
  const previousTasks = cloneTasksResponse(tasksData.value)
  const submittedAt = Date.now()
  const appliedOptimisticUpdate = applyOptimisticTaskPending(taskId, submittedAt)

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
    await loadCurrentSection(false) // 局部刷新
  } catch (error) {
    if (appliedOptimisticUpdate) {
      homeData.value = previousHome
      tasksData.value = previousTasks
    }
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
    await loadCurrentSection(false) // 局部刷新
  } catch (error) {
    errorMessage.value = String((error as { message?: string })?.message || '提交愿望失败')
  } finally {
    actionBusy.value = false
  }
}

async function handleRedeemReward(rewardId: string): Promise<void> {
  if (actionBusy.value) return
  actionBusy.value = true
  // 注意这里不调用 resetMessages()，让错误和成功由子组件Dashboard的弹窗自行处理
  // 或者通过事件抛回具体的提示。为了保持你的要求，我们这里不向父组件顶部抛出成功或错误提示。
  
  try {
    const session = await ensureChildPortalSession()
    if (!session?.webSessionToken) {
      throw new Error('当前会话已经失效，请重新打开专属链接。')
    }

    await submitChildRewardRedemption(session.webSessionToken, {
      reward_id: rewardId,
      idempotency_key: createIdempotencyKey('child_web_reward_redeem')
    })

    await loadCurrentSection(false) // 局部刷新
    return Promise.resolve() // 成功
  } catch (error) {
    const errorMsg = String((error as { message?: string })?.message || '兑换失败')
    return Promise.reject(new Error(errorMsg)) // 把错误抛给弹窗
  } finally {
    actionBusy.value = false
  }
}

async function handleConfirmRewardUsage(requestId: string): Promise<void> {
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

    await confirmChildRewardFulfillment(session.webSessionToken, {
      request_id: requestId
    })

    setSuccess('这份奖励已经放进已使用里啦。')
    await loadCurrentSection(false)
  } catch (error) {
    errorMessage.value = String((error as { message?: string })?.message || '更新奖励状态失败')
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

async function navigateToPath(path: string): Promise<void> {
  await router.push(path)
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
  <ChildPortalShell
    :can-retry-with-portal-link="canRetryWithPortalLink"
    :child-profile="childProfile"
    :current-points="currentPoints"
    :error-message="errorMessage"
    :level-progress="levelProgress"
    :nav-items="navItems"
    :overview="overview"
    :portal-expiry-text="portalExpiryText"
    :section="section"
    :success-message="successMessage"
    @navigate="navigateToPath"
    @retry="reopenPortalLink"
  >
    <section v-if="loading" class="portal-loading">
      <div class="portal-loading__orb" />
      <p>加载中</p>
    </section>

    <ChildPortalDashboard
      v-else-if="section === 'home'"
      :action-busy="actionBusy"
      :current-points="currentPoints"
      :home-data="homeData"
      :points-data="pointsData"
      :rewards-data="rewardsData"
      @navigate="(nextSection) => navigateToPath(`/child/${nextSection}`)"
      @complete="handleCompleteTask"
      @redeem="(rewardId, cb) => handleRedeemReward(rewardId).then(cb.onSuccess).catch((e) => cb.onError(e.message))"
    />

    <ChildPortalTaskBoard
      v-else-if="section === 'tasks'"
      :action-busy="actionBusy"
      :record-date="tasksData?.record_date || homeData?.record_date || '今天'"
      :tasks-data="tasksData"
      @complete="handleCompleteTask"
    />

    <ChildPortalRewardStore
      v-else-if="section === 'rewards'"
      :action-busy="actionBusy"
      :current-points="currentPoints"
      :description="rewardForm.description"
      :rewards-data="rewardsData"
      :title="rewardForm.title"
      @mark-used="handleConfirmRewardUsage"
      @redeem="(rewardId, cb) => handleRedeemReward(rewardId).then(cb.onSuccess).catch((e) => cb.onError(e.message))"
      @submit="handleSubmitRewardRequest"
      @update:description="rewardForm.description = $event"
      @update:title="rewardForm.title = $event"
    />

    <ChildPortalPointsTimeline
      v-else
      :points-data="pointsData"
    />
  </ChildPortalShell>
</template>

<style scoped lang="scss">
.portal-loading {
  min-height: 360px;
  display: grid;
  place-items: center;
  gap: 18px;
  padding: 28px;
  border-radius: 30px;
  border: 1px solid rgba(95, 143, 204, 0.14);
  background:
    radial-gradient(circle at top, rgba(255, 223, 156, 0.34), transparent 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.88) 0%, rgba(247, 251, 255, 0.84) 100%);
  box-shadow: 0 24px 48px rgba(68, 98, 134, 0.08);
  text-align: center;

  p {
    margin: 0;
    color: #5f7591;
    font-size: 16px;
    line-height: 1.7;
  }
}

.portal-loading__orb {
  width: 78px;
  height: 78px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.9), transparent 24%),
    linear-gradient(135deg, #ffd06f 0%, #65c3ff 52%, #78d66c 100%);
  box-shadow: 0 18px 36px rgba(83, 119, 159, 0.18);
  animation: portalBob 1.2s ease-in-out infinite alternate;
}

@keyframes portalBob {
  from {
    transform: translateY(-4px) scale(1);
  }
  to {
    transform: translateY(6px) scale(1.04);
  }
}
</style>
