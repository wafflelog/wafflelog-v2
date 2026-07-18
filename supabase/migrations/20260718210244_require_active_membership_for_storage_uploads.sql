drop policy if exists "Authenticated users can upload images" on storage.objects;

create policy "Active trip members can upload images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'images'
  and (select private.current_user_can_access_storage_trip(name))
);

drop policy if exists "Authenticated users can upload travel documents" on storage.objects;

create policy "Active trip members can upload travel documents"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'travel-documents'
  and (select private.current_user_can_access_storage_trip(name))
);
