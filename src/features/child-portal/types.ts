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
  reward_type?: string
  suggested_points?: number
  approved_cost_points?: number
  status?: string
  review_remark?: string
  requested_at?: number
}

export interface ChildRewardsResponse {
  child_profile: ChildProfile
  rewards: ChildRewardItem[]
  request_history: ChildRewardRequestItem[]
}

export interface ChildPointsLedgerEntry {
  ledger_id?: string
  change_type?: 'increase' | 'decrease'
  biz_type?: string
  amount?: number
  balance_after?: number
  record_date?: string
  remark?: string
  created_at?: number
}

export interface ChildPointsResponse {
  child_profile: ChildProfile
  current_points: number
  total_points_earned: number
  total_points_spent: number
  list: ChildPointsLedgerEntry[]
}
