import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type Workspace = { id: string; name: string; slug: string; plan: string };
type Project = { id: string; name: string; client: string | null };

type Ctx = {
  workspace: Workspace | null;
  onboardingCompleted: boolean | null;
  loading: boolean;
  projects: Project[];
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  refresh: () => Promise<void>;
};

const WorkspaceContext = createContext<Ctx>({
  workspace: null,
  onboardingCompleted: null,
  loading: true,
  projects: [],
  activeProjectId: null,
  setActiveProjectId: () => {},
  refresh: async () => {},
});

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(
    () => localStorage.getItem("forma.activeProjectId")
  );
  const [loading, setLoading] = useState(true);

  const setActiveProjectId = (id: string | null) => {
    setActiveProjectIdState(id);
    if (id) localStorage.setItem("forma.activeProjectId", id);
    else localStorage.removeItem("forma.activeProjectId");
  };

  async function load() {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: ws }, { data: profile }] = await Promise.all([
      supabase.from("workspaces").select("id, name, slug, plan").limit(1).maybeSingle(),
      supabase.from("profiles").select("onboarding_completed").eq("id", user.id).maybeSingle(),
    ]);
    setWorkspace(ws);
    setOnboardingCompleted(profile?.onboarding_completed ?? false);
    if (ws) {
      const { data: prj } = await supabase
        .from("projects")
        .select("id, name, client")
        .eq("workspace_id", ws.id)
        .order("updated_at", { ascending: false });
      setProjects(prj ?? []);
      if (activeProjectId && !(prj ?? []).some((p) => p.id === activeProjectId)) {
        setActiveProjectId(null);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        onboardingCompleted,
        loading,
        projects,
        activeProjectId,
        setActiveProjectId,
        refresh: load,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);
