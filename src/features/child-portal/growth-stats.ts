import type {
  ChildGrowthAdviceCard,
  ChildGrowthAdviceResponse,
  ChildGrowthCategoryRiskItem,
  ChildGrowthDigest,
  ChildGrowthRange,
  ChildGrowthRewardStatusItem,
  ChildGrowthStatsResponse,
  ChildGrowthStatsViewModel,
  ChildGrowthSummarySignal,
  ChildHomeResponse,
  ChildPointsLedgerEntry,
  ChildPointsResponse,
  ChildPortalStoredSession,
  ChildRewardsResponse,
  ChildTasksResponse
} from '@/features/child-portal/types'

const DAY_MS = 24 * 60 * 60 * 1000

const GROWTH_RANGE_META = {
  '7d': { days: 7, bucketCount: 7, bucketMode: 'day' },
  '30d': { days: 30, bucketCount: 30, bucketMode: 'day' },
  '90d': { days: 90, bucketCount: 13, bucketMode: 'week' }
} as const

const REQUEST_STATUS_META = {
  pending: { label: '等待中', tone: 'sky' },
  approved: { label: '待使用', tone: 'mint' },
  rejected: { label: '未通过', tone: 'rose' },
  fulfilled: { label: '已使用', tone: 'amber' }
} as const

const TREND_LABELS: Record<'up' | 'flat' | 'down', string> = {
  up: '回升中',
  flat: '持平中',
  down: '放缓中'
}

type GrowthBucket = {
  bucket_key: string
  end_at: number
  label: string
  start_at: number
}

export const GROWTH_RANGE_OPTIONS: Array<{ label: string; value: ChildGrowthRange }> = [
  { label: '7天', value: '7d' },
  { label: '30天', value: '30d' },
  { label: '90天', value: '90d' }
]

export const PRIORITY_LABELS: Record<ChildGrowthAdviceCard['priority'], string> = {
  high: '高优先级',
  medium: '中优先级',
  low: '轻提醒'
}

export const PRIORITY_TONES: Record<ChildGrowthAdviceCard['priority'], string> = {
  high: 'rose',
  medium: 'amber',
  low: 'sky'
}

export function getGrowthStatusLabel(item: ChildGrowthRewardStatusItem) {
  return item.label || item.key || '未命名'
}

export function getGrowthEmptyState(stats: ChildGrowthStatsResponse | null) {
  if (!stats) {
    return '暂时还没有成长数据。'
  }

  const hasPoints = stats.point_trend.some((item) => item.earned || item.spent || item.balance)
  const hasTasks = stats.task_trend.some((item) => item.submitted || item.completed || item.rejected)
  const hasRewards = stats.reward_stats.usage_trend.some((item) => item.redeemed || item.used)

  if (hasPoints || hasTasks || hasRewards) {
    return ''
  }

  return '最近这一段时间还没有新的积分、任务或奖励变化。'
}

export function getGrowthTrendLabel(direction: ChildGrowthStatsViewModel['trend_direction']) {
  return TREND_LABELS[direction] || TREND_LABELS.flat
}

function safeNumber(value: unknown) {
  return Number(value) || 0
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value))
}

function percent(numerator: number, denominator: number) {
  if (!(denominator > 0)) {
    return 0
  }

  return Math.round((numerator / denominator) * 100)
}

