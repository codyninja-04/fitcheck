import { OCCASIONS, OCCASION_LABELS, type Occasion, type OccasionInput } from './types'

export const MAX_DETAIL = 140

// Free text from the "anything else?" box. Collapse whitespace, drop control
// characters and cap the length. It goes into the prompt inside its own tag,
// so this is about keeping it tidy rather than about trust.
export function cleanDetail(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_DETAIL)
  return s || null
}

export function parseOccasion(occasion: unknown, detail: unknown): { ok: true; value: OccasionInput } | { ok: false; error: string } {
  if (typeof occasion !== 'string' || !(OCCASIONS as readonly string[]).includes(occasion)) {
    return { ok: false, error: 'Pick the occasion first.' }
  }
  const d = cleanDetail(detail)
  if (occasion === 'other' && !d) return { ok: false, error: 'Tell me what the occasion is.' }
  return { ok: true, value: { occasion: occasion as Occasion, detail: d } }
}

// "Date", or "Date: rooftop bar, it's humid". For "Other" the detail is the
// occasion, so it stands alone.
export function describeOccasion({ occasion, detail }: OccasionInput): string {
  if (occasion === 'other') return detail ?? 'Other'
  return detail ? `${OCCASION_LABELS[occasion]}: ${detail}` : OCCASION_LABELS[occasion]
}

// Short phrase for headings, "for a date", "for an interview".
export function forOccasion({ occasion, detail }: OccasionInput): string {
  switch (occasion) {
    case 'date':
      return 'for a date'
    case 'interview':
      return 'for an interview'
    case 'work':
      return 'for work'
    case 'casual':
      return 'for a casual day'
    case 'formal_event':
      return 'for a formal event'
    case 'other':
      return detail ? `for ${detail}` : 'for the occasion'
  }
}
