CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  ws_id uuid;
  base_slug text;
  final_slug text;
  n int := 0;
  invite_token text := nullif(new.raw_user_meta_data->>'invite_token', '');
  invite_row record;
begin
  if invite_token is not null then
    select * into invite_row
    from public.team_members
    where team_members.invite_token = invite_token
      and team_members.status = 'invited'
    limit 1;
  end if;

  insert into public.profiles (id, full_name, avatar_url, onboarding_completed, onboarding_level)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    invite_row.id is not null,
    case when invite_row.id is not null then 'invited' else null end
  );

  insert into public.user_roles (user_id, role) values (new.id, 'member');

  if invite_row.id is not null then
    insert into public.workspace_members (workspace_id, user_id, role)
    values (invite_row.workspace_id, new.id, 'member')
    on conflict do nothing;

    update public.team_members
      set joined_user_id = new.id,
          status = 'active',
          updated_at = now()
      where id = invite_row.id;

    return new;
  end if;

  base_slug := regexp_replace(lower(coalesce(split_part(new.email,'@',1),'workspace')), '[^a-z0-9]+', '-', 'g');
  final_slug := base_slug;
  while exists (select 1 from public.workspaces where slug = final_slug) loop
    n := n + 1;
    final_slug := base_slug || '-' || n::text;
  end loop;

  insert into public.workspaces (owner_id, name, slug)
  values (new.id, 'Mon studio', final_slug)
  returning id into ws_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (ws_id, new.id, 'admin');

  return new;
end;
$function$;