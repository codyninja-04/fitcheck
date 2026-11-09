import { describe, expect, it } from 'vitest'
import { DAILY_CAP_ANON, DAILY_CAP_PER_IP, DAILY_CAP_SIGNED_IN, FREE_MONTHLY_CHECKS, decide, limitMessage, limitsFor, startOfNextUtcMonth, startOfUtcMonth, summarize } from './plan'

describe('limitsFor', () => {
  it('unlocks everything while plans are not enforced', () => {
    expect(limitsFor('free', true, false)).toEqual({ monthly: null, history: true, tips: true })
    expect(limitsFor('free', false, false)).toEqual({ monthly: null, history: false, tips: true })
  })

  it('applies the free tier when enforced', () => {
    expect(limitsFor('free', true, true)).toEqual({ monthly: FREE_MONTHLY_CHECKS, history: false, tips: false })
    expect(limitsFor('pro', true, true)).toEqual({ monthly: null, history: true, tips: true })
  })
})

describe('month boundaries', () => {
  it('works in UTC and rolls over the year', () => {
    const now = new Date('2026-12-31T23:30:00Z')
    expect(startOfUtcMonth(now).toISOString()).toBe('2026-12-01T00:00:00.000Z')
    expect(startOfNextUtcMonth(now).toISOString()).toBe('2027-01-01T00:00:00.000Z')
  })
})

describe('summarize', () => {
  const now = new Date('2026-11-09T10:00:00Z')
  it('counts down the free checks without going negative', () => {
    const free = limitsFor('free', false, true)
    expect(summarize(2, free, now)).toEqual({ used: 2, limit: 5, remaining: 3, resetsAt: '2026-12-01T00:00:00.000Z' })
    expect(summarize(9, free, now).remaining).toBe(0)
  })

  it('has no limit when unlimited', () => {
    expect(summarize(12, limitsFor('pro', true, true), now)).toMatchObject({ limit: null, remaining: null })
  })
})

describe('decide', () => {
  const free = limitsFor('free', false, true)
  const open = limitsFor('free', false, false)

  it('allows a check under every limit', () => {
    expect(decide({ monthly: 4, daily: 1, ipDaily: 1 }, free, false)).toEqual({ ok: true })
  })

  it('stops at the monthly allowance', () => {
    expect(decide({ monthly: 5, daily: 0, ipDaily: 0 }, free, false)).toEqual({ ok: false, reason: 'monthly' })
  })

  it('always applies the daily ceilings, even when plans are off', () => {
    expect(decide({ monthly: 0, daily: DAILY_CAP_ANON, ipDaily: 0 }, open, false)).toEqual({ ok: false, reason: 'daily' })
    expect(decide({ monthly: 0, daily: 0, ipDaily: DAILY_CAP_PER_IP }, open, false)).toEqual({ ok: false, reason: 'daily' })
    expect(decide({ monthly: 0, daily: DAILY_CAP_SIGNED_IN, ipDaily: 0 }, open, true)).toEqual({ ok: false, reason: 'daily' })
  })

  it('ignores the network ceiling for signed in people', () => {
    expect(decide({ monthly: 0, daily: 1, ipDaily: 999 }, open, true)).toEqual({ ok: true })
  })
})

describe('limitMessage', () => {
  it('says when checks come back', () => {
    const usage = summarize(5, limitsFor('free', false, true), new Date('2026-11-09T10:00:00Z'))
    expect(limitMessage('monthly', usage)).toBe("You've used your 5 free checks this month. They come back on 1 Dec.")
  })
})
