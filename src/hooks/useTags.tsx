import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useWorkspace } from "./useWorkspace";

type Tag = {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  created_at: string;
};

type TagsContextType = {
  tags: Tag[];
  loading: boolean;
  addTag: (name: string, color?: string) => Promise<void>;
  removeTag: (id: string) => Promise<void>;
  updateTag: (id: string, updates: Partial<Tag>) => Promise<void>;
};

const TagsContext = createContext<TagsContextType>({
  tags: [],
  loading: true,
  addTag: async () => {},
  removeTag: async () => {},
  updateTag: async () => {},
});

export const TagsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeWorkspaceId) {
      setTags([]);
      setLoading(false);
      return;
    }

    const loadTags = async () => {
      const { data, error } = await supabase
        .from("project_tags")
        .select("*")
        .eq("workspace_id", activeWorkspaceId)
        .order("name");

      if (!error && data) {
        setTags(data);
      }
      setLoading(false);
    };

    loadTags();
  }, [activeWorkspaceId]);

  const addTag = useCallback(async (name: string, color: string = "#C4A264") => {
    if (!activeWorkspaceId) return;
    const { data, error } = await supabase
      .from("project_tags")
      .insert({
        workspace_id: activeWorkspaceId,
        name,
        color,
      })
      .select()
      .single();

    if (!error && data) {
      setTags((prev) => [...prev, data]);
    }
  }, [activeWorkspaceId]);

  const removeTag = useCallback(async (id: string) => {
    await supabase.from("project_tags").delete().eq("id", id);
    setTags((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateTag = useCallback(async (id: string, updates: Partial<Tag>) => {
    await supabase.from("project_tags").update(updates).eq("id", id);
    setTags((prev) => prev.map((t) => t.id === id ? { ...t, ...updates } : t));
  }, []);

  return (
    <TagsContext.Provider value={{ tags, loading, addTag, removeTag, updateTag }}>
      {children}
    </TagsContext.Provider>
  );
};

export const useTags = () => useContext(TagsContext);