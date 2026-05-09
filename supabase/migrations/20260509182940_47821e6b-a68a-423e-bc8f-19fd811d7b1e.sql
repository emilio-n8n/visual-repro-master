REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public;
REVOKE EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid) FROM public;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid) TO authenticated;