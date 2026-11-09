export const OCCASIONS = ['date', 'interview', 'work', 'casual', 'formal_event', 'other'] as const
export type Occasion = (typeof OCCASIONS)[number]

export const OCCASION_LABELS: Record<Occasion, string> = {
  date: 'Date',
  interview: 'Interview',
  work: 'Work',
  casual: 'Casual',
  formal_event: 'Formal event',
  other: 'Other',
}

// What each suggestion is about, so the result can tag it.
export const SUGGESTION_AREAS = ['fit', 'colour', 'occasion', 'shoes', 'layers', 'accessories', 'details'] as const
export type SuggestionArea = (typeof SUGGESTION_AREAS)[number]

// How well the outfit suits the occasion, separate from the overall rating.
// A great casual outfit can still be a miss for an interview.
export const OCCASION_FITS = ['spot_on', 'works', 'borderline', 'miss'] as const
export type OccasionFit = (typeof OCCASION_FITS)[number]

export type Plan = 'free' | 'pro'

export interface Suggestion {
  area: SuggestionArea
  text: string
}

export interface Feedback {
  overall_rating: number
  headline: string
  what_works: string[]
  suggestions: Suggestion[]
  appropriateness_note: string
  occasion_fit: OccasionFit
  occasion_tips: string[]
  couldnt_see: string | null
}

export interface OccasionInput {
  occasion: Occasion
  detail: string | null
}

export interface CheckRow {
  id: string
  checked_at: string
  photo_url: string | null
  occasion: Occasion
  occasion_detail: string | null
  feedback: Feedback
  rating: number
}

// What the page shows about the free allowance. limit is null when nothing is
// being enforced (billing isn't switched on yet).
export interface UsageSummary {
  used: number
  limit: number | null
  remaining: number | null
  resetsAt: string
}
