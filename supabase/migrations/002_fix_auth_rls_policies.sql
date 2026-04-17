-- Ensure auth-based ownership defaults and RLS policies are consistent.

alter table public.sipps
  alter column user_id set default auth.uid();

alter table public.wanna_sipps
  alter column user_id set default auth.uid();

alter table public.sipps enable row level security;
alter table public.wanna_sipps enable row level security;

-- Recreate sipps policies in case an older/broken definition exists.
drop policy if exists "Users can view their own sipps" on public.sipps;
drop policy if exists "Users can insert their own sipps" on public.sipps;
drop policy if exists "Users can update their own sipps" on public.sipps;
drop policy if exists "Users can delete their own sipps" on public.sipps;

create policy "Users can view their own sipps"
  on public.sipps
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own sipps"
  on public.sipps
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own sipps"
  on public.sipps
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own sipps"
  on public.sipps
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Recreate wanna_sipps policies as well to keep behavior consistent.
drop policy if exists "Users can view their own wanna_sipps" on public.wanna_sipps;
drop policy if exists "Users can insert their own wanna_sipps" on public.wanna_sipps;
drop policy if exists "Users can update their own wanna_sipps" on public.wanna_sipps;
drop policy if exists "Users can delete their own wanna_sipps" on public.wanna_sipps;

create policy "Users can view their own wanna_sipps"
  on public.wanna_sipps
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own wanna_sipps"
  on public.wanna_sipps
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own wanna_sipps"
  on public.wanna_sipps
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own wanna_sipps"
  on public.wanna_sipps
  for delete
  to authenticated
  using (auth.uid() = user_id);
