'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { describeOccasion, forOccasion, parseOccasion } from '@/lib/occasion'
import { blobToDataUrl, dataUrlToBlob, preparePhoto, removeCheckPhoto, uploadCheckPhoto } from '@/lib/photos/client'
import type { Feedback, Occasion, OccasionInput, UsageSummary } from '@/lib/types'
import { ArrowRightIcon, CheckIcon, ClockIcon } from '../icons'
import { FeedbackResult } from './FeedbackResult'
import { OccasionPicker } from './OccasionPicker'
import { PhotoCapture } from './PhotoCapture'

// A check that was finished before signing in. Kept for one hop in session
// storage so "Sign in to save" doesn't throw the result away.
const PENDING_KEY = 'fitcheck:pending'

interface Result {
  feedback: Feedback
  occasion: OccasionInput
  tipsLocked: boolean
}

type SaveState = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved' } | { kind: 'error'; message: string }

interface Props {
  signedIn: boolean
  canSave: boolean
  initialUsage: UsageSummary | null
}

export function CheckFlow({ signedIn, canSave, initialUsage }: Props) {
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [preparing, setPreparing] = useState(false)
  const [occasion, setOccasion] = useState<Occasion | null>(null)
  const [detail, setDetail] = useState('')
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [usage, setUsage] = useState<UsageSummary | null>(initialUsage)
  const [save, setSave] = useState<SaveState>({ kind: 'idle' })
  const topRef = useRef<HTMLDivElement>(null)

  // Swap object URLs cleanly so old previews don't leak.
  useEffect(() => {
    if (!photo) return setPreview(null)
    const url = URL.createObjectURL(photo)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  // Pick up a result that was waiting on sign in.
  useEffect(() => {
    let raw: string | null = null
    try {
      raw = sessionStorage.getItem(PENDING_KEY)
      sessionStorage.removeItem(PENDING_KEY)
    } catch {
      return
    }
    if (!raw || !signedIn) return
    try {
      const pending = JSON.parse(raw) as Result & { photo: string }
      dataUrlToBlob(pending.photo).then((blob) => {
        setPhoto(blob)
        setOccasion(pending.occasion.occasion)
        setDetail(pending.occasion.detail ?? '')
        setResult({ feedback: pending.feedback, occasion: pending.occasion, tipsLocked: pending.tipsLocked })
      })
    } catch {
      // A broken stash just means starting fresh.
    }
  }, [signedIn])

  const outOfChecks = usage?.remaining === 0
  const ready = !!photo && !!occasion && (occasion !== 'other' || detail.trim().length > 0) && !checking && !outOfChecks

  async function pickFile(file: File) {
    setError(null)
    setPreparing(true)
    try {
      setPhoto(await preparePhoto(file))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setPreparing(false)
    }
  }

  async function runCheck() {
    if (!photo || !occasion) return
    const parsed = parseOccasion(occasion, detail)
    if (!parsed.ok) return setError(parsed.error)

    setChecking(true)
    setError(null)
    try {
      const image = await blobToDataUrl(photo)
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, occasion: parsed.value.occasion, detail: parsed.value.detail }),
      })
      const data = await res.json().catch(() => ({}))
      if (data.usage) setUsage(data.usage)
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.')
      setResult({ feedback: data.feedback, occasion: parsed.value, tipsLocked: !!data.tipsLocked })
      setSave({ kind: 'idle' })
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch (e) {
      setError(e instanceof TypeError ? "Couldn't reach FitCheck. Check your connection and try again." : (e as Error).message)
    } finally {
      setChecking(false)
    }
  }

  async function saveToHistory() {
    if (!result || !photo) return
    setSave({ kind: 'saving' })
    let path: string | null = null
    try {
      path = await uploadCheckPhoto(photo)
      const res = await fetch('/api/checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_path: path, occasion: result.occasion.occasion, detail: result.occasion.detail, feedback: result.feedback }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Couldn't save that check.")
      setSave({ kind: 'saved' })
    } catch (e) {
      if (path) removeCheckPhoto(path).catch(() => undefined)
      setSave({ kind: 'error', message: (e as Error).message })
    }
  }

  async function signInToSave() {
    if (!result || !photo) return
    try {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({ ...result, photo: await blobToDataUrl(photo) }))
    } catch {
      // Storage full or blocked. They can still sign in, they'll just check again.
    }
    window.location.href = '/login?next=/'
  }

  function checkAnother() {
    setResult(null)
    setPhoto(null)
    setOccasion(null)
    setDetail('')
    setError(null)
    setSave({ kind: 'idle' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Result view: the photo stays on the left (or top) and the verdict reads down the right.
  if (result) {
    return (
      <div ref={topRef} className="mx-auto grid max-w-5xl scroll-mt-20 gap-6 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-10 lg:pt-10">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="mx-auto w-40 sm:w-48 lg:w-full">
            {preview && (
              <div className="mirror aspect-[3/4] shadow-lift ring-1 ring-black/5">
                <img src={preview} alt="Your outfit" className="absolute inset-0 h-full w-full object-cover" />
              </div>
            )}
          </div>
        </div>

        <div>
          <FeedbackResult feedback={result.feedback} occasion={result.occasion} tipsLocked={result.tipsLocked} fresh />

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <button type="button" onClick={checkAnother} className="btn-primary flex-1 py-3">
              Check another
              <ArrowRightIcon className="h-4 w-4" />
            </button>
            <SaveButton state={save} signedIn={signedIn} canSave={canSave} onSave={saveToHistory} onSignIn={signInToSave} />
          </div>
          {save.kind === 'error' && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {save.message}
            </p>
          )}
          {signedIn && !canSave && <p className="mt-3 text-center text-sm text-faint sm:text-left">Saving checks to a history is part of Pro.</p>}
          <UsageNote usage={usage} />
        </div>
      </div>
    )
  }

  return (
    <div ref={topRef} className="mx-auto grid max-w-5xl gap-7 px-4 pb-28 pt-8 sm:px-6 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-x-14 lg:pb-16 lg:pt-14">
      <div className="lg:col-start-2 lg:row-start-1">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-ink">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Second opinion, no sign up
        </p>
        <h1 className="heading mt-4 text-[2.6rem] leading-[1.02] sm:text-6xl">Does this look okay?</h1>
        <p className="mt-4 max-w-md text-[1.05rem] leading-relaxed text-muted">
          Snap your outfit, say where you&apos;re going, and get the honest answer a friend with a good eye would text back. Even at 7am.
        </p>
      </div>

      <div className="lg:col-start-1 lg:row-span-2 lg:row-start-1">
        <PhotoCapture preview={preview} onFile={pickFile} onClear={() => setPhoto(null)} preparing={preparing} scanning={checking} locked={checking} />
      </div>

      <div className="lg:col-start-2 lg:row-start-2">
        {checking ? (
          <Thinking occasion={occasion ? { occasion, detail: detail.trim() || null } : null} />
        ) : (
          <OccasionPicker value={occasion} detail={detail} onChange={setOccasion} onDetail={setDetail} disabled={checking} />
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        {outOfChecks && usage ? (
          <OutOfChecks usage={usage} signedIn={signedIn} />
        ) : (
          !checking && (
            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line/70 bg-bg/90 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:static lg:mt-7 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
              <button type="button" onClick={runCheck} disabled={!ready} className="btn-primary w-full py-3.5 text-base lg:w-auto lg:px-10">
                Check my fit
              </button>
              <p className="mt-2 text-center text-xs text-faint lg:text-left">{hint(!!photo, occasion, detail)}</p>
            </div>
          )
        )}
        <UsageNote usage={usage} />
      </div>
    </div>
  )
}

function hint(hasPhoto: boolean, occasion: Occasion | null, detail: string): string {
  if (!hasPhoto && !occasion) return 'Add a photo and pick the occasion.'
  if (!hasPhoto) return 'Now add a photo of the outfit.'
  if (!occasion) return 'Now pick the occasion.'
  if (occasion === 'other' && !detail.trim()) return 'Say where you are going.'
  return 'Takes about ten seconds. Your photo is not stored unless you save it.'
}

function SaveButton({ state, signedIn, canSave, onSave, onSignIn }: { state: SaveState; signedIn: boolean; canSave: boolean; onSave: () => void; onSignIn: () => void }) {
  if (!signedIn) {
    return (
      <button type="button" onClick={onSignIn} className="btn-ghost flex-1 py-3">
        Sign in to save
      </button>
    )
  }
  if (!canSave) return null
  if (state.kind === 'saved') {
    return (
      <Link href="/history" className="btn-ghost flex-1 py-3 text-works-ink">
        <CheckIcon className="h-4 w-4" strokeWidth={2.4} />
        Saved · View history
      </Link>
    )
  }
  return (
    <button type="button" onClick={onSave} disabled={state.kind === 'saving'} className="btn-ghost flex-1 py-3">
      <ClockIcon className="h-4 w-4" />
      {state.kind === 'saving' ? 'Saving…' : 'Save to history'}
    </button>
  )
}

const STEPS = ['Looking at how everything sits', 'Checking the colours together', 'Thinking about where you’re going', 'Writing it up honestly']

function Thinking({ occasion }: { occasion: OccasionInput | null }) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 2600)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="animate-rise-in" aria-live="polite">
      {occasion && (
        <div className="flex justify-end">
          <p className="max-w-[85%] rounded-3xl rounded-br-md bg-ink px-4 py-2.5 text-[0.95rem] text-white">
            Does this work {forOccasion(occasion)}? Be honest.
          </p>
        </div>
      )}
      <div className="mt-3 flex items-start gap-2.5">
        <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-[0.7rem] font-bold text-white" aria-hidden>
          FC
        </span>
        <div className="rounded-3xl rounded-tl-md bg-surface px-4 py-3 shadow-card ring-1 ring-line">
          <span className="flex gap-1" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-2 w-2 animate-typing rounded-full bg-primary" style={{ animationDelay: `${i * 160}ms` }} />
            ))}
          </span>
        </div>
      </div>
      <p className="mt-3 pl-10 text-sm text-faint">{STEPS[step]}…</p>
      <span className="sr-only">Checking your outfit {occasion ? `for ${describeOccasion(occasion)}` : ''}</span>
    </div>
  )
}

function OutOfChecks({ usage, signedIn }: { usage: UsageSummary; signedIn: boolean }) {
  const reset = new Date(usage.resetsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' })
  return (
    <div className="mt-6 rounded-3xl border border-primary/20 bg-primary-wash p-5">
      <p className="font-display text-lg font-semibold text-ink">That&apos;s your {usage.limit} free checks for this month</p>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        They come back on {reset}. Pro (US$4 a month) is on the way, with unlimited checks, a saved history and occasion tips.
      </p>
      {!signedIn && (
        <Link href="/login" className="btn-ghost mt-4 py-2.5">
          Sign in
        </Link>
      )}
    </div>
  )
}

function UsageNote({ usage }: { usage: UsageSummary | null }) {
  if (!usage || usage.limit === null || usage.remaining === 0) return null
  return (
    <p className="mt-4 text-center text-xs text-faint lg:text-left">
      {usage.remaining} of {usage.limit} free checks left this month
    </p>
  )
}
