alter table public.checklist_item
add column visibility text not null default 'trip';

alter table public.checklist_item
add constraint checklist_item_visibility_check
check (visibility in ('private', 'trip'));

create index if not exists checklist_item_trip_id_idx
on public.checklist_item (trip_id);

drop policy if exists "Trip members can read checklist items"
on public.checklist_item;

drop policy if exists "Users can insert their own checklist items"
on public.checklist_item;

drop policy if exists "Users can update their own checklist items"
on public.checklist_item;

drop policy if exists "Users can delete their own checklist items"
on public.checklist_item;

create policy "Users can read accessible checklist items"
on public.checklist_item
for select
to authenticated
using (
  (
    visibility = 'trip'
    or user_id = (select auth.uid())
  )
  and (
    (select private.current_user_owns_trip(trip_id))
    or exists (
      select 1
      from public.trip_member tm
      where tm.trip_id = checklist_item.trip_id
        and tm.user_id = (select auth.uid())
        and tm.status = 'active'
    )
  )
);

create policy "Users can insert their own accessible checklist items"
on public.checklist_item
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (
    (select private.current_user_owns_trip(trip_id))
    or exists (
      select 1
      from public.trip_member tm
      where tm.trip_id = checklist_item.trip_id
        and tm.user_id = (select auth.uid())
        and tm.status = 'active'
    )
  )
);

create policy "Users can update accessible checklist items"
on public.checklist_item
for update
to authenticated
using (
  (
    visibility = 'trip'
    or user_id = (select auth.uid())
  )
  and (
    (select private.current_user_owns_trip(trip_id))
    or exists (
      select 1
      from public.trip_member tm
      where tm.trip_id = checklist_item.trip_id
        and tm.user_id = (select auth.uid())
        and tm.status = 'active'
    )
  )
)
with check (
  (
    visibility = 'trip'
    or user_id = (select auth.uid())
  )
  and (
    (select private.current_user_owns_trip(trip_id))
    or exists (
      select 1
      from public.trip_member tm
      where tm.trip_id = checklist_item.trip_id
        and tm.user_id = (select auth.uid())
        and tm.status = 'active'
    )
  )
);

create policy "Trip members can delete accessible checklist items"
on public.checklist_item
for delete
to authenticated
using (
  (
    visibility = 'trip'
    or user_id = (select auth.uid())
  )
  and (
    (select private.current_user_owns_trip(trip_id))
    or exists (
      select 1
      from public.trip_member tm
      where tm.trip_id = checklist_item.trip_id
        and tm.user_id = (select auth.uid())
        and tm.status = 'active'
    )
  )
);

create or replace function private.enforce_checklist_item_visibility_immutable()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  if new.visibility is distinct from old.visibility then
    raise exception 'Checklist item visibility cannot be changed';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_checklist_item_visibility_immutable()
from public;
revoke all on function private.enforce_checklist_item_visibility_immutable()
from anon;
revoke all on function private.enforce_checklist_item_visibility_immutable()
from authenticated;

drop trigger if exists enforce_checklist_item_visibility_before_update
on public.checklist_item;

create trigger enforce_checklist_item_visibility_before_update
before update on public.checklist_item
for each row
execute function private.enforce_checklist_item_visibility_immutable();
