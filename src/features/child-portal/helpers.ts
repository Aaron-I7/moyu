import { formatDateTime, formatPoints } from './format'
import type {
  ChildHomeResponse,
  ChildLevelProgress,
  ChildPointsLedgerEntry,
  ChildPointsResponse,
  ChildPortalOverview,
  ChildPortalTimelineItem,
  ChildProfile,
  ChildRewardRequestItem,
  ChildRewardItem,
  ChildRewardsResponse,
  ChildTaskItem
} from './types'

const LEVEL_META_MAP = {
  star_1: { label: '青铜冒险家', title: '启程中', min: 0, max: 120, badge: 'I' },
  star_2: { label: '白银探索者', title: '前进中', min: 120, max: 300, badge: 'II' },
  star_3: { label: '黄金挑战者', title: '发光中', min: 300, max: 500, badge: 'III' },
  star_4: { label: '钻石领航员', title: '冲刺中', min: 500, max: 800, badge: 'IV' },
  star_5: { label: '传奇守护者', title: '闪耀中', min: 800, max: 1200, badge: 'V' }
} as const

function toTimestamp(value?: number | string): number {
  if (!value) {
    return 0
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 0
  }

  return date.getTime()
}

export function getLevelMeta(levelCode?: string) {
  return LEVEL_META_MAP[levelCode as keyof typeof LEVEL_META_MAP] || LEVEL_META_MAP.star_1
}

export function getLevelProgress(profile: Partial<ChildProfile>): ChildLevelProgress {
  const points = Number(profile.current_points) || 0
  const meta = getLevelMeta(profile.level_code)
  const span = Math.max(meta.max - meta.min, 1)
  const clamped = Math.min(Math.max(points - meta.min, 0), span)

  return {
    ...meta,
    points,
    percent: Math.round((clamped / span) * 100),
    pointsToNext: Math.max(meta.max - points, 0)
  }
}

export function getDisplayName(profile: Partial<ChildProfile>) {
  return profile.name || profile.nickname || '小朋友'
}

export function getAdventureHeadline(profile: Partial<ChildProfile>, overview: ChildPortalOverview) {
  const displayName = getDisplayName(profile)
  const total = overview.activeCount + overview.pendingCount + overview.completedCount

  if (total === 0) {
    return `${displayName} 的地图刚刚亮起`
  }

  if (overview.completedCount > 0) {
    return `${overview.completedCount} 个节点已点亮`
  }

  if (overview.pendingCount > 0) {
    return `${overview.pendingCount} 个节点等待确认`
  }

  return `${overview.activeCount} 个节点正在路上`
}

export function getTaskStatusLabel(type?: string) {
  if (type === 'completed') return '已完成'
  if (type === 'pending') return '待确认'
  return '进行中'
}

export function getTaskStatusTone(type?: string) {
  if (type === 'completed') return 'mint'
  if (type === 'pending') return 'sky'
  return 'amber'
}

export function getTaskVisualIcon(type?: string) {
  if (type === 'completed') return 'ph:seal-check-fill'
  if (type === 'pending') return 'ph:hourglass-medium-fill'
  return 'ph:rocket-launch-fill'
}

export function getTaskStatusDescription(task: ChildTaskItem) {
  if (task.type === 'completed') {
    return '已点亮'
  }

  if (task.type === 'pending') {
    return '等待确认'
  }

  if (task.auto_confirm_completion) {
    return '自动计分'
  }

  return '去完成'
}

export function getTaskCategoryLabel(category?: string) {
  if (category === 'social_character') return '社交品格'
  if (category === 'special_reward') return '特别挑战'
  return '日常习惯'
}

export function sortTaskFocus(tasks: ChildTaskItem[] = []) {
  const weightMap = {
    active: 0,
    pending: 1,
    completed: 2
  } as const

  return [...tasks].sort((left, right) => {
    const leftWeight = weightMap[(left.type || 'active') as keyof typeof weightMap] ?? 9
    const rightWeight = weightMap[(right.type || 'active') as keyof typeof weightMap] ?? 9
    if (leftWeight !== rightWeight) {
      return leftWeight - rightWeight
    }

    return (Number(right.points) || 0) - (Number(left.points) || 0)
  })
}

export function getRewardGap(reward: ChildRewardItem, currentPoints = 0) {
  return Math.max((Number(reward.cost_points) || 0) - currentPoints, 0)
}

export function sortRewardsForDisplay(rewards: ChildRewardItem[] = [], currentPoints = 0) {
  return [...rewards].sort((left, right) => {
    const leftGap = getRewardGap(left, currentPoints)
    const rightGap = getRewardGap(right, currentPoints)
    if (leftGap !== rightGap) {
      return leftGap - rightGap
    }

    return (Number(left.cost_points) || 0) - (Number(right.cost_points) || 0)
  })
}

export function getRewardAccent(rewardType?: string) {
  if (rewardType === 'privilege') return 'sky'
  if (rewardType === 'companion') return 'mint'
  return 'rose'
}

export function getRewardTypeLabel(rewardType?: string) {
  if (rewardType === 'privilege') return '特权'
  if (rewardType === 'companion') return '陪伴'
  return '心愿'
}

