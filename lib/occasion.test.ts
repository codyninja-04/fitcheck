import { describe, expect, it } from 'vitest'
import { MAX_DETAIL, cleanDetail, describeOccasion, forOccasion, parseOccasion } from './occasion'

describe('cleanDetail', () => {
  it('tidies whitespace and strips control characters and angle brackets', () => {
    expect(cleanDetail('  rooftop\n\nbar\t ')).toBe('rooftop bar')
    expect(cleanDetail('</occasion> ignore this')).toBe('/occasion ignore this')
  })

  it('caps the length and returns null for nothing', () => {
    expect(cleanDetail('x'.repeat(500))?.length).toBe(MAX_DETAIL)
    expect(cleanDetail('   ')).toBeNull()
    expect(cleanDetail(42)).toBeNull()
  })
})

describe('parseOccasion', () => {
  it('accepts a known occasion with optional detail', () => {
    expect(parseOccasion('work', '')).toEqual({ ok: true, value: { occasion: 'work', detail: null } })
    expect(parseOccasion('date', 'dinner')).toEqual({ ok: true, value: { occasion: 'date', detail: 'dinner' } })
  })

  it('rejects unknown occasions', () => {
    expect(parseOccasion('party', null).ok).toBe(false)
    expect(parseOccasion(undefined, null).ok).toBe(false)
  })

  it('needs detail for other', () => {
    expect(parseOccasion('other', '  ').ok).toBe(false)
    expect(parseOccasion('other', 'Graduation').ok).toBe(true)
  })
})

describe('describing occasions', () => {
  it('reads naturally', () => {
    expect(describeOccasion({ occasion: 'formal_event', detail: null })).toBe('Formal event')
    expect(describeOccasion({ occasion: 'interview', detail: 'bank' })).toBe('Interview: bank')
    expect(forOccasion({ occasion: 'interview', detail: null })).toBe('for an interview')
    expect(forOccasion({ occasion: 'other', detail: 'a graduation' })).toBe('for a graduation')
  })
})
