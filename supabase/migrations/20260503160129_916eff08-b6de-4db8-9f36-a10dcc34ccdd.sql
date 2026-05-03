-- Fix permission denied on is_workspace_member / has_role for authenticated role
GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;

-- Add parent_id to renders for "request modifications" feature
ALTER TABLE public.renders ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.renders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_renders_parent ON public.renders(parent_id);