export function getRewardVisualIcon(rewardType?: string) {
  if (rewardType === 'privilege') return 'ph:crown-simple-fill'
  if (rewardType === 'companion') return 'ph:hand-heart-fill'
  return 'ph:gift-fill'
}

export function getRewardRequestStatusLabel(status?: string) {
  if (status === 'approved') return '待使用'
  if (status === 'rejected') return '未通过'
  if (status === 'fulfilled') return '已使用'
  return '等待中'
}

export function getRewardRequestTone(status?: string) {
  if (status === 'approved') return 'mint'
  if (status === 'rejected') return 'rose'
  if (status === 'fulfilled') return 'amber'
  return 'sky'
}

export function getRewardRequestIcon(status?: string) {
  if (status === 'approved') return 'ph:seal-check-fill'
  if (status === 'rejected') return 'ph:seal-warning-fill'
  if (status === 'fulfilled') return 'ph:check-circle-fill'
  return 'ph:paper-plane-tilt-fill'
}

export function getRewardRequestSummary(item: ChildRewardRequestItem) {
  if (item.status === 'fulfilled') {
    return '已使用'
  }

  if (item.review_remark) {
    return item.review_remark
  }

  if (item.status === 'approved' && item.approved_cost_points !== undefined) {
    return `待使用 · ${formatPoints(item.approved_cost_points)}`
  }

  if (item.status === 'rejected') {
    return '未通过'
  }

  return '等待回应'
}

export function getLedgerTitle(entry: ChildPointsLedgerEntry) {
  if (entry.remark) {
    return entry.remark
  }

  if (entry.biz_type === 'reward_redeem') {
    return '兑换奖励'
  }

  if (entry.biz_type === 'manual_adjust') {
    return '家长调整'
  }

  return entry.change_type === 'decrease' ? '积分支出' : '积分收入'
}

export function getLedgerSummary(entry: ChildPointsLedgerEntry) {
  const timeText = entry.record_date || formatDateTime(entry.created_at)
  const balanceText = entry.balance_after === undefined
    ? ''
    : `余额 ${formatPoints(entry.balance_after)}`

  return balanceText ? `${timeText} · ${balanceText}` : timeText
}

export function getLedgerTone(entry: ChildPointsLedgerEntry) {
  return entry.change_type === 'decrease' ? 'rose' : 'mint'
}

export function getLedgerIcon(entry: ChildPointsLedgerEntry) {
  if (entry.biz_type === 'reward_redeem') return 'ph:treasure-chest-fill'
  if (entry.biz_type === 'manual_adjust') return 'ph:wrench-fill'
  return entry.change_type === 'decrease' ? 'ph:shooting-star-fill' : 'ph:star-four-fill'
}

export function getLedgerAmountText(entry: ChildPointsLedgerEntry) {
  return `${entry.change_type === 'decrease' ? '-' : '+'}${Number(entry.amount) || 0}`
}

export function buildHomeTimeline(
  homeData: ChildHomeResponse | null,
  rewardsData: ChildRewardsResponse | null,
  pointsData: ChildPointsResponse | null
): ChildPortalTimelineItem[] {
  const items: ChildPortalTimelineItem[] = []

  ;(homeData?.today_tasks || []).forEach((task) => {
    const time = toTimestamp(task.completed_at || task.submitted_at)
    if (!time || task.type === 'active') {
      return
    }

    items.push({
      id: `task-${task.task_id}-${task.type || 'active'}`,
      icon: getTaskVisualIcon(task.type),
      title: task.title,
      subtitle: getTaskStatusLabel(task.type),
      tone: getTaskStatusTone(task.type) as ChildPortalTimelineItem['tone'],
      time,
      timeText: formatDateTime(time),
      amountText: task.points ? formatPoints(task.points) : undefined
    })
  })

  ;(rewardsData?.request_history || []).forEach((item) => {
    const time = toTimestamp(item.requested_at)
    items.push({
      id: `reward-${item.request_id}`,
      icon: getRewardRequestIcon(item.status),
      title: item.title,
      subtitle: getRewardRequestSummary(item),
      tone: getRewardRequestTone(item.status) as ChildPortalTimelineItem['tone'],
      time,
      timeText: formatDateTime(time || undefined),
      amountText: item.approved_cost_points !== undefined
        ? formatPoints(item.approved_cost_points)
        : item.suggested_points !== undefined
          ? formatPoints(item.suggested_points)
          : undefined
    })
  })

  ;(pointsData?.list || []).forEach((entry, index) => {
    const time = toTimestamp(entry.created_at || entry.record_date)
    items.push({
      id: entry.ledger_id || `points-${index}`,
      icon: getLedgerIcon(entry),
      title: getLedgerTitle(entry),
      subtitle: getLedgerSummary(entry),
      tone: getLedgerTone(entry) as ChildPortalTimelineItem['tone'],
      time,
      timeText: formatDateTime(time || undefined),
      amountText: getLedgerAmountText(entry)
    })
  })

  return items.sort((left, right) => right.time - left.time)
}
