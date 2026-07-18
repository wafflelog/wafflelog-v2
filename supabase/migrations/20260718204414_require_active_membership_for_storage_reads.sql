insert into storage.buckets (id, name, public)
values
  ('images', 'images', false),
  ('travel-documents', 'travel-documents', false)
on conflict (id) do nothing;

create or replace function private.current_user_can_access_storage_trip(
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

  return exists (
    select 1
    from public.trip t
    where t.id = trip_id_text::uuid
      and (
        t.user_id = auth.uid()
        or exists (
          select 1
          from public.trip_member tm
          where tm.trip_id = t.id
            and tm.user_id = auth.uid()
            and tm.status = 'active'
        )
      )
  );
end;
$$;

revoke all on function private.current_user_can_access_storage_trip(text) from public;
grant execute on function private.current_user_can_access_storage_trip(text) to authenticated;

drop policy if exists "Authenticated users can read images" on storage.objects;

create policy "Active trip members can read images"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'images'
  and (select private.current_user_can_access_storage_trip(name))
);

drop policy if exists "Authenticated users can read travel documents" on storage.objects;

create policy "Active trip members can read travel documents"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'travel-documents'
  and (select private.current_user_can_access_storage_trip(name))
);
