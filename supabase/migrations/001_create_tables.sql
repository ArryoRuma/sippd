-- ============================================================
-- Sippd Database Schema
-- Run this in the Supabase SQL Editor (or via migrations)
-- ============================================================

-- Table: sipps (coffee ratings)
create table if not exists public.sipps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  roaster text not null,
  roast_type text not null,
  origin text not null,
  method text not null,
  aroma smallint not null check (aroma between 1 and 10),
  flavor smallint not null check (flavor between 1 and 10),
  acidity smallint not null check (acidity between 1 and 10),
  body smallint not null check (body between 1 and 10),
  aftertaste smallint not null check (aftertaste between 1 and 10),
  overall smallint generated always as (aroma + flavor + acidity + body + aftertaste) stored,
  created_at timestamptz not null default now()
);

-- Table: wanna_sipps (wishlist)
create table if not exists public.wanna_sipps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  roaster text not null,
  roast_type text,
  origin text,
  method text,
  notes text,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.sipps enable row level security;
alter table public.wanna_sipps enable row level security;

-- Policies for sipps
create policy "Users can view their own sipps"
  on public.sipps for select
  using (auth.uid() = user_id);

create policy "Users can insert their own sipps"
  on public.sipps for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own sipps"
  on public.sipps for update
  using (auth.uid() = user_id);

create policy "Users can delete their own sipps"
  on public.sipps for delete
  using (auth.uid() = user_id);

-- Policies for wanna_sipps
create policy "Users can view their own wanna_sipps"
  on public.wanna_sipps for select
  using (auth.uid() = user_id);

create policy "Users can insert their own wanna_sipps"
  on public.wanna_sipps for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own wanna_sipps"
  on public.wanna_sipps for update
  using (auth.uid() = user_id);

create policy "Users can delete their own wanna_sipps"
  on public.wanna_sipps for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Indexes for performance
-- ============================================================

create index if not exists idx_sipps_user_id on public.sipps(user_id);
create index if not exists idx_sipps_overall on public.sipps(overall desc);
create index if not exists idx_sipps_created_at on public.sipps(created_at desc);
create index if not exists idx_wanna_sipps_user_id on public.wanna_sipps(user_id);
