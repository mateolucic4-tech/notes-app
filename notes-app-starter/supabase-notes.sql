-- Run once in Supabase SQL Editor after creating the project.
-- Anonymous users receive the authenticated database role, but have is_anonymous=true.
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.notes enable row level security;
grant select, insert on public.notes to authenticated;

-- Remove the policy first so this script can be safely rerun.
drop policy if exists "Users can access their own notes" on public.notes;
create policy "Users can access their own notes"
on public.notes
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
