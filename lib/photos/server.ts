import type { SupabaseClient } from '@supabase/supabase-js'
import { PHOTO_BUCKET } from './shared'

const SIGNED_FOR_SECONDS = 60 * 60

// Turns stored paths into short lived URLs for rendering. Missing files simply
// don't appear in the map.
export async function signPhotos(supabase: SupabaseClient, paths: (string | null | undefined)[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(paths.filter((p): p is string => !!p)))
  if (unique.length === 0) return {}
  const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(unique, SIGNED_FOR_SECONDS)
  const out: Record<string, string> = {}
  for (const row of data ?? []) {
    if (row.path && row.signedUrl) out[row.path] = row.signedUrl
  }
  return out
}

// Best effort cleanup. A leftover file is private and harmless, so a failure
// here doesn't fail the delete.
export async function removePhotos(supabase: SupabaseClient, paths: (string | null | undefined)[]) {
  const list = paths.filter((p): p is string => !!p)
  if (list.length) await supabase.storage.from(PHOTO_BUCKET).remove(list)
}
