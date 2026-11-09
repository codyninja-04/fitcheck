import { NextResponse } from 'next/server'
import { getViewer } from '@/lib/auth'
import { checkOutfit } from '@/lib/claude/outfit-checker'
import { claudeAvailable } from '@/lib/claude/client'
import { parseOccasion } from '@/lib/occasion'
import { decodeImage } from '@/lib/photos/shared'
import { decide, limitMessage, summarize } from '@/lib/plan'
import { ANON_COOKIE, ANON_COOKIE_OPTIONS, anonId, countUsage, ipHash, releaseCheck, reserveCheck, type Subject } from '@/lib/usage'

export const runtime = 'nodejs'
export const maxDuration = 60

// POST { image: base64 JPEG/PNG/WebP, occasion, detail? }
// Works with or without an account. Nothing about the photo is stored here.
// Saving to history is a separate, opt in step.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { image?: unknown; occasion?: unknown; detail?: unknown } | null
  if (!body) return NextResponse.json({ error: "That request didn't come through. Try again." }, { status: 400 })

  const occasion = parseOccasion(body.occasion, body.detail)
  if (!occasion.ok) return NextResponse.json({ error: occasion.error }, { status: 400 })

  const image = decodeImage(body.image)
  if (!image.ok) return NextResponse.json({ error: image.error }, { status: 400 })

  if (!claudeAvailable()) {
    return NextResponse.json({ error: "Feedback isn't set up on this server yet (no ANTHROPIC_API_KEY)." }, { status: 503 })
  }

  const { user, limits } = await getViewer()
  const anon = user ? null : anonId()
  const subject: Subject = user ? { userId: user.id, anonId: null } : { userId: null, anonId: anon!.id }
  const ip = ipHash()

  const respond = (data: unknown, init?: ResponseInit) => {
    const res = NextResponse.json(data, init)
    if (anon?.fresh) res.cookies.set(ANON_COOKIE, anon.id, ANON_COOKIE_OPTIONS)
    return res
  }

  const counts = await countUsage(subject, ip)
  const verdict = decide(counts, limits, !!user)
  if (!verdict.ok) {
    const usage = summarize(counts.monthly, limits)
    return respond({ error: limitMessage(verdict.reason, usage), code: 'limit', usage }, { status: 429 })
  }

  const reservation = await reserveCheck(subject, ip)

  try {
    const outcome = await checkOutfit({ base64: image.base64, mediaType: image.mediaType }, occasion.value)
    if (!outcome.ok) {
      await releaseCheck(reservation)
      const error =
        outcome.reason === 'not_outfit'
          ? "I couldn't spot an outfit in that photo. Try a mirror shot with as much of you in frame as you can."
          : "I couldn't make sense of that one. Try again, maybe with a brighter photo."
      return respond({ error, code: outcome.reason, usage: summarize(counts.monthly, limits) }, { status: 422 })
    }

    const feedback = limits.tips ? outcome.feedback : { ...outcome.feedback, occasion_tips: [] }
    return respond({
      feedback,
      tipsLocked: !limits.tips,
      canSave: limits.history,
      usage: summarize(counts.monthly + 1, limits),
    })
  } catch (err) {
    await releaseCheck(reservation)
    const status = (err as { status?: number }).status
    const busy = status === 429 || status === 529
    console.error('check failed', status, (err as Error).message)
    return respond(
      { error: busy ? "It's busy right now. Give it a few seconds and try again." : 'Something went wrong on our side. Your check wasn’t used, so try again.' },
      { status: busy ? 503 : 502 },
    )
  }
}
