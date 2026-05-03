
-- Renders table
create table public.renders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  status text not null default 'pending', -- pending | processing | completed | failed
  prompt text,
  style text,
  input_path text not null,
  output_path text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.renders enable row level security;

create policy "Users view their own renders"
  on public.renders for select to authenticated
  using (auth.uid() = user_id);
create policy "Users create their own renders"
  on public.renders for insert to authenticated
  with check (auth.uid() = user_id);
create policy "Users update their own renders"
  on public.renders for update to authenticated
  using (auth.uid() = user_id);
create policy "Users delete their own renders"
  on public.renders for delete to authenticated
  using (auth.uid() = user_id);

create trigger renders_set_updated_at before update on public.renders
  for each row execute function public.set_updated_at();

alter publication supabase_realtime add table public.renders;
alter table public.renders replica identity full;

-- Storage buckets
insert into storage.buckets (id, name, public) values
  ('render-inputs', 'render-inputs', false),
  ('render-outputs', 'render-outputs', true);

-- Input bucket policies (private, user folder)
create policy "Users read their own input renders"
  on storage.objects for select to authenticated
  using (bucket_id = 'render-inputs' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users upload their own input renders"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'render-inputs' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users delete their own input renders"
  on storage.objects for delete to authenticated
  using (bucket_id = 'render-inputs' and auth.uid()::text = (storage.foldername(name))[1]);

-- Output bucket policies (public read, user-folder write)
create policy "Outputs are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'render-outputs');
create policy "Users upload their own output renders"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'render-outputs' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users delete their own output renders"
  on storage.objects for delete to authenticated
  using (bucket_id = 'render-outputs' and auth.uid()::text = (storage.foldername(name))[1]);
