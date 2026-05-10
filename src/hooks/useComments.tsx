import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type Comment = {
  id: string;
  user_id: string;
  artifact_id: string | null;
  render_id: string | null;
  content: string;
  parent_id: string | null;
  created_at: string;
  user?: {
    full_name: string;
    avatar_url: string | null;
  };
};

type CommentsContextType = {
  comments: Comment[];
  loading: boolean;
  addComment: (content: string, artifactId?: string, renderId?: string, parentId?: string) => Promise<void>;
  removeComment: (id: string) => Promise<void>;
  getArtifactComments: (artifactId: string) => Comment[];
  getRenderComments: (renderId: string) => Comment[];
};

const CommentsContext = createContext<CommentsContextType>({
  comments: [],
  loading: true,
  addComment: async () => {},
  removeComment: async () => {},
  getArtifactComments: () => [],
  getRenderComments: () => [],
});

export const CommentsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadComments = async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (!error && data) {
        setComments(data);
      }
      setLoading(false);
    };

    loadComments();

    // Subscribe to new comments
    const channel = supabase
      .channel("comments-changes")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "comments",
      }, (payload) => {
        setComments((prev) => [payload.new as Comment, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addComment = useCallback(async (content: string, artifactId?: string, renderId?: string, parentId?: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from("comments")
      .insert({
        user_id: user.id,
        artifact_id: artifactId ?? null,
        render_id: renderId ?? null,
        content,
        parent_id: parentId ?? null,
      })
      .select()
      .single();

    if (!error && data) {
      setComments((prev) => [data, ...prev]);
    }
  }, [user]);

  const removeComment = useCallback(async (id: string) => {
    await supabase.from("comments").delete().eq("id", id);
    setComments((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const getArtifactComments = useCallback((artifactId: string) => {
    return comments.filter((c) => c.artifact_id === artifactId);
  }, [comments]);

  const getRenderComments = useCallback((renderId: string) => {
    return comments.filter((c) => c.render_id === renderId);
  }, [comments]);

  return (
    <CommentsContext.Provider value={{ comments, loading, addComment, removeComment, getArtifactComments, getRenderComments }}>
      {children}
    </CommentsContext.Provider>
  );
};

export const useComments = () => useContext(CommentsContext);