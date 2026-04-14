import { describe, expect, it } from 'vitest'
import {
  getRewardRequestIcon,
  getRewardRequestStatusLabel,
  getRewardRequestSummary,
  getRewardRequestTone
} from '../../src/features/child-portal/helpers'

describe('child reward request status helpers', () => {
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
})
