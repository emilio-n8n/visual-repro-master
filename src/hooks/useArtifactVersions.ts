import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type ArtifactVersion = {
  id: string;
  artifact_id: string;
  content: string;
  version_number: number;
  created_by: string | null;
  created_at: string;
  profiles?: { full_name: string | null };
};

export function useArtifactVersions(artifactId: string | undefined) {
  const [versions, setVersions] = useState<ArtifactVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadVersions = useCallback(async () => {
    if (!artifactId) return;
    setLoading(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/forma-artifact-versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "list", artifactId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erreur");
      setVersions(data.versions ?? []);
    } catch (e) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [artifactId]);

  const saveVersion = useCallback(async (content: string) => {
    if (!artifactId) return;
    setSaving(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/forma-artifact-versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "save", artifactId, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erreur");
      toast({ title: "Version sauvegardée", description: `Version ${data.version.version_number}` });
      await loadVersions();
      return data.version;
    } catch (e) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [artifactId, loadVersions]);

  const restoreVersion = useCallback(async (versionId: string) => {
    if (!artifactId) return;
    setSaving(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/forma-artifact-versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "restore", artifactId, versionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erreur");
      toast({ title: "Version restaurée", description: "Le contenu a été restauré avec succès." });
      await loadVersions();
      return data.content;
    } catch (e) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [artifactId, loadVersions]);

  return { versions, loading, saving, loadVersions, saveVersion, restoreVersion };
}
