
update storage.buckets set public = false where id = 'render-outputs';

drop policy if exists "Outputs are publicly viewable" on storage.objects;

create policy "Users read their own output renders"
  on storage.objects for select to authenticated
  using (bucket_id = 'render-outputs' and auth.uid()::text = (storage.foldername(name))[1]);
