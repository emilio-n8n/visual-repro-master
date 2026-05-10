-- Advanced features tables

-- Table: project_tags
CREATE TABLE IF NOT EXISTS project_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#C4A264',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, name)
);

ALTER TABLE project_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view project_tags"
  ON project_tags FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Team members can manage project_tags"
  ON project_tags FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role = 'owner'));

CREATE INDEX project_tags_workspace_id ON project_tags(workspace_id);

-- Table: project_deadlines
CREATE TABLE IF NOT EXISTS project_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE project_deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view project_deadlines"
  ON project_deadlines FOR SELECT
  USING (project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())));

CREATE POLICY "Team members can manage project_deadlines"
  ON project_deadlines FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())));

CREATE INDEX project_deadlines_project_id ON project_deadlines(project_id);
CREATE INDEX project_deadlines_date ON project_deadlines(date);

-- Table: comments
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artifact_id UUID REFERENCES artifacts(id) ON DELETE CASCADE,
  render_id UUID REFERENCES renders(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Team members can view comments"
  ON comments FOR SELECT
  USING (
    artifact_id IN (SELECT id FROM artifacts WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())) OR
    render_id IN (SELECT id FROM renders WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))
  );

CREATE INDEX comments_artifact_id ON comments(artifact_id);
CREATE INDEX comments_render_id ON comments(render_id);
CREATE INDEX comments_created_at ON comments(created_at DESC);

-- Table: share_links
CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMPTZ,
  access_level TEXT DEFAULT 'view',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own share_links"
  ON share_links FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX share_links_token ON share_links(token);
CREATE INDEX share_links_entity ON share_links(entity_type, entity_id);

-- Table: notifications (enhanced)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT;

CREATE INDEX notifications_user_id_read ON notifications(user_id, read_at) WHERE read_at IS NULL;

-- Table: presence (for real-time)
CREATE TABLE IF NOT EXISTS presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  page TEXT,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workspace presence"
  ON presence FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own presence"
  ON presence FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX presence_workspace_id ON presence(workspace_id);
CREATE INDEX presence_last_seen ON presence(last_seen DESC);