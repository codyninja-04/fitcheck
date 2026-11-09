'use client'

import type { ComponentType, SVGProps } from 'react'
import { MAX_DETAIL } from '@/lib/occasion'
import { OCCASIONS, OCCASION_LABELS, type Occasion } from '@/lib/types'
import { BowTieIcon, BriefcaseIcon, CoffeeIcon, DotsIcon, HeartIcon, LaptopIcon } from '../icons'

const ICONS: Record<Occasion, ComponentType<SVGProps<SVGSVGElement>>> = {
  date: HeartIcon,
  interview: BriefcaseIcon,
  work: LaptopIcon,
  casual: CoffeeIcon,
  formal_event: BowTieIcon,
  other: DotsIcon,
}

const PLACEHOLDERS: Record<Occasion, string> = {
  date: 'First date, cocktail bar',
  interview: 'Bank, client facing role',
  work: 'Office day with a client meeting',
  casual: 'Brunch with friends, hot day',
  formal_event: 'Evening wedding, black tie optional',
  other: 'Graduation, gallery opening, festival…',
}

interface Props {
  value: Occasion | null
  detail: string
  onChange: (o: Occasion) => void
  onDetail: (d: string) => void
  disabled?: boolean
}

export function OccasionPicker({ value, detail, onChange, onDetail, disabled }: Props) {
  return (
    <fieldset disabled={disabled}>
      <legend className="font-display text-lg font-semibold text-ink">What&apos;s the occasion?</legend>
      <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Occasion">
        {OCCASIONS.map((o) => {
          const Glyph = ICONS[o]
          const on = value === o
          return (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(o)}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-sm font-medium transition active:scale-[0.97] ${
                on ? 'border-primary bg-primary-wash text-primary-ink shadow-[0_0_0_3px_rgba(219,39,119,0.12)]' : 'border-line bg-surface text-muted hover:border-strong hover:text-ink'
              }`}
            >
              <Glyph className={`h-5 w-5 ${on ? 'text-primary' : 'text-faint'}`} />
              {OCCASION_LABELS[o]}
            </button>
          )
        })}
      </div>

      {value && (
        <div className="mt-4 animate-rise-in">
          <label htmlFor="detail" className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-ink">
            {value === 'other' ? 'Where are you going?' : 'Anything I should know?'}
            <span className="text-xs font-normal text-faint">{value === 'other' ? 'Needed' : 'Optional'}</span>
          </label>
          <input
            id="detail"
            className="input"
            value={detail}
            maxLength={MAX_DETAIL}
            placeholder={PLACEHOLDERS[value]}
            onChange={(e) => onDetail(e.target.value)}
            autoComplete="off"
          />
          {detail.length > MAX_DETAIL - 30 && (
            <p className="mt-1 text-right text-xs text-faint">
              {detail.length}/{MAX_DETAIL}
            </p>
          )}
        </div>
      )}
    </fieldset>
  )
}
