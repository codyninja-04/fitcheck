import type { Plan, UsageSummary } from './types'

// From the spec: free gets 5 checks a month, pro gets unlimited checks, a
// history and occasion tips. Plan limits only apply when ENFORCE_PRO is on, so
// the whole app works before billing is wired up. The daily ceilings below
// always apply, because anyone can use this without an account and every
// check is a paid vision call.
export function enforcingPlans(): boolean {
  return process.env.ENFORCE_PRO === 'true'
}

export const FREE_MONTHLY_CHECKS = 5

export const DAILY_CAP_SIGNED_IN = 40
export const DAILY_CAP_ANON = 10
// Per network, for people without an account. Generous because offices and
// campuses share one address, tight enough that clearing cookies in a loop
// doesn't turn into an open API.
export const DAILY_CAP_PER_IP = 30

export interface Limits {
  monthly: number | null
  history: boolean
  tips: boolean
}

export function limitsFor(plan: Plan, signedIn: boolean, enforcing = enforcingPlans()): Limits {
  const pro = plan === 'pro' || !enforcing
  return {
    monthly: pro ? null : FREE_MONTHLY_CHECKS,
    history: signedIn && pro,
    tips: pro,
  }
}

export function startOfUtcMonth(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
}

export function startOfNextUtcMonth(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
}

export function startOfUtcDay(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

export function summarize(used: number, limits: Limits, now = new Date()): UsageSummary {
  return {
    used,
    limit: limits.monthly,
    remaining: limits.monthly === null ? null : Math.max(0, limits.monthly - used),
    resetsAt: startOfNextUtcMonth(now).toISOString(),
  }
}

export interface Counts {
  monthly: number
  daily: number
  ipDaily: number
}

export type Decision = { ok: true } | { ok: false; reason: 'monthly' | 'daily' }

// Whether one more check is allowed. ipDaily only counts for people who
// aren't signed in.
export function decide(counts: Counts, limits: Limits, signedIn: boolean): Decision {
  if (limits.monthly !== null && counts.monthly >= limits.monthly) return { ok: false, reason: 'monthly' }
  if (counts.daily >= (signedIn ? DAILY_CAP_SIGNED_IN : DAILY_CAP_ANON)) return { ok: false, reason: 'daily' }
  if (!signedIn && counts.ipDaily >= DAILY_CAP_PER_IP) return { ok: false, reason: 'daily' }
  return { ok: true }
}

export function limitMessage(reason: 'monthly' | 'daily', summary: UsageSummary): string {
  if (reason === 'daily') return "That's a lot of checks for one day. Give it a rest and try again tomorrow."
  const reset = new Date(summary.resetsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
  return `You've used your ${summary.limit} free checks this month. They come back on ${reset}.`
}
