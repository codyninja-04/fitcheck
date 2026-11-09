import { NextResponse } from 'next/server'
import { apiUser } from '@/lib/auth'
import { removePhotos } from '@/lib/photos/server'
import { isUuid } from '@/lib/usage'

// DELETE removes one saved check and its photo. RLS means a row that isn't
// yours simply isn't found.
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { supabase, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized
  if (!isUuid(params.id)) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  const { data, error } = await supabase.from('outfit_checks').delete().eq('id', params.id).select('photo_url').maybeSingle()
  if (error) return NextResponse.json({ error: "Couldn't delete that check. Try again." }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  await removePhotos(supabase, [data.photo_url as string | null])
  return NextResponse.json({ ok: true })
}
