import { describe, expect, it } from 'vitest'
import {
  groupRewardRequestsByStatus,
  getRewardRequestIcon,
  getRewardRequestStatusLabel,
  getRewardRequestSummary,
  getRewardRequestTone
} from '../../src/features/child-portal/helpers'

describe('child reward request status helpers', () => {
  it('maps pending rewards to 待审核', () => {
    expect(getRewardRequestStatusLabel('pending')).toBe('待审核')
    expect(getRewardRequestTone('pending')).toBe('sky')
    expect(getRewardRequestIcon('pending')).toBe('ph:paper-plane-tilt-fill')
    expect(getRewardRequestSummary({
      request_id: 'request_0',
      title: '周末去公园探险',
      status: 'pending'
    })).toBe('待审核')
  })

  it('maps approved rewards to 待使用', () => {
    expect(getRewardRequestStatusLabel('approved')).toBe('待使用')
    expect(getRewardRequestTone('approved')).toBe('mint')
    expect(getRewardRequestIcon('approved')).toBe('ph:seal-check-fill')
    expect(getRewardRequestSummary({
      request_id: 'request_1',
      title: '晚餐菜单我来选',
      approved_cost_points: 40,
      status: 'approved'
    })).toContain('待使用')
  })

  it('maps rejected rewards to 未通过', () => {
    expect(getRewardRequestStatusLabel('rejected')).toBe('未通过')
    expect(getRewardRequestTone('rejected')).toBe('rose')
    expect(getRewardRequestIcon('rejected')).toBe('ph:seal-warning-fill')
    expect(getRewardRequestSummary({
      request_id: 'request_2',
      title: '全天动画加时',
      status: 'rejected'
    })).toBe('未通过')
  })

  it('maps fulfilled rewards to 已使用', () => {
    expect(getRewardRequestStatusLabel('fulfilled')).toBe('已使用')
    expect(getRewardRequestTone('fulfilled')).toBe('amber')
    expect(getRewardRequestIcon('fulfilled')).toBe('ph:check-circle-fill')
    expect(getRewardRequestSummary({
      request_id: 'request_3',
      title: '吃一个冰淇淋',
      status: 'fulfilled'
    })).toBe('已使用')
  })

  it('groups reward requests into the four visible status buckets', () => {
    const grouped = groupRewardRequestsByStatus([
      { request_id: 'request_1', title: '一起露营', status: 'approved' },
      { request_id: 'request_2', title: '周末去公园', status: 'pending' },
      { request_id: 'request_3', title: '动画加时', status: 'rejected' },
      { request_id: 'request_4', title: '冰淇淋', status: 'fulfilled' },
      { request_id: 'request_5', title: '新玩具', status: 'pending' }
    ])

    expect(grouped.approved.map((item) => item.request_id)).toEqual(['request_1'])
    expect(grouped.pending.map((item) => item.request_id)).toEqual(['request_2', 'request_5'])
    expect(grouped.rejected.map((item) => item.request_id)).toEqual(['request_3'])
    expect(grouped.fulfilled.map((item) => item.request_id)).toEqual(['request_4'])
  })
})
