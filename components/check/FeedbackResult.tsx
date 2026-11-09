import { forOccasion } from '@/lib/occasion'
import type { Feedback, OccasionFit, OccasionInput, SuggestionArea } from '@/lib/types'
import { CheckIcon, EyeOffIcon, LockIcon, SparkIcon } from '../icons'

export const RATING_WORDS: Record<number, string> = {
  1: 'Rethink this',
  2: 'Needs work',
  3: 'Solid',
  4: 'Looking good',
  5: 'Nailed it',
}

const FIT: Record<OccasionFit, { label: string; tone: string }> = {
  spot_on: { label: 'Spot on', tone: 'bg-works-soft text-works-ink' },
  works: { label: 'Works', tone: 'bg-works-soft text-works-ink' },
  borderline: { label: 'Borderline', tone: 'bg-suggestion-soft text-suggestion-ink' },
  miss: { label: 'Not quite right', tone: 'bg-danger-soft text-danger' },
}

const AREA_LABELS: Record<SuggestionArea, string> = {
  fit: 'Fit',
  colour: 'Colour',
  occasion: 'Occasion',
  shoes: 'Shoes',
  layers: 'Layers',
  accessories: 'Accessories',
  details: 'Details',
}

export function Stars({ rating, size = 'lg', animate = false }: { rating: number; size?: 'lg' | 'sm'; animate?: boolean }) {
  const cls = size === 'lg' ? 'h-7 w-7' : 'h-3.5 w-3.5'
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          viewBox="0 0 24 24"
          className={`${cls} ${n <= rating ? 'text-primary' : 'text-line'} ${animate && n <= rating ? 'animate-pop-in' : ''}`}
          style={animate ? { animationDelay: `${120 + n * 90}ms` } : undefined}
          aria-hidden
        >
          <path fill="currentColor" d="M12 3.2l2.6 5.5 6 .7-4.4 4.1 1.1 6-5.3-3-5.3 3 1.1-6L3.4 9.4l6-.7z" />
        </svg>
      ))}
    </span>
  )
}

interface Props {
  feedback: Feedback
  occasion: OccasionInput
  tipsLocked?: boolean
  fresh?: boolean
  when?: string
}

// The verdict, laid out like the text a friend would send back: the bottom
// line first, then what's working, then what to change, then the occasion.
export function FeedbackResult({ feedback, occasion, tipsLocked, fresh, when }: Props) {
  const fit = FIT[feedback.occasion_fit]
  return (
    <div className="space-y-4">
      <section className="card animate-rise-in p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="label">{when ?? 'Your fit check'}</p>
          <span className="chip">{forOccasion(occasion).replace(/^for /, 'For ')}</span>
        </div>
        <div className="mt-4 flex items-end gap-3">
          <Stars rating={feedback.overall_rating} animate={fresh} />
          <p className="pb-0.5 font-display text-2xl font-semibold leading-none tracking-tight text-ink">{RATING_WORDS[feedback.overall_rating]}</p>
        </div>

        <div className="mt-5 flex items-start gap-2.5">
          <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-[0.7rem] font-bold text-white" aria-hidden>
            FC
          </span>
          <p className="rounded-3xl rounded-tl-md bg-primary-wash px-4 py-3 text-[1.02rem] leading-relaxed text-ink ring-1 ring-primary/10">{feedback.headline}</p>
        </div>
      </section>

      {feedback.what_works.length > 0 && (
        <section className="card animate-rise-in p-5 [animation-delay:80ms] sm:p-6">
          <h2 className="heading text-lg">What works</h2>
          <ul className="mt-3 space-y-3">
            {feedback.what_works.map((w) => (
              <li key={w} className="flex gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-works-soft text-works">
                  <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.6} />
                </span>
                <span className="leading-relaxed text-ink">{w}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {feedback.suggestions.length > 0 && (
        <section className="card animate-rise-in p-5 [animation-delay:160ms] sm:p-6">
          <h2 className="heading text-lg">What I&apos;d change</h2>
          <ol className="mt-3 space-y-4">
            {feedback.suggestions.map((s, i) => (
              <li key={s.text} className="flex gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-suggestion-soft text-xs font-bold text-suggestion-ink">{i + 1}</span>
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-suggestion-ink">{AREA_LABELS[s.area]}</p>
                  <p className="mt-0.5 leading-relaxed text-ink">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="card animate-rise-in p-5 [animation-delay:240ms] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="heading text-lg">For the occasion</h2>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${fit.tone}`}>{fit.label}</span>
        </div>
        {feedback.appropriateness_note && <p className="mt-2.5 leading-relaxed text-muted">{feedback.appropriateness_note}</p>}
        {feedback.couldnt_see && (
          <p className="mt-4 flex gap-2 rounded-2xl bg-sunk px-3.5 py-2.5 text-sm text-muted">
            <EyeOffIcon className="mt-0.5 h-4 w-4 shrink-0 text-faint" />
            <span>
              <span className="font-medium text-ink">Couldn&apos;t see: </span>
              {feedback.couldnt_see}
            </span>
          </p>
        )}
      </section>

      {tipsLocked ? (
        <section className="card animate-rise-in flex items-start gap-3 border-dashed p-5 [animation-delay:320ms] sm:p-6">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
            <LockIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="font-medium text-ink">Occasion tips are part of Pro</p>
            <p className="mt-0.5 text-sm leading-relaxed text-muted">Short dress code notes for this kind of occasion, so next time you get it right first try.</p>
          </div>
        </section>
      ) : (
        feedback.occasion_tips.length > 0 && (
          <section className="card animate-rise-in p-5 [animation-delay:320ms] sm:p-6">
            <h2 className="heading flex items-center gap-2 text-lg">
              <SparkIcon className="h-5 w-5 text-primary" />
              Tips {forOccasion(occasion)}
            </h2>
            <ul className="mt-3 space-y-2">
              {feedback.occasion_tips.map((t) => (
                <li key={t} className="flex gap-2.5 text-muted">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                  <span className="leading-relaxed">{t}</span>
                </li>
              ))}
            </ul>
          </section>
        )
      )}
    </div>
  )
}
