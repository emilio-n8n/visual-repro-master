import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useWorkspace } from "./useWorkspace";

type Presence = {
  user_id: string;
  workspace_id: string | null;
  page: string | null;
  last_seen: string;
  user?: {
    full_name: string;
    avatar_url: string | null;
  };
};

type PresenceContextType = {
  onlineUsers: Presence[];
  updatePresence: (page: string) => Promise<void>;
};

const PresenceContext = createContext<PresenceContextType>({
  onlineUsers: [],
  updatePresence: async () => {},
});

export const PresenceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const [onlineUsers, setOnlineUsers] = useState<Presence[]>([]);

  // Update presence periodically
  const updatePresence = useCallback(async (page: string) => {
    if (!user) return;

    const { data: existing } = await supabase
      .from("presence")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("presence")
        .update({
          page,
          last_seen: new Date().toISOString(),
          workspace_id: activeWorkspaceId,
        })
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("presence")
        .insert({
          user_id: user.id,
          workspace_id: activeWorkspaceId,
          page,
        });
    }
  }, [user, activeWorkspaceId]);

  // Subscribe to presence changes in workspace
  useEffect(() => {
    if (!activeWorkspaceId) {
      setOnlineUsers([]);
      return;
    }

    const loadPresence = async () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const { data } = await supabase
        .from("presence")
        .select("*")
        .eq("workspace_id", activeWorkspaceId)
        .gte("last_seen", fiveMinAgo)
        .neq("user_id", user?.id)
        .order("last_seen", { ascending: false });

      if (data) {
        setOnlineUsers(data);
      }
    };

    loadPresence();

    // Poll every 30 seconds
    const interval = setInterval(loadPresence, 30000);

    return () => clearInterval(interval);
  }, [activeWorkspaceId, user?.id]);

  return (
    <PresenceContext.Provider value={{ onlineUsers, updatePresence }}>
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresence = () => useContext(PresenceContext);