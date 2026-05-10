import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type AnalyticsEvent = {
  name: string;
  properties?: Record<string, unknown>;
};

export function useAnalytics() {
  const { user } = useAuth();

  const track = useCallback(async (name: string, properties?: Record<string, unknown>) => {
    if (!user) return;

    try {
      await supabase.from("analytics").insert({
        user_id: user.id,
        event_type: name,
        event_data: properties ?? {},
      });
    } catch (error) {
      console.error("[Analytics] Failed to track event:", error);
    }
  }, [user]);

  const trackPageView = useCallback((page: string) => {
    track("page_view", { page });
  }, [track]);

  const trackButtonClick = useCallback((button: string, context?: string) => {
    track("button_click", { button, context });
  }, [track]);

  const trackError = useCallback((error: string, details?: string) => {
    track("error", { error, details });
  }, [track]);

  const trackArtifactCreated = useCallback((type: string, title: string) => {
    track("artifact_created", { type, title });
  }, [track]);

  const trackExport = useCallback((format: string, artifactType: string) => {
    track("export", { format, artifact_type: artifactType });
  }, [track]);

  return { track, trackPageView, trackButtonClick, trackError, trackArtifactCreated, trackExport };
}