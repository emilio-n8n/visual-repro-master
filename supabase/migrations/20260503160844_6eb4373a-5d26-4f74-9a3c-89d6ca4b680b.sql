
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  workspace_id uuid,
  title text not null default 'Nouvelle conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.conversations enable row level security;

create policy "Users view own conversations" on public.conversations for select to authenticated using (auth.uid() = user_id);
create policy "Users create own conversations" on public.conversations for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own conversations" on public.conversations for update to authenticated using (auth.uid() = user_id);
create policy "Users delete own conversations" on public.conversations for delete to authenticated using (auth.uid() = user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('user','assistant','tool','system')),
  content text not null default '',
  tool_calls jsonb,
  tool_call_id text,
  attachments jsonb,
  created_at timestamptz not null default now()
);

create index idx_messages_conversation on public.messages(conversation_id, created_at);

alter table public.messages enable row level security;

create policy "Users view own messages" on public.messages for select to authenticated using (auth.uid() = user_id);
create policy "Users create own messages" on public.messages for insert to authenticated with check (auth.uid() = user_id);
create policy "Users delete own messages" on public.messages for delete to authenticated using (auth.uid() = user_id);

create trigger conversations_updated_at before update on public.conversations
for each row execute function public.set_updated_at();
