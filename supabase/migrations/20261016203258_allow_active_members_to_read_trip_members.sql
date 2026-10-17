create or replace function private.current_user_active_trip_ids()
returns setof uuid
language sql
stable
security definer
set search_path to ''
as $$
  select tm.trip_id
  from public.trip_member tm
  where tm.user_id = (select auth.uid())
    and tm.status = 'active'
$$;

revoke all on function private.current_user_active_trip_ids() from public;
revoke all on function private.current_user_active_trip_ids() from anon;
grant execute on function private.current_user_active_trip_ids() to authenticated;

drop policy if exists "Trip members can read trip members"
on public.trip_member;

create policy "Trip participants can read active trip members"
on public.trip_member
for select
to authenticated
using (
  (select private.current_user_owns_trip(trip_id))
  or (
    status = 'active'
    and trip_id in (select private.current_user_active_trip_ids())
  )
);
