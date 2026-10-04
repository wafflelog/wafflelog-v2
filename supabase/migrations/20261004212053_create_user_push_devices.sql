create table public.user_push_device (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public."user"(id) on delete cascade,
  expo_push_token text not null unique,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamp with time zone not null default now(),
  last_seen_at timestamp with time zone not null default now()
);

create index user_push_device_user_id_idx
  on public.user_push_device (user_id);

alter table public.user_push_device enable row level security;

grant select, insert, update, delete
  on table public.user_push_device
  to authenticated, service_role;

create policy "Users can read their own push devices"
  on public.user_push_device
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can register their own push devices"
  on public.user_push_device
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own push devices"
  on public.user_push_device
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can remove their own push devices"
  on public.user_push_device
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