function average(values: number[]) {
  if (!values.length) {
    return 0
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function normalizeTimestamp(value?: number | string | null) {
  if (!value) {
    return 0
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  const content = String(value).trim()
  if (!content) {
    return 0
  }

  if (/^\d+$/.test(content)) {
    const numericValue = Number(content)
    return content.length >= 13 ? numericValue : numericValue * 1000
  }

  const parsed = Date.parse(content.replace(' ', 'T'))
  return Number.isNaN(parsed) ? 0 : parsed
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function getBusinessDateParts(input = Date.now()) {
  const date = new Date(normalizeTimestamp(input) + (8 * 60 * 60 * 1000))

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate()
  }
}

function toDateString(input = Date.now()) {
  const { year, month, day } = getBusinessDateParts(input)
  return `${year}-${pad(month)}-${pad(day)}`
}

function startOfDay(input = Date.now()) {
  const { year, month, day } = getBusinessDateParts(input)
  return Date.UTC(year, month - 1, day) - (8 * 60 * 60 * 1000)
}

function formatMonthDay(timestamp: number) {
  const { month, day } = getBusinessDateParts(timestamp)
  return `${month}/${day}`
}

export function createBuckets(range: ChildGrowthRange): GrowthBucket[] {
  const config = GROWTH_RANGE_META[range] || GROWTH_RANGE_META['90d']
  const todayStart = startOfDay()

  if (config.bucketMode === 'week') {
    const firstStart = todayStart - ((config.bucketCount - 1) * 7 * DAY_MS)

    return Array.from({ length: config.bucketCount }, (_, index) => {
      const startAt = firstStart + (index * 7 * DAY_MS)
      const naturalEndAt = startAt + (7 * DAY_MS) - 1
      const endAt = Math.min(naturalEndAt, todayStart + DAY_MS - 1)
      const labelEndAt = Math.min(endAt, todayStart)

      return {
        bucket_key: `${toDateString(startAt)}:${toDateString(labelEndAt)}`,
        label: `${formatMonthDay(startAt)}-${formatMonthDay(labelEndAt)}`,
        start_at: startAt,
        end_at: endAt
      }
    })
  }

  return Array.from({ length: config.days }, (_, index) => {
    const offset = config.days - 1 - index
    const startAt = todayStart - (offset * DAY_MS)

    return {
      bucket_key: toDateString(startAt),
      label: formatMonthDay(startAt),
      start_at: startAt,
      end_at: startAt + DAY_MS - 1
    }
  })
}

export function findBucketIndex(buckets: GrowthBucket[], timestamp: number): number {
  if (!(timestamp > 0)) {
    return -1
  }

  return buckets.findIndex((bucket) => timestamp >= bucket.start_at && timestamp <= bucket.end_at)
}

function getLedgerTimestamp(entry: ChildPointsLedgerEntry) {
  return normalizeTimestamp(entry.created_at || entry.record_date)
}

function isRewardLedger(entry: ChildPointsLedgerEntry) {
  return entry.biz_type === 'reward_redeem' || entry.change_type === 'decrease'
}

function isTaskLikeLedger(entry: ChildPointsLedgerEntry) {
  return !isRewardLedger(entry) && entry.biz_type !== 'manual_adjust'
}

function buildStatusBreakdown(
  items: Array<{ status?: string }>,
  metaMap: Record<string, { label: string; tone: ChildGrowthRewardStatusItem['tone'] }>
) {
  const counter = new Map<string, number>()

  items.forEach((item) => {
    const status = String(item.status || '').trim()
    if (status && metaMap[status]) {
      counter.set(status, (counter.get(status) || 0) + 1)
    }
  })

  return Object.entries(metaMap)
    .map(([key, meta]) => ({
      key,
      label: meta.label,
      tone: meta.tone,
      value: counter.get(key) || 0
    }))
    .filter((item) => item.value > 0)
}

function getRangeLabel(range: ChildGrowthRange) {
  if (range === '7d') return '最近7天'
  if (range === '30d') return '最近30天'
  return '最近90天'
}

function getRangeDays(range: ChildGrowthRange) {
  return GROWTH_RANGE_META[range]?.days || GROWTH_RANGE_META['90d'].days
}

function buildGrowthDigest(stats: Pick<ChildGrowthStatsResponse, 'task_trend' | 'reward_stats'>): ChildGrowthDigest {
  const taskDigest = (stats.task_trend || []).reduce((result, item) => ({
    submitted_in_range: result.submitted_in_range + safeNumber(item.submitted),
    completed_in_range: result.completed_in_range + safeNumber(item.completed),
    rejected_in_range: result.rejected_in_range + safeNumber(item.rejected)
  }), {
    submitted_in_range: 0,
    completed_in_range: 0,
    rejected_in_range: 0
  })

  const rewardDigest = (stats.reward_stats?.usage_trend || []).reduce((result, item) => ({
    redeemed_in_range: result.redeemed_in_range + safeNumber(item.redeemed),
    used_in_range: result.used_in_range + safeNumber(item.used)
  }), {
    redeemed_in_range: 0,
    used_in_range: 0
  })

  return {
    ...taskDigest,
    ...rewardDigest
  }
}

function resolveDigest(stats: ChildGrowthStatsResponse): ChildGrowthDigest {
  const fallbackDigest = buildGrowthDigest(stats)

  return {
    submitted_in_range: safeNumber(stats.digest?.submitted_in_range) || fallbackDigest.submitted_in_range,
    completed_in_range: safeNumber(stats.digest?.completed_in_range) || fallbackDigest.completed_in_range,
    rejected_in_range: safeNumber(stats.digest?.rejected_in_range) || fallbackDigest.rejected_in_range,
    redeemed_in_range: safeNumber(stats.digest?.redeemed_in_range) || fallbackDigest.redeemed_in_range,
    used_in_range: safeNumber(stats.digest?.used_in_range) || fallbackDigest.used_in_range
  }
}

function getStatusCount(
  items: ChildGrowthRewardStatusItem[] | undefined,
  key: string
) {
  return safeNumber(items?.find((item) => item.key === key)?.value)
}

function buildStatusSnapshot(stats: ChildGrowthStatsResponse) {
  const requestStatuses = stats.reward_stats.request_status_breakdown || []
  const redemptionStatuses = stats.reward_stats.redemption_status_breakdown || []

  const waitingReview = getStatusCount(requestStatuses, 'pending') + getStatusCount(redemptionStatuses, 'pending')
  const waitingUse = getStatusCount(requestStatuses, 'approved')
  const rejected = (
    getStatusCount(requestStatuses, 'rejected') +
    getStatusCount(redemptionStatuses, 'rejected') +
    getStatusCount(redemptionStatuses, 'cancelled')
  )
  const used = getStatusCount(requestStatuses, 'fulfilled')
  const redeemedPending = getStatusCount(redemptionStatuses, 'approved')

  return {
    status_breakdown: [
      { key: 'waiting_review', label: '待审核', value: waitingReview, tone: 'sky' as const },
      { key: 'waiting_use', label: '待使用', value: waitingUse, tone: 'mint' as const },
      { key: 'rejected', label: '未通过', value: rejected, tone: 'rose' as const },
      { key: 'used', label: '已使用', value: used, tone: 'amber' as const },
      { key: 'redeemed_pending', label: '已兑换未领取', value: redeemedPending, tone: 'sky' as const }
    ].filter((item) => item.value > 0),
    pending_carry_count: waitingReview + waitingUse + redeemedPending
  }
}

function buildCategoryStats(stats: ChildGrowthStatsResponse) {
  if (stats.task_category_stats?.length) {
    return stats.task_category_stats
      .map((item) => ({
        key: String(item.key || item.label || 'task_group'),
        label: String(item.label || item.key || '未命名分类'),
        submitted: safeNumber(item.submitted),
        completed: safeNumber(item.completed),
        rejected: safeNumber(item.rejected)
      }))
      .filter((item) => item.submitted || item.completed || item.rejected)
  }

  return (stats.task_category_breakdown || [])
    .map((item) => {
      const submitted = safeNumber(item.value)
      const key = String(item.key || item.label || 'task_group')
      const completed = key === 'completed' ? submitted : 0
      const rejected = key === 'rejected' ? submitted : 0

      return {
        key,
        label: String(item.label || item.key || '未命名分类'),
        submitted,
        completed,
        rejected
      }
    })
    .filter((item) => item.submitted || item.completed || item.rejected)
}

function buildTrendDirection(completionSeries: Array<number | null>): 'up' | 'flat' | 'down' {
  const values = completionSeries.filter((item): item is number => typeof item === 'number')
  if (values.length < 2) {
    return 'flat'
  }

  const midpoint = Math.ceil(values.length / 2)
  const firstHalf = values.slice(0, midpoint)
  const secondHalf = values.slice(midpoint)
  const delta = average(secondHalf.length ? secondHalf : values) - average(firstHalf)

  if (delta >= 6) {
    return 'up'
  }

  if (delta <= -6) {
    return 'down'
  }

  return 'flat'
}

function estimateActivityDays(stats: ChildGrowthStatsResponse) {
  const activeBuckets = stats.task_trend.reduce((count, item, index) => {
    const hasTaskActivity = safeNumber(item.submitted) || safeNumber(item.completed) || safeNumber(item.rejected)
    const rewardBucket = stats.reward_stats.usage_trend[index]
    const hasRewardActivity = safeNumber(rewardBucket?.redeemed) || safeNumber(rewardBucket?.used)
    const pointBucket = stats.point_trend[index]
    const hasPointActivity = safeNumber(pointBucket?.earned) || safeNumber(pointBucket?.spent)

    return count + (hasTaskActivity || hasRewardActivity || hasPointActivity ? 1 : 0)
  }, 0)

  const multiplier = stats.range === '90d' ? 7 : 1
  return Math.min(
    getRangeDays(stats.range),
    Math.max(safeNumber(stats.overview.active_streak_days), activeBuckets * multiplier)
  )
}

function buildRiskFlags(options: {
  activityDays: number
  completionRate: number
  pendingCarryCount: number
  stats: ChildGrowthStatsResponse
  topCategory?: ChildGrowthCategoryRiskItem
  trendDirection: 'up' | 'flat' | 'down'
}) {
  const {
    activityDays,
    completionRate,
    pendingCarryCount,
    stats,
    topCategory,
    trendDirection
  } = options
  const flags: ChildGrowthStatsViewModel['risk_flags'] = []

  if (completionRate < 60) {
    flags.push({
      key: 'execution',
      label: '执行节奏需要扶一把',
      detail: `当前完成率 ${completionRate}% ，可以先缩小目标再稳住。`,
      tone: 'rose'
    })
  }

  if (trendDirection === 'down') {
    flags.push({
      key: 'trend',
      label: '最近航线有点回落',
      detail: '后半段比前半段更慢，适合先把最稳的习惯重新点亮。',
      tone: 'amber'
    })
  }

  if (topCategory && topCategory.risk_score > 0) {
    flags.push({
      key: 'category',
      label: `${topCategory.label}最值得先关注`,
      detail: `这类任务还留有 ${topCategory.open_loop} 项未闭环，未通过 ${topCategory.rejected} 次。`,
      tone: topCategory.rejected > 0 ? 'rose' : 'amber'
    })
  }

  if (pendingCarryCount > 0) {
    flags.push({
      key: 'reward',
      label: '奖励还有待兑现的环节',
      detail: `当前仍有 ${pendingCarryCount} 项奖励在等待审核、使用或领取。`,
      tone: 'sky'
    })
  }

  if (safeNumber(stats.overview.active_streak_days) < 2 && activityDays > 0) {
    flags.push({
      key: 'streak',
      label: '连续性需要重新点亮',
      detail: '最近有活动，但连续活跃还不够稳，可以先守住每天一小步。',
      tone: 'amber'
    })
  }

  if (!flags.length) {
    flags.push({
      key: 'steady',
      label: '航线整体比较平稳',
      detail: '当前没有明显风险点，保持现在的节奏就很好。',
      tone: 'mint'
    })
  }

  return flags.slice(0, 4)
}

function buildSummarySignals(options: {
  completionRate: number
  focusCategory?: ChildGrowthCategoryRiskItem
  pendingCarryCount: number
  rewardFulfillmentRate: number
  stats: ChildGrowthStatsResponse
  trendDirection: 'up' | 'flat' | 'down'
}): ChildGrowthSummarySignal[] {
  const {
    completionRate,
    focusCategory,
    pendingCarryCount,
    rewardFulfillmentRate,
    stats,
    trendDirection
  } = options

  return [
    {
      key: 'completion',
      label: '执行稳定',
      value: `${completionRate}%`,
      detail: `${getRangeLabel(stats.range)}完成了 ${safeNumber(resolveDigest(stats).completed_in_range)} 项任务。`,
      tone: completionRate >= 75 ? 'mint' : completionRate >= 55 ? 'amber' : 'rose',
      icon: 'ph:target-fill'
    },
    {
      key: 'trend',
      label: '近期走势',
      value: getGrowthTrendLabel(trendDirection),
      detail: trendDirection === 'up'
        ? '后半段比前半段更稳。'
        : trendDirection === 'down'
          ? '最近需要把节奏重新拉回来。'
          : '最近的起伏整体不大。',
      tone: trendDirection === 'up' ? 'mint' : trendDirection === 'down' ? 'amber' : 'sky',
      icon: trendDirection === 'up' ? 'ph:trend-up-fill' : trendDirection === 'down' ? 'ph:trend-down-fill' : 'ph:wave-sine-fill'
    },
    {
      key: 'focus',
      label: '待关注习惯',
      value: focusCategory?.label || '节奏平稳',
      detail: focusCategory
        ? `未闭环 ${focusCategory.open_loop} 项，未通过 ${focusCategory.rejected} 次。`
        : '当前没有明显掉队的任务类型。',
      tone: focusCategory?.risk_score ? (focusCategory.rejected > 0 ? 'rose' : 'amber') : 'mint',
      icon: 'ph:mountains-fill'
    },
    {
      key: 'reward',
      label: '奖励兑现',
      value: `${rewardFulfillmentRate}%`,
      detail: pendingCarryCount > 0
        ? `${pendingCarryCount} 个奖励还在路上。`
        : '最近奖励兑现节奏顺畅。',
      tone: pendingCarryCount > 0 ? 'sky' : 'mint',
      icon: 'ph:gift-fill'
    }
  ]
}

export function buildGrowthStatsViewModel(stats: ChildGrowthStatsResponse): ChildGrowthStatsViewModel {
  const digest = resolveDigest(stats)
  const rewardSnapshot = buildStatusSnapshot(stats)
  const completionSeries = stats.task_trend.map((item) => {
    const submitted = safeNumber(item.submitted)
    return submitted > 0 ? percent(safeNumber(item.completed), submitted) : null
  })
  let lowPointIndex = -1
  let lowPointValue = Number.POSITIVE_INFINITY

  completionSeries.forEach((value, index) => {
    if (typeof value !== 'number') {
      return
    }

    if (value < lowPointValue) {
      lowPointValue = value
      lowPointIndex = index
    }
  })

  const completionRate = percent(digest.completed_in_range, Math.max(digest.submitted_in_range, 1))
  const rewardFulfillmentRate = clamp(percent(digest.used_in_range, Math.max(digest.redeemed_in_range, 1)))
  const activityDays = estimateActivityDays(stats)
  const categoryRisks = buildCategoryStats(stats)
    .map((item) => {
      const submitted = safeNumber(item.submitted)
      const completed = safeNumber(item.completed)
      const rejected = safeNumber(item.rejected)
      const openLoop = Math.max(0, submitted - completed - rejected)

      return {
        ...item,
        submitted,
        completed,
        rejected,
        open_loop: openLoop,
        risk_score: (rejected * 2) + openLoop
      }
    })
    .filter((item) => item.submitted || item.completed || item.rejected || item.open_loop)
    .sort((left, right) => right.risk_score - left.risk_score || right.submitted - left.submitted)
    .slice(0, 5)

  const trendDirection = buildTrendDirection(completionSeries)
  const compassScores = [
    {
      key: 'execution',
      label: '执行稳定',
      value: clamp(completionRate)
    },
    {
      key: 'streak',
      label: '连续活跃',
      value: clamp(Math.round((safeNumber(stats.overview.active_streak_days) / Math.min(getRangeDays(stats.range), 10)) * 100))
    },
    {
      key: 'clearance',
      label: '任务清空',
      value: clamp(percent(digest.completed_in_range, Math.max(digest.completed_in_range + digest.rejected_in_range + categoryRisks.reduce((sum, item) => sum + item.open_loop, 0), 1)))
    },
    {
      key: 'reward',
      label: '奖励兑现',
      value: clamp(rewardFulfillmentRate || (rewardSnapshot.pending_carry_count > 0 ? 38 : 72))
    },
    {
      key: 'recovery',
      label: '最近回升',
      value: trendDirection === 'up' ? 86 : trendDirection === 'down' ? 34 : 60
    }
  ]

  const riskFlags = buildRiskFlags({
    activityDays,
    completionRate,
    pendingCarryCount: rewardSnapshot.pending_carry_count,
    stats,
    topCategory: categoryRisks[0],
    trendDirection
  })

  return {
    summary_signals: buildSummarySignals({
      completionRate,
      focusCategory: categoryRisks[0],
      pendingCarryCount: rewardSnapshot.pending_carry_count,
      rewardFulfillmentRate,
      stats,
      trendDirection
    }),
    execution_series: {
      labels: stats.task_trend.map((item) => item.label),
      submitted: stats.task_trend.map((item) => safeNumber(item.submitted)),
      completed: stats.task_trend.map((item) => safeNumber(item.completed)),
      rejected: stats.task_trend.map((item) => safeNumber(item.rejected)),
      completion_rate: completionSeries,
      low_point_index: lowPointIndex,
      streak_days: safeNumber(stats.overview.active_streak_days),
      activity_days: activityDays
    },
    compass_scores: compassScores,
    category_risks: categoryRisks,
    reward_fulfillment: {
      status_breakdown: rewardSnapshot.status_breakdown,
      labels: stats.reward_stats.usage_trend.map((item) => item.label),
      redeemed: stats.reward_stats.usage_trend.map((item) => safeNumber(item.redeemed)),
      used: stats.reward_stats.usage_trend.map((item) => safeNumber(item.used)),
      fulfillment_rate: rewardFulfillmentRate,
      pending_carry_count: rewardSnapshot.pending_carry_count
    },
    trend_direction: trendDirection,
    risk_flags: riskFlags
  }
}

export function buildFallbackGrowthAdvice(stats: ChildGrowthStatsResponse): ChildGrowthAdviceResponse {
  const rangeLabel = getRangeLabel(stats.range)
  const viewModel = buildGrowthStatsViewModel(stats)
  const digest = resolveDigest(stats)
  const focusCategory = viewModel.category_risks[0]
  const cards: ChildGrowthAdviceCard[] = []

  if (viewModel.trend_direction === 'down' || viewModel.risk_flags.some((item) => item.key === 'execution')) {
    cards.push({
      title: '先把最稳的一条习惯线拉起来',
      priority: 'high',
      reason: `${rangeLabel}里执行节奏有点放缓，先从最容易完成的一件任务开始，更容易把航线重新拉稳。`,
      based_on: ['执行稳定', rangeLabel],
      next_step: '下一次先做最近最容易通过的一项任务，先拿回连续完成的感觉。'
    })
  }

  if (focusCategory) {
    cards.push({
      title: `先照顾好${focusCategory.label}`,
      priority: focusCategory.rejected > 0 ? 'high' : 'medium',
      reason: `${focusCategory.label}现在最需要关注，最近还有 ${focusCategory.open_loop} 项没有闭环。`,
      based_on: [focusCategory.label, '任务地形分布'],
      next_step: `接下来优先完成一项${focusCategory.label}相关任务，把这条支线先走顺。`
    })
  }

  if (viewModel.reward_fulfillment.pending_carry_count > 0) {
    cards.push({
      title: '把奖励兑现这一步走完',
      priority: 'medium',
      reason: `现在还有 ${viewModel.reward_fulfillment.pending_carry_count} 个奖励在等待审核、使用或领取，先把已有成果真正兑现出来。`,
      based_on: ['奖励兑现轨迹', '待使用奖励'],
      next_step: '先看看最近已经通过的奖励，有的话优先去使用并完成确认。'
    })
  }

  if (safeNumber(stats.overview.active_streak_days) >= 3) {
    cards.push({
      title: '把连续活跃继续守住',
      priority: 'low',
      reason: `你已经连续活跃 ${safeNumber(stats.overview.active_streak_days)} 天了，这股稳定的惯性很宝贵。`,
      based_on: ['连续活跃', '习惯执行航线'],
      next_step: '明天继续完成至少一件任务，让这条连续航线再向前一格。'
    })
  }

  if (digest.completed_in_range === 0 && digest.submitted_in_range === 0) {
    cards.push({
      title: '先点亮第一个成长节点',
      priority: 'high',
      reason: `${rangeLabel}里还没有明显的任务变化，先完成一件小任务，页面上的航线就会开始动起来。`,
      based_on: [rangeLabel, '成长航线'],
      next_step: '今天先选一件最简单的小任务，把第一段航线先点亮。'
    })
  }

  while (cards.length < 3) {
    cards.push({
      title: '继续保持一小步一小步前进',
      priority: cards.length === 0 ? 'high' : 'low',
      reason: `${rangeLabel}里最重要的是持续前进，不用一次做很多。`,
      based_on: [rangeLabel, '成长主图'],
      next_step: '下一次先完成一件确定能做好的任务，再回来看看航线有没有更稳。'
    })
  }

  return {
    range: stats.range,
    generated_at: Date.now(),
    source: 'fallback',
    advice_cards: cards.slice(0, 3)
  }
}

export function buildFallbackGrowthStats(options: {
  home: ChildHomeResponse | null
  points: ChildPointsResponse
  range: ChildGrowthRange
  rewards: ChildRewardsResponse
  session: ChildPortalStoredSession | null
  tasks: ChildTasksResponse | null
}): ChildGrowthStatsResponse {
  const { home, points, range, rewards, session, tasks } = options
  const buckets = createBuckets(range)
  const rewardHistory = rewards.request_history || []
  const pointTrend = buckets.map((bucket) => ({
    bucket_key: bucket.bucket_key,
    label: bucket.label,
    earned: 0,
    spent: 0,
    balance: 0
  }))
  const taskTrend = buckets.map((bucket) => ({
    bucket_key: bucket.bucket_key,
    label: bucket.label,
    submitted: 0,
    completed: 0,
    rejected: 0
  }))
  const usageTrend = buckets.map((bucket) => ({
    bucket_key: bucket.bucket_key,
    label: bucket.label,
    redeemed: 0,
    used: 0
  }))
  const activityDates = new Set<string>()

  const ledgers = [...(points.list || [])].sort(
    (left, right) => getLedgerTimestamp(left) - getLedgerTimestamp(right)
  )

  let runningBalance = 0
  let pointBucketIndex = 0
  ledgers.forEach((entry) => {
    const timestamp = getLedgerTimestamp(entry)
    const amount = safeNumber(entry.amount)

    while (
      pointBucketIndex < buckets.length &&
      timestamp > 0 &&
      timestamp > (buckets[pointBucketIndex]?.end_at ?? Number.POSITIVE_INFINITY)
    ) {
      const pointBucket = pointTrend[pointBucketIndex]
      if (pointBucket) {
        pointBucket.balance = runningBalance
      }
      pointBucketIndex += 1
    }

    if (entry.change_type === 'decrease') {
      runningBalance -= amount
    } else {
      runningBalance += amount
    }

    const bucketIndex = findBucketIndex(buckets, timestamp)
    if (bucketIndex > -1) {
      const pointBucket = pointTrend[bucketIndex]
      const taskBucket = taskTrend[bucketIndex]
      const usageBucket = usageTrend[bucketIndex]

      if (entry.change_type === 'decrease') {
        if (pointBucket) {
          pointBucket.spent += amount
        }
      } else if (pointBucket) {
        pointBucket.earned += amount
      }

      if (isTaskLikeLedger(entry) && taskBucket) {
        taskBucket.submitted += 1
        taskBucket.completed += 1
      }

      if (isRewardLedger(entry) && usageBucket) {
        usageBucket.redeemed += 1
      }
    }

    const activityDate = entry.record_date || (timestamp > 0 ? toDateString(timestamp) : '')
    if (activityDate) {
      activityDates.add(activityDate)
    }
  })

  while (pointBucketIndex < buckets.length) {
    const pointBucket = pointTrend[pointBucketIndex]
    if (pointBucket) {
      pointBucket.balance = runningBalance
    }
    pointBucketIndex += 1
  }

  rewardHistory.forEach((item) => {
    const timestamp = normalizeTimestamp(item.requested_at)
    const bucketIndex = findBucketIndex(buckets, timestamp)
    if (bucketIndex > -1) {
      const usageBucket = usageTrend[bucketIndex]

      if ((item.status === 'approved' || item.status === 'fulfilled') && usageBucket) {
        usageBucket.redeemed += 1
      }

      if (item.status === 'fulfilled' && usageBucket) {
        usageBucket.used += 1
      }
    }

    const activityDate = timestamp > 0 ? toDateString(timestamp) : ''
    if (activityDate) {
      activityDates.add(activityDate)
    }
  })

  const todayBucketIndex = findBucketIndex(buckets, Date.now())
  if (todayBucketIndex > -1) {
    const todayTaskBucket = taskTrend[todayBucketIndex]
    if (todayTaskBucket) {
      todayTaskBucket.submitted += safeNumber(home?.today_pending_count)
    }
  }

  const currentTaskSummary = tasks
    ? [
        { key: 'active', label: '进行中', value: tasks.active_tasks.length },
        { key: 'pending', label: '待确认', value: tasks.pending_tasks.length },
        { key: 'completed', label: '已完成', value: tasks.completed_tasks.length }
      ]
    : [
        { key: 'active', label: '进行中', value: safeNumber(home?.today_active_count) },
        { key: 'pending', label: '待确认', value: safeNumber(home?.today_pending_count) },
        { key: 'completed', label: '已完成', value: safeNumber(home?.today_completed_count) }
      ]

  const taskCategoryStats = currentTaskSummary
    .map((item) => ({
      key: item.key,
      label: item.label,
      submitted: safeNumber(item.value),
      completed: item.key === 'completed' ? safeNumber(item.value) : 0,
      rejected: item.key === 'rejected' ? safeNumber(item.value) : 0
    }))
    .filter((item) => item.submitted || item.completed || item.rejected)

  const homeActivityCount =
    safeNumber(home?.today_active_count) +
    safeNumber(home?.today_pending_count) +
    safeNumber(home?.today_completed_count)

  if (homeActivityCount > 0 && home?.record_date) {
    activityDates.add(home.record_date)
  }

  let activeStreakDays = 0
  let cursor = startOfDay()
  while (activityDates.has(toDateString(cursor))) {
    activeStreakDays += 1
    cursor -= DAY_MS
  }

  const digest = buildGrowthDigest({
    task_trend: taskTrend,
    reward_stats: {
      request_status_breakdown: [],
      redemption_status_breakdown: [],
      usage_trend: usageTrend
    }
  })

  return {
    child_profile: {
      ...(session?.childProfile || {}),
      ...(points.child_profile || {}),
      ...(rewards.child_profile || {}),
      ...(home?.child_profile || {}),
      current_points: safeNumber(points.current_points),
      total_points_earned: safeNumber(points.total_points_earned),
      total_points_spent: safeNumber(points.total_points_spent),
      child_id:
        session?.childId ||
        home?.child_profile?.child_id ||
        points.child_profile?.child_id ||
        rewards.child_profile?.child_id ||
        ''
    },
    range,
    generated_at: Date.now(),
    overview: {
      current_points: safeNumber(points.current_points),
      total_points_earned: safeNumber(points.total_points_earned),
      total_points_spent: safeNumber(points.total_points_spent),
      active_streak_days: activeStreakDays,
      completed_tasks: ledgers.filter((item) => isTaskLikeLedger(item)).length,
      fulfilled_reward_count: rewardHistory.filter((item) => item.status === 'fulfilled').length,
      pending_reward_request_count: rewardHistory.filter((item) => item.status === 'pending').length
    },
    point_trend: pointTrend,
    task_trend: taskTrend,
    task_category_breakdown: currentTaskSummary.filter((item) => item.value > 0),
    task_category_stats: taskCategoryStats,
    reward_stats: {
      request_status_breakdown: buildStatusBreakdown(rewardHistory, REQUEST_STATUS_META),
      redemption_status_breakdown: [],
      usage_trend: usageTrend
    },
    digest
  }
}
