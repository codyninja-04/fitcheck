import { cookies } from 'next/headers'
import { CheckFlow } from '@/components/check/CheckFlow'
import { getViewer } from '@/lib/auth'
import { summarize } from '@/lib/plan'
import type { UsageSummary } from '@/lib/types'
import { ANON_COOKIE, countUsage, ipHash, isUuid } from '@/lib/usage'

export const dynamic = 'force-dynamic'

export default async function CheckPage() {
  const { user, limits } = await getViewer()

  // Only worth a query when there's a monthly cap to show.
  let usage: UsageSummary | null = null
  if (limits.monthly !== null) {
    const anon = cookies().get(ANON_COOKIE)?.value
    try {
      if (user) usage = summarize((await countUsage({ userId: user.id, anonId: null }, ipHash())).monthly, limits)
      else if (isUuid(anon)) usage = summarize((await countUsage({ userId: null, anonId: anon }, ipHash())).monthly, limits)
      else usage = summarize(0, limits)
    } catch {
      usage = null
    }
  }

  return <CheckFlow signedIn={!!user} canSave={limits.history} initialUsage={usage} />
}
