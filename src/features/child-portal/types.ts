export type PortalSection = 'home' | 'tasks' | 'rewards' | 'points'
export type ChildPortalNavKey = PortalSection | 'growth-stats'
export type ChildGrowthRange = '7d' | '30d' | '90d'

export interface ChildProfile {
  child_id: string
  name?: string
  nickname?: string
  avatar_url?: string
  avatar_key?: string
  current_points?: number
  total_points_earned?: number
  total_points_spent?: number
  today_earned_points?: number
  today_available_points?: number
  level_code?: string
}

export interface ChildPortalSessionResponse {
  login_state: string
  client_mode: string
  bind_mode: string
  web_session_token: string
  expires_at: number
  family_id: string
  child_id: string
  child_profile: ChildProfile
}

export interface ChildPortalStoredSession {
  clientMode: string
  bindMode: string
  childId: string
  childProfile: ChildProfile
  expiresAt: number
  familyId: string
  lastPortalToken: string
  loginState: string
  webSessionToken: string
}

export interface ChildPortalNavItem {
  key: ChildPortalNavKey
  label: string
  shortLabel: string
  to: string
  icon: string
  accent: string
}

export interface ChildLevelProgress {
  label: string
  title: string
  min: number
  max: number
  badge: string
  points: number
  percent: number
  pointsToNext: number
}

export interface ChildPortalOverview {
  activeCount: number
  pendingCount: number
  completedCount: number
  pendingRewardCount: number
}

export interface ChildPortalTimelineItem {
  id: string
  icon: string
  title: string
  subtitle: string
  tone: 'amber' | 'sky' | 'mint' | 'rose'
  time: number
  timeText: string
  amountText?: string
}

export interface ChildTaskItem {
  task_id: string
  title: string
  description?: string
  image_url?: string
  points?: number
  type?: 'active' | 'pending' | 'completed'
  auto_confirm_completion?: boolean
  completed_at?: number
  submitted_at?: number
}

export interface ChildHomeResponse {
  child_profile: ChildProfile
  record_date: string
  today_tasks: ChildTaskItem[]
  today_active_count: number
  today_pending_count: number
  today_completed_count: number
  pending_reward_request_count: number
}

export interface ChildTasksResponse {
  child_profile: ChildProfile
  record_date: string
  active_tasks: ChildTaskItem[]
  pending_tasks: ChildTaskItem[]
  completed_tasks: ChildTaskItem[]
}

export interface ChildRewardItem {
  reward_id: string
  title: string
  image_url?: string
  reward_type?: string
  cost_points?: number
  status?: string
}

export interface ChildRewardRequestItem {
  request_id: string
  title: string
  description?: string
  child_avatar_key?: string
  child_avatar_url?: string
  child_gender?: string
  child_name?: string
  reward_type?: string
  suggested_points?: number
  approved_cost_points?: number
  status?: string
  review_remark?: string
  requested_at?: number
}

export interface ChildRewardRedemptionItem {
  redemption_id: string
  reward_id: string
  reward_title?: string
  child_avatar_key?: string
  child_avatar_url?: string
  child_gender?: string
  child_name?: string
  requested_points?: number
  status?: string
  review_remark?: string
  requested_at?: number
  reviewed_at?: number
}

export interface ChildRewardsResponse {
  child_profile: ChildProfile
  rewards: ChildRewardItem[]
  request_history: ChildRewardRequestItem[]
  redemption_history?: ChildRewardRedemptionItem[]
}

export interface ChildPointsLedgerEntry {
  ledger_id?: string
  change_type?: 'increase' | 'decrease'
  biz_type?: string
  amount?: number
  balance_after?: number
  record_date?: string
  remark?: string
  image_url?: string
  created_at?: number
}

export interface ChildPointsResponse {
  child_profile: ChildProfile
  current_points: number
  total_points_earned: number
  total_points_spent: number
  list: ChildPointsLedgerEntry[]
}

export interface ChildGrowthOverview {
  current_points: number
  total_points_earned: number
  total_points_spent: number
  active_streak_days: number
  completed_tasks: number
  fulfilled_reward_count: number
  pending_reward_request_count: number
}

export interface ChildGrowthPointTrendBucket {
  bucket_key: string
  label: string
  earned: number
  spent: number
  balance: number
}

export interface ChildGrowthTaskTrendBucket {
  bucket_key: string
  label: string
  submitted: number
  completed: number
  rejected: number
}

export interface ChildGrowthCategoryBreakdownItem {
  key: string
  label: string
  value: number
}

export interface ChildGrowthRewardStatusItem {
  key: string
  label: string
  value: number
  tone: 'sky' | 'mint' | 'rose' | 'amber'
}

export interface ChildGrowthRewardUsageBucket {
  bucket_key: string
  label: string
  redeemed: number
  used: number
}

export interface ChildGrowthDigest {
  submitted_in_range: number
  completed_in_range: number
  rejected_in_range: number
  redeemed_in_range: number
  used_in_range: number
}

export interface ChildGrowthTaskCategoryStatsItem {
  key: string
  label: string
  submitted: number
  completed: number
  rejected: number
}

export interface ChildGrowthSummarySignal {
  key: string
  label: string
  value: string
  detail: string
  tone: 'sky' | 'mint' | 'rose' | 'amber'
  icon: string
}

export interface ChildGrowthCompassScore {
  key: string
  label: string
  value: number
}

export interface ChildGrowthCategoryRiskItem {
  key: string
  label: string
  submitted: number
  completed: number
  rejected: number
  open_loop: number
  risk_score: number
}

export interface ChildGrowthRewardFulfillmentView {
  status_breakdown: ChildGrowthRewardStatusItem[]
  labels: string[]
  redeemed: number[]
  used: number[]
  fulfillment_rate: number
  pending_carry_count: number
}

export interface ChildGrowthRiskFlag {
  key: string
  label: string
  detail: string
  tone: 'sky' | 'mint' | 'rose' | 'amber'
}

export interface ChildGrowthStatsViewModel {
  summary_signals: ChildGrowthSummarySignal[]
  execution_series: {
    labels: string[]
    submitted: number[]
    completed: number[]
    rejected: number[]
    completion_rate: Array<number | null>
    low_point_index: number
    streak_days: number
    activity_days: number
  }
  compass_scores: ChildGrowthCompassScore[]
  category_risks: ChildGrowthCategoryRiskItem[]
  reward_fulfillment: ChildGrowthRewardFulfillmentView
  trend_direction: 'up' | 'flat' | 'down'
  risk_flags: ChildGrowthRiskFlag[]
}

export interface ChildGrowthStatsResponse {
  child_profile: ChildProfile
  range: ChildGrowthRange
  generated_at: number
  overview: ChildGrowthOverview
  point_trend: ChildGrowthPointTrendBucket[]
  task_trend: ChildGrowthTaskTrendBucket[]
  task_category_breakdown: ChildGrowthCategoryBreakdownItem[]
  task_category_stats?: ChildGrowthTaskCategoryStatsItem[]
  reward_stats: {
    request_status_breakdown: ChildGrowthRewardStatusItem[]
    redemption_status_breakdown: ChildGrowthRewardStatusItem[]
    usage_trend: ChildGrowthRewardUsageBucket[]
  }
  digest?: ChildGrowthDigest
}

export interface ChildGrowthAdviceCard {
  title: string
  priority: 'high' | 'medium' | 'low'
  reason: string
  based_on: string[]
  next_step: string
}

export interface ChildGrowthAdviceResponse {
  range: ChildGrowthRange
  generated_at: number
  source?: 'ai' | 'fallback'
  advice_cards: ChildGrowthAdviceCard[]
}
