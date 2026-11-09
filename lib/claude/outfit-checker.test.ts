import { describe, expect, it, vi } from 'vitest'

vi.mock('./client', () => ({ anthropic: {}, CLAUDE_MODEL: 'test' }))

import { clampRating, occasionPrompt, parseFeedback } from './outfit-checker'

const good = {
  is_outfit: true,
  overall_rating: 4,
  headline: 'Good for the interview. Tuck the shirt and you are there.',
  what_works: ['Navy and grey are calm together', 'Trousers break just right on the shoe'],
  suggestions: [{ area: 'fit', text: 'Tuck the shirt in fully, the front is bunching at the belt.' }],
  appropriateness_note: 'Smart enough for a bank interview without a tie.',
  occasion_fit: 'works',
  occasion_tips: ['Plain over patterned', 'Polish your shoes'],
  couldnt_see: null,
}

describe('parseFeedback', () => {
  it('passes a clean tool call through', () => {
    const r = parseFeedback(good)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.feedback.overall_rating).toBe(4)
    expect(r.feedback.suggestions[0]).toEqual({ area: 'fit', text: good.suggestions[0].text })
    expect(r.feedback.occasion_fit).toBe('works')
    expect(r.feedback.couldnt_see).toBeNull()
  })

  it('says not_outfit when there is no outfit', () => {
    expect(parseFeedback({ ...good, is_outfit: false })).toEqual({ ok: false, reason: 'not_outfit' })
  })

  it('rejects garbage', () => {
    expect(parseFeedback(null)).toEqual({ ok: false, reason: 'unreadable' })
    expect(parseFeedback('hi')).toEqual({ ok: false, reason: 'unreadable' })
    expect(parseFeedback({ overall_rating: 3 })).toEqual({ ok: false, reason: 'unreadable' })
  })

  it('clamps and rounds the rating', () => {
    expect(clampRating(7)).toBe(5)
    expect(clampRating(0)).toBe(1)
    expect(clampRating(3.6)).toBe(4)
    expect(clampRating('2')).toBe(2)
    expect(clampRating('nope')).toBe(3)
  })

  it('dedupes, trims and caps the lists', () => {
    const r = parseFeedback({
      ...good,
      what_works: ['  Nice   colours ', 'nice colours', '', 'a', 'b', 'c', 'd'],
      suggestions: [
        { area: 'colour', text: 'One' },
        { area: 'colour', text: 'one' },
        { area: 'made-up', text: 'Two' },
        'Three as a bare string',
        { area: 'fit', text: '' },
        { area: 'fit', text: 'Four' },
        { area: 'fit', text: 'Five' },
      ],
    })
    if (!r.ok) throw new Error('expected ok')
    expect(r.feedback.what_works).toEqual(['Nice colours', 'a', 'b', 'c'])
    expect(r.feedback.suggestions.map((s) => s.text)).toEqual(['One', 'Two', 'Three as a bare string', 'Four'])
    expect(r.feedback.suggestions[1].area).toBe('details')
  })

  it('fills the occasion fit from the rating when it is missing', () => {
    const r = parseFeedback({ ...good, overall_rating: 2, occasion_fit: 'meh' })
    if (!r.ok) throw new Error('expected ok')
    expect(r.feedback.occasion_fit).toBe('miss')
  })

  it('drops "none" style answers for couldnt_see', () => {
    for (const v of ['None', 'n/a', 'Nothing.', 'null']) {
      const r = parseFeedback({ ...good, couldnt_see: v })
      if (!r.ok) throw new Error('expected ok')
      expect(r.feedback.couldnt_see).toBeNull()
    }
    const r = parseFeedback({ ...good, couldnt_see: 'Your shoes are out of frame' })
    if (!r.ok) throw new Error('expected ok')
    expect(r.feedback.couldnt_see).toBe('Your shoes are out of frame')
  })

  it('writes a fallback headline', () => {
    const r = parseFeedback({ ...good, headline: '' })
    if (!r.ok) throw new Error('expected ok')
    expect(r.feedback.headline).toBe('A few things to sort before you go.')
  })
})

describe('occasionPrompt', () => {
  it('wraps the occasion in its own tag', () => {
    expect(occasionPrompt({ occasion: 'date', detail: 'rooftop bar' })).toContain('<occasion>Date: rooftop bar</occasion>')
    expect(occasionPrompt({ occasion: 'other', detail: 'Graduation' })).toContain('<occasion>Graduation</occasion>')
  })
})
