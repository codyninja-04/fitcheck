import type { Metadata } from 'next'
import Link from 'next/link'
import { RATING_WORDS, Stars } from '@/components/check/FeedbackResult'
import { ClearHistoryButton } from '@/components/history/DeleteButtons'
import { LockIcon } from '@/components/icons'
import { requireUser } from '@/lib/auth'
import { forOccasion } from '@/lib/occasion'
import { signPhotos } from '@/lib/photos/server'
import type { CheckRow } from '@/lib/types'

export const metadata: Metadata = { title: 'History' }
export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const { supabase, limits } = await requireUser('/history')

  if (!limits.history) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary">
          <LockIcon className="h-5 w-5" />
        </span>
        <h1 className="heading mt-5 text-3xl">History is part of Pro</h1>
        <p className="mt-3 leading-relaxed text-muted">Pro keeps every check with its photo so you can see what worked for the last interview or date. Checking outfits stays free.</p>
        <Link href="/" className="btn-primary mt-7">
          Check an outfit
        </Link>
      </div>
    )
  }

  const { data } = await supabase
    .from('outfit_checks')
    .select('id, checked_at, photo_url, occasion, occasion_detail, feedback, rating')
    .order('checked_at', { ascending: false })
    .limit(200)
  const rows = (data ?? []) as CheckRow[]
  const photos = await signPhotos(
    supabase,
    rows.map((r) => r.photo_url),
  )

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 lg:pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Your history</p>
          <h1 className="heading mt-2 text-4xl sm:text-5xl">Past checks</h1>
        </div>
        <Link href="/" className="btn-primary">
          New check
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="card mt-10 px-6 py-14 text-center">
          <p className="font-display text-xl font-semibold text-ink">Nothing saved yet</p>
          <p className="mx-auto mt-2 max-w-sm text-muted">After a check, tap “Save to history” and it lands here with the photo, so you can look back before the next big day.</p>
          <Link href="/" className="btn-ghost mt-6">
            Check an outfit
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
            {rows.map((r, i) => {
              const src = r.photo_url ? photos[r.photo_url] : null
              return (
                <li key={r.id} className="animate-rise-in" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
                  <Link href={`/history/${r.id}`} className="group block">
                    <div className="mirror aspect-[3/4] ring-1 ring-black/5 transition group-hover:shadow-lift">
                      {src ? (
                        <img src={src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                      ) : (
                        <span className="absolute inset-0 grid place-items-center text-sm text-faint">No photo</span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <Stars rating={r.rating} size="sm" />
                      <span className="text-xs text-faint">{formatDate(r.checked_at)}</span>
                    </div>
                    <p className="mt-1 truncate text-sm font-medium text-ink">{RATING_WORDS[r.rating]}</p>
                    <p className="truncate text-sm text-muted">{capitalise(forOccasion({ occasion: r.occasion, detail: r.occasion_detail }))}</p>
                  </Link>
                </li>
              )
            })}
          </ul>
          <div className="mt-14 border-t border-line pt-6">
            <ClearHistoryButton count={rows.length} />
          </div>
        </>
      )}
    </div>
  )
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
