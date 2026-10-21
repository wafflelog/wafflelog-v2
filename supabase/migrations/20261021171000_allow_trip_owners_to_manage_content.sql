create or replace function private.enforce_trip_content_identity()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  if new.id is distinct from old.id
    or new.trip_id is distinct from old.trip_id
    or new.user_id is distinct from old.user_id
    or new.created_at is distinct from old.created_at then
    raise exception 'Trip content identity fields cannot be changed';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_trip_content_identity() from public;
revoke all on function private.enforce_trip_content_identity() from anon;
revoke all on function private.enforce_trip_content_identity() from authenticated;

drop policy if exists "Users can update their own documents" on public.document;
drop policy if exists "Users can update their own expenses" on public.expense;
drop policy if exists "Users can update their own images" on public.image;
drop policy if exists "Users can update their own notes" on public.note;
drop policy if exists "Users can update their own pins" on public.pin;
drop policy if exists "Users can update their own reference links" on public.reference_link;
drop policy if exists "Users can delete their own documents" on public.document;
drop policy if exists "Users can delete their own expenses" on public.expense;
drop policy if exists "Users can delete their own images" on public.image;
drop policy if exists "Users can delete their own notes" on public.note;
drop policy if exists "Users can delete their own pins" on public.pin;
drop policy if exists "Users can delete their own reference links" on public.reference_link;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'checklist_item',
    'document',
    'expense',
    'image',
    'note',
    'pin',
    'reference_link'
  ] loop
    execute format(
      'drop trigger if exists enforce_trip_content_identity_before_update on public.%I',
      table_name
    );
    execute format(
      'create trigger enforce_trip_content_identity_before_update before update on public.%I for each row execute function private.enforce_trip_content_identity()',
      table_name
    );
  end loop;
end;
$$;

create or replace function private.enforce_pin_location_identity()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  if new.pin_id is distinct from old.pin_id
    or new.user_id is distinct from old.user_id
    or new.created_at is distinct from old.created_at then
    raise exception 'Pin location identity fields cannot be changed';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_pin_location_identity() from public;
revoke all on function private.enforce_pin_location_identity() from anon;
revoke all on function private.enforce_pin_location_identity() from authenticated;

drop trigger if exists enforce_pin_location_identity_before_update
on public.pin_location;

create trigger enforce_pin_location_identity_before_update
before update on public.pin_location
for each row
execute function private.enforce_pin_location_identity();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'document',
    'expense',
    'image',
    'note',
    'pin',
    'reference_link'
  ] loop
    execute format(
      'create policy "Creators and trip owners can update %s" on public.%I for update to authenticated using (user_id = (select auth.uid()) or (select private.current_user_owns_trip(trip_id))) with check (user_id = (select auth.uid()) or (select private.current_user_owns_trip(trip_id)))',
      replace(table_name, '_', ' '),
      table_name
    );

    execute format(
      'create policy "Creators and trip owners can delete %s" on public.%I for delete to authenticated using (user_id = (select auth.uid()) or (select private.current_user_owns_trip(trip_id)))',
      replace(table_name, '_', ' '),
      table_name
    );
  end loop;
end;
$$;

drop policy if exists "Pin creators can update pin locations"
on public.pin_location;

create policy "Pin creators and trip owners can update pin locations"
on public.pin_location
for update
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.pin
    where pin.id = pin_location.pin_id
      and (select private.current_user_owns_trip(pin.trip_id))
  )
)
with check (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.pin
    where pin.id = pin_location.pin_id
      and (select private.current_user_owns_trip(pin.trip_id))
  )
);

drop policy if exists "Pin creators can delete pin locations"
on public.pin_location;

create policy "Pin creators and trip owners can delete pin locations"
on public.pin_location
for delete
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.pin
    where pin.id = pin_location.pin_id
      and (select private.current_user_owns_trip(pin.trip_id))
  )
);

create or replace function private.current_user_owns_storage_trip(
  storage_object_name text
)
returns boolean
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  folders text[];
  trip_id_text text;
begin
  folders := storage.foldername(storage_object_name);
  trip_id_text := folders[2];

  if folders[1] <> 'trip'
    or trip_id_text is null
    or trip_id_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;

  return private.current_user_owns_trip(trip_id_text::uuid);
end;
$$;

revoke all on function private.current_user_owns_storage_trip(text) from public;
grant execute on function private.current_user_owns_storage_trip(text) to authenticated;

drop policy if exists "Storage object owners can delete trip files"
on storage.objects;

create policy "Uploaders and trip owners can delete trip files"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('images', 'travel-documents')
  and (
    owner_id = (select auth.uid()::text)
    or (select private.current_user_owns_storage_trip(name))
  )
  and (select private.current_user_can_access_storage_trip(name))
);
