-- Storage RLS for the 'media' bucket. The bucket's own "public" flag only
-- controls whether files are servable via a public URL without auth
-- headers — it does NOT grant API-level select/insert/update/delete on
-- storage.objects, which has its own separate RLS. The Studio uploads as
-- the authenticated owner (browser client, not service_role), so it needs
-- an explicit write policy here.

create policy "media_public_read" on storage.objects
  for select using (bucket_id = 'media');

create policy "media_owner_insert" on storage.objects
  for insert with check (bucket_id = 'media' and is_owner());

create policy "media_owner_update" on storage.objects
  for update using (bucket_id = 'media' and is_owner());

create policy "media_owner_delete" on storage.objects
  for delete using (bucket_id = 'media' and is_owner());
