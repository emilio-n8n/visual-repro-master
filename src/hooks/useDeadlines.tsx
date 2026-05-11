import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "./useWorkspace";

type Deadline = {
  id: string;
  project_id: string;
  title: string;
  date: string;
  completed: boolean;
  created_at: string;
};

type DeadlinesContextType = {
  deadlines: Deadline[];
  loading: boolean;
  addDeadline: (projectId: string, title: string, date: string) => Promise<void>;
  toggleDeadline: (id: string) => Promise<void>;
  removeDeadline: (id: string) => Promise<void>;
  getProjectDeadlines: (projectId: string) => Deadline[];
};

const DeadlinesContext = createContext<DeadlinesContextType>({
  deadlines: [],
  loading: true,
  addDeadline: async () => {},
  toggleDeadline: async () => {},
  removeDeadline: async () => {},
  getProjectDeadlines: () => [],
});

export const DeadlinesProvider = ({ children }: { children: ReactNode }) => {
  const { activeWorkspaceId } = useWorkspace();
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeWorkspaceId) {
      setDeadlines([]);
      setLoading(false);
      return;
    }

    const loadDeadlines = async () => {
      try {
        const { data, error } = await supabase
          .from("project_deadlines")
          .select("*")
          .eq("project_id", activeWorkspaceId) // This is wrong - should filter by projects in workspace
          .order("date", { ascending: true });

        if (!error && data) {
          setDeadlines(data);
        }
      } catch (e) {
        console.warn("Project_deadlines table not available:", e);
      }
      setLoading(false);
    };

    loadDeadlines();
  }, [activeWorkspaceId]);

  const addDeadline = useCallback(async (projectId: string, title: string, date: string) => {
    const { data, error } = await supabase
      .from("project_deadlines")
      .insert({
        project_id: projectId,
        title,
        date,
      })
      .select()
      .single();

    if (!error && data) {
      setDeadlines((prev) => [...prev, data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    }
  }, []);

  const toggleDeadline = useCallback(async (id: string) => {
    const deadline = deadlines.find((d) => d.id === id);
    if (!deadline) return;

    const { data } = await supabase
      .from("project_deadlines")
      .update({ completed: !deadline.completed })
      .eq("id", id)
      .select()
      .single();

    if (data) {
      setDeadlines((prev) => prev.map((d) => d.id === id ? data : d));
    }
  }, [deadlines]);

  const removeDeadline = useCallback(async (id: string) => {
    await supabase.from("project_deadlines").delete().eq("id", id);
    setDeadlines((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const getProjectDeadlines = useCallback((projectId: string) => {
    return deadlines.filter((d) => d.project_id === projectId);
  }, [deadlines]);

  return (
    <DeadlinesContext.Provider value={{ deadlines, loading, addDeadline, toggleDeadline, removeDeadline, getProjectDeadlines }}>
      {children}
    </DeadlinesContext.Provider>
  );
};

export const useDeadlines = () => useContext(DeadlinesContext);