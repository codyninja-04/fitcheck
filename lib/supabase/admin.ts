import { createClient } from '@supabase/supabase-js'

// Service role client. Only used on the server to read and write the usage
// ledger, which has RLS on and no policies so the browser can't touch it.
// Never import this into a client component.
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
