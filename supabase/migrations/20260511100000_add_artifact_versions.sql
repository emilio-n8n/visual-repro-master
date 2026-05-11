-- Artifact version history
CREATE TABLE IF NOT EXISTS artifact_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE artifact_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view artifact_versions"
  ON artifact_versions FOR SELECT
  USING (artifact_id IN (SELECT id FROM artifacts WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())));

CREATE POLICY "Team members can create artifact_versions"
  ON artifact_versions FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE INDEX artifact_versions_artifact_id ON artifact_versions(artifact_id);
CREATE INDEX artifact_versions_created_at ON artifact_versions(created_at DESC);
