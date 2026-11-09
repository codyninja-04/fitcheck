import { createHash, randomUUID } from 'node:crypto'
import { cookies, headers } from 'next/headers'
import { createAdminClient } from './supabase/admin'
import { startOfUtcDay, startOfUtcMonth, type Counts } from './plan'

// Every check, signed in or not, leaves a row in check_usage. The table has
// RLS on and no policies, so only the service role used here can read or
// write it. Anonymous visitors are counted by a random id in a cookie, plus a
// hashed IP for the daily network ceiling. The raw IP is never stored.

export const ANON_COOKIE = 'fc_anon'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(v: unknown): v is string {
  return typeof v === 'string' && UUID.test(v)
}

export type Subject = { userId: string; anonId: null } | { userId: null; anonId: string }

// The anon id from the cookie, or a fresh one. `fresh` tells the route to set
// the cookie on its response.
export function anonId(): { id: string; fresh: boolean } {
  const existing = cookies().get(ANON_COOKIE)?.value
  return isUuid(existing) ? { id: existing, fresh: false } : { id: randomUUID(), fresh: true }
}

export const ANON_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 400,
}

export function ipHash(): string {
  const h = headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
  return createHash('sha256')
    .update(`${process.env.USAGE_SALT || 'fitcheck'}:${ip}`)
    .digest('hex')
    .slice(0, 32)
}

export async function countUsage(subject: Subject, ip: string, now = new Date()): Promise<Counts> {
  const db = createAdminClient()
  const month = startOfUtcMonth(now).toISOString()
  const day = startOfUtcDay(now).toISOString()

  const bySubject = () => {
    const q = db.from('check_usage').select('id', { count: 'exact', head: true })
    return subject.userId ? q.eq('user_id', subject.userId) : q.eq('anon_id', subject.anonId)
  }

  const [monthly, daily, ipDaily] = await Promise.all([
    bySubject().gte('created_at', month),
    bySubject().gte('created_at', day),
    subject.userId ? Promise.resolve({ count: 0 }) : db.from('check_usage').select('id', { count: 'exact', head: true }).eq('ip_hash', ip).gte('created_at', day),
  ])

  return { monthly: monthly.count ?? 0, daily: daily.count ?? 0, ipDaily: ipDaily.count ?? 0 }
}

// Taken before the Claude call so two quick taps can't both slip under the
// limit, and handed back if the call fails or there was no outfit in the
// photo. People shouldn't lose a free check to our error.
export async function reserveCheck(subject: Subject, ip: string): Promise<number | null> {
  const { data } = await createAdminClient()
    .from('check_usage')
    .insert({ user_id: subject.userId, anon_id: subject.anonId, ip_hash: ip })
    .select('id')
    .single()
  return (data?.id as number | undefined) ?? null
}

export async function releaseCheck(id: number | null) {
  if (id !== null) await createAdminClient().from('check_usage').delete().eq('id', id)
}
