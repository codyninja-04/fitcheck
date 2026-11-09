import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FeedbackResult } from '@/components/check/FeedbackResult'
import { DeleteCheckButton } from '@/components/history/DeleteButtons'
import { ArrowLeftIcon } from '@/components/icons'
import { requireUser } from '@/lib/auth'
import { parseFeedback } from '@/lib/claude/outfit-checker'
import { signPhotos } from '@/lib/photos/server'
import type { CheckRow } from '@/lib/types'
import { isUuid } from '@/lib/usage'

export const metadata: Metadata = { title: 'Check' }
export const dynamic = 'force-dynamic'

export default async function CheckDetailPage({ params }: { params: { id: string } }) {
  const { supabase, limits } = await requireUser(`/history/${params.id}`)
  if (!isUuid(params.id)) notFound()

  const { data } = await supabase
    .from('outfit_checks')
    .select('id, checked_at, photo_url, occasion, occasion_detail, feedback, rating')
    .eq('id', params.id)
    .maybeSingle()
  if (!data) notFound()

  const row = data as CheckRow
  const parsed = parseFeedback(row.feedback)
  if (!parsed.ok) notFound()
  const src = row.photo_url ? (await signPhotos(supabase, [row.photo_url]))[row.photo_url] : null
  const when = new Date(row.checked_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 lg:pt-10">
      <Link href="/history" className="btn-quiet -ml-3 px-3">
        <ArrowLeftIcon className="h-4 w-4" />
        All checks
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-10">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="mx-auto w-44 sm:w-52 lg:w-full">
            <div className="mirror aspect-[3/4] shadow-lift ring-1 ring-black/5">
              {src ? <img src={src} alt="Outfit" className="absolute inset-0 h-full w-full object-cover" /> : <span className="absolute inset-0 grid place-items-center text-sm text-faint">No photo</span>}
            </div>
          </div>
        </div>

        <div>
          <FeedbackResult feedback={parsed.feedback} occasion={{ occasion: row.occasion, detail: row.occasion_detail }} tipsLocked={!limits.tips} when={when} />
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link href="/" className="btn-primary">
              New check
            </Link>
            <DeleteCheckButton id={row.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
