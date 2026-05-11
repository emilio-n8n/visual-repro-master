import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useWorkspace } from "./useWorkspace";

export type Tag = {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  created_at: string;
};

// Predefined color palette for tags
export const TAG_COLORS = [
  "#C4A264", // Gold (FORMA brand)
  "#10B981", // Emerald
  "#EF4444", // Red
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#F97316", // Orange
] as const;

export type TagColor = (typeof TAG_COLORS)[number];

type TagsContextType = {
  tags: Tag[];
  loading: boolean;
  addTag: (name: string, color?: TagColor) => Promise<void>;
  removeTag: (id: string) => Promise<void>;
  updateTag: (id: string, updates: Partial<Tag>) => Promise<void>;
  getTagById: (id: string) => Tag | undefined;
  getTagsByIds: (ids: string[]) => Tag[];
};

const TagsContext = createContext<TagsContextType>({
  tags: [],
  loading: true,
  addTag: async () => {},
  removeTag: async () => {},
  updateTag: async () => {},
  getTagById: () => undefined,
  getTagsByIds: () => [],
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

    // Subscribe to real-time updates
    const channel = supabase
      .channel("project_tags_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "project_tags", filter: `workspace_id=eq.${activeWorkspaceId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTags((prev) => {
              if (prev.find((t) => t.id === payload.new.id)) return prev;
              return [...prev, payload.new as Tag];
            });
          } else if (payload.eventType === "UPDATE") {
            setTags((prev) =>
              prev.map((t) => (t.id === payload.new.id ? { ...t, ...payload.new } : t))
            );
          } else if (payload.eventType === "DELETE") {
            setTags((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeWorkspaceId]);

  const addTag = useCallback(async (name: string, color: TagColor = "#C4A264") => {
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

    if (error) {
      console.error("Error adding tag:", error);
      return;
    }

    if (data) {
      setTags((prev) => [...prev, data]);
    }
  }, [activeWorkspaceId]);

  const removeTag = useCallback(async (id: string) => {
    const { error } = await supabase.from("project_tags").delete().eq("id", id);
    if (!error) {
      setTags((prev) => prev.filter((t) => t.id !== id));
    }
  }, []);

  const updateTag = useCallback(async (id: string, updates: Partial<Tag>) => {
    const { error } = await supabase.from("project_tags").update(updates).eq("id", id);
    if (!error) {
      setTags((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    }
  }, []);

  const getTagById = useCallback(
    (id: string) => tags.find((t) => t.id === id),
    [tags]
  );

  const getTagsByIds = useCallback(
    (ids: string[]) => tags.filter((t) => ids.includes(t.id)),
    [tags]
  );

  return (
    <TagsContext.Provider
      value={{ tags, loading, addTag, removeTag, updateTag, getTagById, getTagsByIds }}
    >
      {children}
    </TagsContext.Provider>
  );
};

export const useTags = () => useContext(TagsContext);