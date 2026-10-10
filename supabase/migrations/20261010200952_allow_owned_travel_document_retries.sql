create policy "Document owners can retry travel document uploads"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'travel-documents'
  and owner_id = (select auth.uid()::text)
  and (select private.current_user_can_access_storage_trip(name))
)
with check (
  bucket_id = 'travel-documents'
  and owner_id = (select auth.uid()::text)
  and (select private.current_user_can_access_storage_trip(name))
);
