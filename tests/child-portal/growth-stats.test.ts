import { describe, expect, it } from 'vitest'
import {
  buildGrowthStatsViewModel,
  buildFallbackGrowthAdvice,
  buildFallbackGrowthStats,
  getGrowthEmptyState
} from '../../src/features/child-portal/growth-stats'
import type { ChildGrowthStatsResponse } from '../../src/features/child-portal/types'

function createStats(overrides: Partial<ChildGrowthStatsResponse> = {}): ChildGrowthStatsResponse {
  return {
    child_profile: {},
    range: '90d',
    generated_at: Date.now(),
    overview: {
      current_points: 0,
      total_points_earned: 0,
      total_points_spent: 0,
      active_streak_days: 0,
      completed_tasks: 0,
      fulfilled_reward_count: 0,
      pending_reward_request_count: 0
    },
    point_trend: [{ bucket_key: '1', label: '4/1', earned: 0, spent: 0, balance: 0 }],
    task_trend: [{ bucket_key: '1', label: '4/1', submitted: 0, completed: 0, rejected: 0 }],
    task_category_breakdown: [],
    reward_stats: {
      request_status_breakdown: [],
      redemption_status_breakdown: [],
      usage_trend: [{ bucket_key: '1', label: '4/1', redeemed: 0, used: 0 }]
    },
    ...overrides
  }
}

describe('growth stats helpers', () => {
  it('returns empty message when all trends are flat', () => {
    expect(getGrowthEmptyState(createStats())).toBe('最近这一段时间还没有新的积分、任务或奖励变化。')
  })

  it('suppresses empty message when there is activity', () => {
    const stats = createStats({
      point_trend: [{ bucket_key: '1', label: '4/1', earned: 12, spent: 0, balance: 12 }]
    })

    expect(getGrowthEmptyState(stats)).toBe('')
  })

  it('builds fallback stats with the expected 90 day bucket shape', () => {
    const stats = buildFallbackGrowthStats({
      range: '90d',
      session: null,
      home: {
        child_profile: { child_id: 'child_1', name: '乐乐' },
        record_date: '2026-04-14',
        today_tasks: [],
        today_active_count: 1,
        today_pending_count: 1,
        today_completed_count: 2,
        pending_reward_request_count: 1
      },
      tasks: {
        child_profile: { child_id: 'child_1', name: '乐乐' },
        record_date: '2026-04-14',
        active_tasks: [{ task_id: 'task_1', title: '整理书包', type: 'active' }],
        pending_tasks: [{ task_id: 'task_2', title: '练字', type: 'pending' }],
        completed_tasks: [{ task_id: 'task_3', title: '阅读', type: 'completed' }]
      },
      rewards: {
        child_profile: { child_id: 'child_1', name: '乐乐' },
        rewards: [],
        request_history: [
          {
            request_id: 'reward_request_1',
            title: '冰淇淋',
            status: 'approved',
            requested_at: Date.now() - (2 * 24 * 60 * 60 * 1000)
          },
          {
            request_id: 'reward_request_2',
            title: '去公园',
            status: 'fulfilled',
            requested_at: Date.now() - (6 * 24 * 60 * 60 * 1000)
          }
        ]
      },
      points: {
        child_profile: { child_id: 'child_1', name: '乐乐' },
        current_points: 30,
        total_points_earned: 80,
        total_points_spent: 50,
        list: [
          {
            ledger_id: 'ledger_1',
            change_type: 'increase',
            biz_type: 'task_complete',
            amount: 20,
            balance_after: 20,
            record_date: '2026-04-08',
            created_at: Date.now() - (6 * 24 * 60 * 60 * 1000)
          },
          {
            ledger_id: 'ledger_2',
            change_type: 'increase',
            biz_type: 'task_complete',
            amount: 60,
            balance_after: 80,
            record_date: '2026-04-12',
            created_at: Date.now() - (2 * 24 * 60 * 60 * 1000)
          },
          {
            ledger_id: 'ledger_3',
            change_type: 'decrease',
            biz_type: 'reward_redeem',
            amount: 50,
            balance_after: 30,
            record_date: '2026-04-13',
            created_at: Date.now() - (1 * 24 * 60 * 60 * 1000)
          }
        ]
      }
    })

    expect(stats.range).toBe('90d')
    expect(stats.point_trend).toHaveLength(13)
    expect(stats.task_trend).toHaveLength(13)
    expect(stats.reward_stats.usage_trend).toHaveLength(13)
    expect(stats.overview.current_points).toBe(30)
    expect(stats.overview.fulfilled_reward_count).toBe(1)
    expect(stats.task_category_breakdown.map((item) => item.label)).toEqual(['进行中', '待确认', '已完成'])
    expect(stats.digest).toEqual({
      submitted_in_range: 3,
      completed_in_range: 2,
      rejected_in_range: 0,
      redeemed_in_range: 3,
      used_in_range: 1
    })
  })

  it('builds three fallback advice cards', () => {
    const advice = buildFallbackGrowthAdvice(createStats({
      overview: {
        current_points: 12,
        total_points_earned: 20,
        total_points_spent: 30,
        active_streak_days: 4,
        completed_tasks: 2,
        fulfilled_reward_count: 0,
        pending_reward_request_count: 1
      },
      point_trend: [
        { bucket_key: '1', label: '4/1', earned: 10, spent: 12, balance: 5 }
      ]
    }))

    expect(advice.source).toBe('fallback')
    expect(advice.advice_cards).toHaveLength(3)
    expect(advice.advice_cards[0]?.title).toBeTruthy()
  })

  it('builds a parent-focused view model with risk ordering', () => {
    const viewModel = buildGrowthStatsViewModel(createStats({
      overview: {
        current_points: 20,
        total_points_earned: 60,
        total_points_spent: 40,
        active_streak_days: 1,
        completed_tasks: 4,
        fulfilled_reward_count: 1,
        pending_reward_request_count: 2
      },
      task_trend: [
        { bucket_key: '1', label: '4/1', submitted: 4, completed: 1, rejected: 1 },
        { bucket_key: '2', label: '4/2', submitted: 4, completed: 3, rejected: 0 }
      ],
      task_category_stats: [
        { key: 'daily_habit', label: '日常习惯', submitted: 5, completed: 2, rejected: 1 },
        { key: 'special_reward', label: '特别挑战', submitted: 3, completed: 2, rejected: 0 }
      ],
      reward_stats: {
        request_status_breakdown: [
          { key: 'pending', label: '等待中', value: 2, tone: 'sky' },
          { key: 'approved', label: '待使用', value: 1, tone: 'mint' }
        ],
        redemption_status_breakdown: [
          { key: 'approved', label: '已兑换', value: 1, tone: 'mint' }
        ],
        usage_trend: [
          { bucket_key: '1', label: '4/1', redeemed: 1, used: 0 },
          { bucket_key: '2', label: '4/2', redeemed: 1, used: 1 }
        ]
      },
      digest: {
        submitted_in_range: 8,
        completed_in_range: 4,
        rejected_in_range: 1,
        redeemed_in_range: 2,
        used_in_range: 1
      }
    }))

    expect(viewModel.summary_signals).toHaveLength(4)
    expect(viewModel.trend_direction).toBe('up')
    expect(viewModel.category_risks[0]?.label).toBe('日常习惯')
    expect(viewModel.reward_fulfillment.pending_carry_count).toBe(4)
    expect(viewModel.risk_flags.some((item) => item.key === 'reward')).toBe(true)
  })
})
