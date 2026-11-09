'use client'

import { createBrowserClient } from '@supabase/ssr'

// Browser side client for Google sign in and for uploading a photo you chose
// to save. Storage RLS keeps uploads inside your own folder.
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}
