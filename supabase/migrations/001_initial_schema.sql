-- FitCheck schema.
--
-- Changes from the spec, and why:
-- * The spec's policy "user_id = auth.uid() or user_id is null" would let any
--   visitor read and delete every anonymous check. Anonymous checks are never
--   stored here instead. Only signed in people who tap "Save to history" get a
--   row, so user_id is required and every policy is owner only.
-- * feedback is kept as jsonb so the history page can show the full result.
--   feedback_text holds the one line verdict for quick reading in SQL.
-- * check_usage counts checks for the free allowance and the daily ceilings,
--   including anonymous ones (by a random cookie id and a hashed IP). RLS is
--   on with no policies, so only the server's service role can touch it.
-- * profiles holds the plan. There are no insert or update policies, so the
--   browser can't upgrade itself. Billing writes it with the service role.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "read own profile" on public.profiles
  for select using (user_id = auth.uid());

create table if not exists public.outfit_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checked_at timestamptz not null default now(),
  -- Storage path in the private outfit-photos bucket, not a public URL.
  photo_url text check (photo_url is null or photo_url like user_id::text || '/checks/%'),
  occasion text not null check (occasion in ('date', 'interview', 'work', 'casual', 'formal_event', 'other')),
  occasion_detail text check (occasion_detail is null or char_length(occasion_detail) <= 140),
  feedback_text text not null,
  feedback jsonb not null,
  rating integer not null check (rating between 1 and 5)
);

create index if not exists idx_checks_user on public.outfit_checks(user_id, checked_at desc);

alter table public.outfit_checks enable row level security;

create policy "read own checks" on public.outfit_checks
  for select using (user_id = auth.uid());

create policy "save own checks" on public.outfit_checks
  for insert with check (user_id = auth.uid());

create policy "delete own checks" on public.outfit_checks
  for delete using (user_id = auth.uid());

create table if not exists public.check_usage (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  anon_id uuid,
  ip_hash text not null,
  created_at timestamptz not null default now(),
  check (user_id is not null or anon_id is not null)
);

create index if not exists idx_usage_user on public.check_usage(user_id, created_at) where user_id is not null;
create index if not exists idx_usage_anon on public.check_usage(anon_id, created_at) where anon_id is not null;
create index if not exists idx_usage_ip on public.check_usage(ip_hash, created_at);

alter table public.check_usage enable row level security;

-- Photos. Private bucket, JPEG only, 5 MB max. Each person can only reach
-- files under their own user id folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('outfit-photos', 'outfit-photos', false, 5242880, array['image/jpeg'])
on conflict (id) do nothing;

create policy "upload own outfit photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'outfit-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "read own outfit photos" on storage.objects
  for select to authenticated
  using (bucket_id = 'outfit-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "delete own outfit photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'outfit-photos' and (storage.foldername(name))[1] = auth.uid()::text);
