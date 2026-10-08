create table public.pin_location (
  pin_id uuid primary key references public.pin(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id text not null,
  display_name text not null,
  formatted_address text not null,
  latitude double precision not null,
  longitude double precision not null,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now()),
  constraint pin_location_place_id_check
    check (char_length(trim(place_id)) > 0),
  constraint pin_location_display_name_check
    check (char_length(trim(display_name)) > 0),
  constraint pin_location_latitude_check
    check (latitude between -90 and 90),
  constraint pin_location_longitude_check
    check (longitude between -180 and 180)
);

create index pin_location_user_id_idx
on public.pin_location (user_id);

alter table public.pin_location enable row level security;

create policy "Trip members can read pin locations"
on public.pin_location
for select
to authenticated
using (
  exists (
    select 1
    from public.pin p
    join public.trip t on t.id = p.trip_id
    where p.id = pin_location.pin_id
      and p.deleted_at is null
      and t.deleted_at is null
      and (
        t.user_id = (select auth.uid())
        or exists (
          select 1
          from public.trip_member tm
          where tm.trip_id = t.id
            and tm.user_id = (select auth.uid())
            and tm.status = 'active'
        )
      )
  )
);

create policy "Pin creators can insert pin locations"
on public.pin_location
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.pin p
    where p.id = pin_location.pin_id
      and p.user_id = (select auth.uid())
      and p.deleted_at is null
  )
);

create policy "Pin creators can update pin locations"
on public.pin_location
for update
to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.pin p
    where p.id = pin_location.pin_id
      and p.user_id = (select auth.uid())
      and p.deleted_at is null
  )
)
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.pin p
    where p.id = pin_location.pin_id
      and p.user_id = (select auth.uid())
      and p.deleted_at is null
  )
);

create policy "Pin creators can delete pin locations"
on public.pin_location
for delete
to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.pin p
    where p.id = pin_location.pin_id
      and p.user_id = (select auth.uid())
  )
);

grant select, insert, update, delete
on table public.pin_location
to authenticated;

grant all
on table public.pin_location
to service_role;
