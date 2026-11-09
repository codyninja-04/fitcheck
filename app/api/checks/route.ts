import { NextResponse } from 'next/server'
import { apiUser } from '@/lib/auth'
import { parseFeedback } from '@/lib/claude/outfit-checker'
import { parseOccasion } from '@/lib/occasion'
import { removePhotos } from '@/lib/photos/server'
import { isOwnPhotoPath } from '@/lib/photos/shared'

// POST saves a check the person just got to their history. The browser has
// already uploaded the photo to their own folder, so this only records the
// path. The feedback is re-validated with the same parser the check uses.
export async function POST(request: Request) {
  const { supabase, user, limits, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized
  if (!limits.history) return NextResponse.json({ error: 'History is part of Pro.' }, { status: 403 })

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ error: "That request didn't come through." }, { status: 400 })

  const occasion = parseOccasion(body.occasion, body.detail)
  if (!occasion.ok) return NextResponse.json({ error: occasion.error }, { status: 400 })

  const parsed = parseFeedback(body.feedback)
  if (!parsed.ok) return NextResponse.json({ error: "That feedback couldn't be saved." }, { status: 400 })

  const photo = body.photo_path ?? null
  if (photo !== null && !isOwnPhotoPath(photo, user.id)) return NextResponse.json({ error: "That photo can't be attached." }, { status: 400 })

  const { data, error } = await supabase
    .from('outfit_checks')
    .insert({
      user_id: user.id,
      photo_url: photo,
      occasion: occasion.value.occasion,
      occasion_detail: occasion.value.detail,
      feedback_text: parsed.feedback.headline,
      feedback: parsed.feedback,
      rating: parsed.feedback.overall_rating,
    })
    .select('id')
    .single()

  if (error || !data) {
    await removePhotos(supabase, [photo])
    return NextResponse.json({ error: "Couldn't save that check. Try again." }, { status: 500 })
  }
  return NextResponse.json({ id: data.id })
}

// DELETE clears the whole history, photos included.
export async function DELETE() {
  const { supabase, user, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized

  const { data, error } = await supabase.from('outfit_checks').delete().eq('user_id', user.id).select('photo_url')
  if (error) return NextResponse.json({ error: "Couldn't clear your history. Try again." }, { status: 500 })
  await removePhotos(
    supabase,
    (data ?? []).map((r) => r.photo_url as string | null),
  )
  return NextResponse.json({ deleted: data?.length ?? 0 })
}
