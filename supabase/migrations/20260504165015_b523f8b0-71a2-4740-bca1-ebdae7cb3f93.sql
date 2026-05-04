
-- 1. Profile onboarding columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_level text;

-- 2. Cabinet profile (one per workspace)
CREATE TABLE IF NOT EXISTS public.cabinet_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL UNIQUE,
  name text,
  style text,
  project_types text,
  tone text,
  email_signature text,
  tools text,
  deliverables text,
  clientele text,
  brand_values text,
  references_text text,
  process text,
  materials_pref text,
  suppliers text,
  typical_pricing text,
  email_templates jsonb DEFAULT '{}'::jsonb,
  extra jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cabinet_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members view cabinet" ON public.cabinet_profile
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "members insert cabinet" ON public.cabinet_profile
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "members update cabinet" ON public.cabinet_profile
  FOR UPDATE TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE TRIGGER trg_cabinet_profile_updated
  BEFORE UPDATE ON public.cabinet_profile
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Team members
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  invited_by uuid NOT NULL,
  display_name text NOT NULL,
  email text,
  role_label text NOT NULL DEFAULT 'collaborateur',
  invite_token text NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  joined_user_id uuid,
  status text NOT NULL DEFAULT 'invited',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS team_members_token_idx ON public.team_members(invite_token);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members view team" ON public.team_members
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "owner manage team" ON public.team_members
  FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.owner_id = auth.uid()))
  WITH CHECK (EXISTS(SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.owner_id = auth.uid()));
-- Allow invitee to update own row when joining (claim token via edge or RPC; here permissive update for joined_user_id == auth.uid())
CREATE POLICY "self update on join" ON public.team_members
  FOR UPDATE TO authenticated
  USING (joined_user_id = auth.uid())
  WITH CHECK (joined_user_id = auth.uid());

CREATE TRIGGER trg_team_members_updated
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  name text NOT NULL,
  client text,
  location text,
  type text,
  surface text,
  budget text,
  deadline text,
  brief text,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members view projects" ON public.projects
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "members create projects" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()) AND owner_id = auth.uid());
CREATE POLICY "members update projects" ON public.projects
  FOR UPDATE TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "owner delete projects" ON public.projects
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

CREATE TRIGGER trg_projects_updated
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Link conversations & artifacts to projects
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS project_id uuid;
ALTER TABLE public.artifacts ADD COLUMN IF NOT EXISTS project_id uuid;

-- 5. Memories
CREATE TABLE IF NOT EXISTS public.memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workspace_id uuid,
  project_id uuid,
  scope text NOT NULL CHECK (scope IN ('project','workspace','global')),
  key text,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS memories_workspace_idx ON public.memories(workspace_id);
CREATE INDEX IF NOT EXISTS memories_project_idx ON public.memories(project_id);
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members view memories" ON public.memories
  FOR SELECT TO authenticated
  USING (
    (scope = 'global' AND user_id = auth.uid())
    OR (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid()))
  );
CREATE POLICY "users create memories" ON public.memories
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "users delete memories" ON public.memories
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 6. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  user_id uuid NOT NULL,
  from_user_id uuid,
  type text NOT NULL,
  title text,
  body text,
  payload jsonb DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications(user_id, read_at);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "members create notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
