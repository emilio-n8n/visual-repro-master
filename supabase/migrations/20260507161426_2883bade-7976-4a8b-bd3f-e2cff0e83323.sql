
CREATE OR REPLACE FUNCTION public.claim_team_invite(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  tm record;
  owned_ws_id uuid;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated');
  END IF;

  SELECT * INTO tm FROM public.team_members WHERE invite_token = _token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_token');
  END IF;

  -- Add user as member of the inviting workspace
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (tm.workspace_id, uid, 'member')
  ON CONFLICT DO NOTHING;

  -- Mark the team member row as claimed
  UPDATE public.team_members
    SET joined_user_id = uid, status = 'active', updated_at = now()
    WHERE id = tm.id;

  -- Mark onboarding complete for invited user (cabinet setup is the architect's job)
  UPDATE public.profiles
    SET onboarding_completed = true,
        onboarding_level = COALESCE(onboarding_level, 'invited')
    WHERE id = uid;

  -- Delete the auto-created empty personal workspace (if any) so the joined one becomes primary
  SELECT w.id INTO owned_ws_id
  FROM public.workspaces w
  WHERE w.owner_id = uid
    AND w.id <> tm.workspace_id
    AND NOT EXISTS (SELECT 1 FROM public.projects p WHERE p.workspace_id = w.id)
    AND NOT EXISTS (SELECT 1 FROM public.cabinet_profile cp WHERE cp.workspace_id = w.id)
  LIMIT 1;

  IF owned_ws_id IS NOT NULL THEN
    DELETE FROM public.workspace_members WHERE workspace_id = owned_ws_id;
    DELETE FROM public.workspaces WHERE id = owned_ws_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'workspace_id', tm.workspace_id);
END;
$function$;
