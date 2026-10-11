create policy "Storage object owners can delete trip files"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('images', 'travel-documents')
  and owner_id = (select auth.uid()::text)
  and (select private.current_user_can_access_storage_trip(name))
);
