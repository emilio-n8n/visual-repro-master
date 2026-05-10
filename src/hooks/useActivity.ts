import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useWorkspace } from "./useWorkspace";

type ActivityAction =
  | "artifact_created"
  | "artifact_updated"
  | "artifact_deleted"
  | "render_created"
  | "render_updated"
  | "conversation_created"
  | "message_sent"
  | "project_created"
  | "project_updated"
  | "settings_updated";

type ActivityContext = {
  action: ActivityAction;
  entityType?: "artifact" | "render" | "conversation" | "project" | "settings";
  entityId?: string;
  metadata?: Record<string, unknown>;
};

export function useActivity() {
  const { user } = useAuth();
  const { activeWorkspaceId } = useWorkspace();

  const logActivity = useCallback(async ({ action, entityType, entityId, metadata }: ActivityContext) => {
    if (!user) return;

    try {
      await supabase.from("activity_log").insert({
        user_id: user.id,
        workspace_id: activeWorkspaceId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        metadata: metadata ?? {},
      });
    } catch (error) {
      console.error("[Activity] Failed to log:", error);
    }
  }, [user, activeWorkspaceId]);

  return { logActivity };
}