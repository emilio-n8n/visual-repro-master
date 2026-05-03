
create table public.artifacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  workspace_id uuid,
  type text not null check (type in ('slideshow','spreadsheet','dataviz','website')),
  title text not null default 'Sans titre',
  content text not null default '',
  mime_type text not null default 'text/html',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.artifacts enable row level security;

create policy "Users view own artifacts" on public.artifacts for select to authenticated using (auth.uid() = user_id);
create policy "Users create own artifacts" on public.artifacts for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own artifacts" on public.artifacts for update to authenticated using (auth.uid() = user_id);
create policy "Users delete own artifacts" on public.artifacts for delete to authenticated using (auth.uid() = user_id);

create trigger artifacts_set_updated_at before update on public.artifacts
  for each row execute function public.set_updated_at();
