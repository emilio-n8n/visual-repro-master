
CREATE OR REPLACE FUNCTION public.claim_team_invite(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  tm record;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated');
  END IF;

  SELECT * INTO tm FROM public.team_members WHERE invite_token = _token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_token');
  END IF;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (tm.workspace_id, uid, 'member')
  ON CONFLICT DO NOTHING;

  UPDATE public.team_members
    SET joined_user_id = uid, status = 'active', updated_at = now()
    WHERE id = tm.id;

  RETURN jsonb_build_object('ok', true, 'workspace_id', tm.workspace_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_team_invite(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_team_invite(text) TO authenticated;
