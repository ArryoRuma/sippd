-- Funnel conversion event tracking for marketing -> signup -> onboarding.

create table if not exists public.funnel_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  source text not null default 'web',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_funnel_events_created_at on public.funnel_events(created_at desc);
create index if not exists idx_funnel_events_event_name on public.funnel_events(event_name);
create index if not exists idx_funnel_events_user_id on public.funnel_events(user_id);

alter table public.funnel_events enable row level security;

drop policy if exists "Anyone can insert funnel events" on public.funnel_events;
drop policy if exists "Users can view their own funnel events" on public.funnel_events;

create policy "Anyone can insert funnel events"
  on public.funnel_events
  for insert
  to anon, authenticated
  with check (true);

create policy "Users can view their own funnel events"
  on public.funnel_events
  for select
  to authenticated
  using (auth.uid() = user_id);
