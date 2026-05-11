/**
 * @fileoverview Hook pour la collaboration temps réel avec Supabase Realtime
 * Gère les subscriptions aux changements de projets, notifications et présence
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useWorkspace } from "./useWorkspace";
import type { Project, Notification } from "@/lib/types";

// Types pour les événements temps réel
export interface RealtimeProjectChange {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  newRecord?: Project;
  oldRecord?: Project;
  timestamp: string;
}

export interface RealtimeNotification extends Notification {
  // Extended real-time notification with additional metadata
  isNew?: boolean;
}

export type PresenceStatus = "online" | "away" | "busy" | "offline";

export interface RealtimePresenceState {
  user_id: string;
  user_email: string;
  user_name: string;
  avatar_url?: string;
  status: PresenceStatus;
  current_project_id?: string;
  current_page?: string;
  last_seen: string;
  joined_at: string;
}

// Callback types
type ProjectCallback = (change: RealtimeProjectChange) => void;
type NotificationCallback = (notification: RealtimeNotification) => void;
type PresenceCallback = (presence: Map<string, RealtimePresenceState>) => void;
type ConnectionStatusCallback = (status: "connected" | "connecting" | "disconnected") => void;

// Channel reference for cleanup
interface RealtimeChannelRef {
  channel: ReturnType<typeof supabase.channel> | null;
  unsubscribe: () => void;
}

/**
 * Hook principal pour la collaboration temps réel
 * @returns Méthodes pour s'abonner aux événements temps réel
 */
export function useRealtime() {
  const { user } = useAuth();
  const { activeWorkspaceId } = useWorkspace();

  // State pour les channels actifs
  const channelsRef = useRef<RealtimeChannelRef[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("disconnected");

  // Nettoyage des channels lors du unmount
  useEffect(() => {
    return () => {
      channelsRef.current.forEach(({ unsubscribe }) => {
        unsubscribe();
      });
      channelsRef.current = [];
    };
  }, []);

  /**
   * S'abonner aux changements d'un projet spécifique
   * Écoute INSERT, UPDATE, DELETE sur la table projects
   */
  const subscribeToProject = useCallback(
    (projectId: string, callback: ProjectCallback) => {
      if (!projectId) {
        console.warn("[Realtime] Impossible de s'abonner: projectId manquant");
        return () => {};
      }

      const channelName = `project-${projectId}`;
      console.warn(`[Realtime] Subscribe to project: ${projectId}`);

      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "projects",
            filter: `id=eq.${projectId}`,
          },
          (payload) => {
            const change: RealtimeProjectChange = {
              eventType: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
              newRecord: payload.new as Project | undefined,
              oldRecord: payload.old as Project | undefined,
              timestamp: new Date().toISOString(),
            };
            callback(change);
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setConnectionStatus("connected");
          } else if (status === "CHANNEL_ERROR") {
            setConnectionStatus("disconnected");
          }
        });

      const unsubscribe = () => {
        supabase.removeChannel(channel);
      };

      channelsRef.current.push({ channel, unsubscribe });
      return unsubscribe;
    },
    []
  );

  /**
   * S'abonner aux notifications temps réel de l'utilisateur
   * Écoute les nouvelles notifications (INSERT) et leurs mises à jour
   */
  const subscribeToNotifications = useCallback(
    (callback: NotificationCallback, onConnectionChange?: ConnectionStatusCallback) => {
      if (!user) {
        console.warn("[Realtime] Impossible de s'abonner aux notifications: utilisateur non connecté");
        return () => {};
      }

      const channelName = `notifications-${user.id}`;
      console.warn(`[Realtime] Subscribe to notifications for user: ${user.id}`);

      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const notification: RealtimeNotification = {
              ...(payload.new as Notification),
              isNew: true,
            };
            callback(notification);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const notification: RealtimeNotification = {
              ...(payload.new as Notification),
              isNew: false,
            };
            callback(notification);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            // Handle deleted notifications
            console.warn("[Realtime] Notification deleted:", payload.old);
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setConnectionStatus("connected");
            onConnectionChange?.("connected");
          } else if (status === "CHANNEL_ERROR") {
            setConnectionStatus("disconnected");
            onConnectionChange?.("disconnected");
          } else if (status === "TIMED_OUT") {
            setConnectionStatus("connecting");
            onConnectionChange?.("connecting");
          }
        });

      const unsubscribe = () => {
        supabase.removeChannel(channel);
      };

      channelsRef.current.push({ channel, unsubscribe });
      return unsubscribe;
    },
    [user]
  );

  /**
   * S'abonner à la présence des utilisateurs dans un workspace
   * Utilise Supabase Realtime Presence pour suivre les utilisateurs en ligne
   */
  const subscribeToPresence = useCallback(
    (callback: PresenceCallback, onConnectionChange?: ConnectionStatusCallback) => {
      if (!activeWorkspaceId) {
        console.warn("[Realtime] Impossible de s'abonner à la présence: workspace non sélectionné");
        return () => {};
      }

      const channelName = `presence-workspace-${activeWorkspaceId}`;
      console.warn(`[Realtime] Subscribe to presence in workspace: ${activeWorkspaceId}`);

      const channel = supabase.channel(channelName);

      // Track user presence when they join
      const trackPresence = () => {
        if (!user) return;

        channel.track({
          user_id: user.id,
          user_email: user.email || "",
          user_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Utilisateur",
          avatar_url: user.user_metadata?.avatar_url || undefined,
          status: "online" as PresenceStatus,
          current_page: window.location.pathname,
          last_seen: new Date().toISOString(),
          joined_at: new Date().toISOString(),
        });
      };

      // Setup presence sync handler
      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState();
          const presenceMap = new Map<string, RealtimePresenceState>();

          Object.entries(state).forEach(([key, presences]) => {
            if (presences && presences.length > 0) {
              const presence = presences[0] as unknown as RealtimePresenceState;
              presenceMap.set(key, presence);
            }
          });

          callback(presenceMap);
        })
        .on("presence", { event: "join" }, ({ key, newPresences }) => {
          console.warn("[Realtime] User joined:", key, newPresences);
        })
        .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
          console.warn("[Realtime] User left:", key, leftPresences);
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setConnectionStatus("connected");
            onConnectionChange?.("connected");
            trackPresence();
          } else if (status === "CHANNEL_ERROR") {
            setConnectionStatus("disconnected");
            onConnectionChange?.("disconnected");
          }
        });

      // Periodic presence update
      const updateInterval = setInterval(() => {
        channel.track({
          user_id: user?.id,
          user_email: user?.email || "",
          user_name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Utilisateur",
          avatar_url: user?.user_metadata?.avatar_url || undefined,
          status: "online" as PresenceStatus,
          current_page: window.location.pathname,
          last_seen: new Date().toISOString(),
          joined_at: channel.presenceState()[Object.keys(channel.presenceState())[0]]?.[0]
            ? new Date().toISOString()
            : undefined,
        });
      }, 30000);

      const unsubscribe = () => {
        clearInterval(updateInterval);
        channel.untrack();
        supabase.removeChannel(channel);
      };

      channelsRef.current.push({ channel, unsubscribe });
      return unsubscribe;
    },
    [activeWorkspaceId, user]
  );

  /**
   * S'abonner aux changements de projets dans un workspace
   * Écoute tous les projets du workspace actuel
   */
  const subscribeToWorkspaceProjects = useCallback(
    (callback: ProjectCallback) => {
      if (!activeWorkspaceId) {
        console.warn("[Realtime] Impossible de s'abonner aux projets: workspace non sélectionné");
        return () => {};
      }

      const channelName = `workspace-projects-${activeWorkspaceId}`;
      console.warn(`[Realtime] Subscribe to projects in workspace: ${activeWorkspaceId}`);

      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "projects",
            filter: `workspace_id=eq.${activeWorkspaceId}`,
          },
          (payload) => {
            const change: RealtimeProjectChange = {
              eventType: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
              newRecord: payload.new as Project | undefined,
              oldRecord: payload.old as Project | undefined,
              timestamp: new Date().toISOString(),
            };
            callback(change);
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setConnectionStatus("connected");
          }
        });

      const unsubscribe = () => {
        supabase.removeChannel(channel);
      };

      channelsRef.current.push({ channel, unsubscribe });
      return unsubscribe;
    },
    [activeWorkspaceId]
  );

  return {
    subscribeToProject,
    subscribeToNotifications,
    subscribeToPresence,
    subscribeToWorkspaceProjects,
    connectionStatus,
  };
}

/**
 * Hook pour gérer les notifications temps réel avec état local
 * @returns Liste des notifications et méthodes de gestion
 */
export function useRealtimeNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { subscribeToNotifications } = useRealtime();

  // Charger les notifications initiales et s'abonner aux mises à jour
  useEffect(() => {
    if (!user) return;

    // Charger les notifications existantes
    const loadInitialNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) {
        setNotifications(data.map((n) => ({ ...n, isNew: false })));
      }
    };

    loadInitialNotifications();

    // S'abonner aux nouvelles notifications
    const unsubscribe = subscribeToNotifications((notification) => {
      setNotifications((prev) => {
        // Vérifier si la notification existe déjà (update)
        const exists = prev.find((n) => n.id === notification.id);
        if (exists) {
          return prev.map((n) => (n.id === notification.id ? notification : n));
        }
        // Nouvelle notification - ajouter au début
        return [notification, ...prev];
      });
    }, setIsConnected);

    return () => unsubscribe();
  }, [user, subscribeToNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id);
    if (!unreadIds.length) return;

    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds);

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
    );
  }, [notifications]);

  const deleteNotification = useCallback(async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read_at).length,
    [notifications]
  );

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}

/**
 * Hook pour gérer la présence des utilisateurs en temps réel
 * @returns Carte des utilisateurs en ligne et méthodes de mise à jour
 */
export function useRealtimePresence() {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<RealtimePresenceState[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { subscribeToPresence } = useRealtime();

  // S'abonner à la présence
  useEffect(() => {
    const unsubscribe = subscribeToPresence(
      (presenceMap) => {
        const users = Array.from(presenceMap.values()).filter(
          (u) => u.user_id !== user?.id
        );
        setOnlineUsers(users);
      },
      setIsConnected
    );

    return () => unsubscribe();
  }, [subscribeToPresence, user?.id]);

  /**
   * Mettre à jour la page actuelle de l'utilisateur
   */
  const updateCurrentPage = useCallback(async (page: string) => {
    if (!user) return;

    // Cette fonction met à jour la présence dans la base de données
    // Pour une mise à jour en temps réel, utiliser channel.track()
    const { error } = await supabase
      .from("presence")
      .upsert(
        {
          user_id: user.id,
          page,
          last_seen: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("[Realtime] Error updating presence:", error);
    }
  }, [user]);

  /**
   * Mettre à jour le statut de l'utilisateur
   */
  const updateStatus = useCallback(
    async (status: PresenceStatus) => {
      if (!user) return;

      await supabase
        .from("presence")
        .update({ status, last_seen: new Date().toISOString() })
        .eq("user_id", user.id);
    },
    [user]
  );

  return {
    onlineUsers,
    isConnected,
    updateCurrentPage,
    updateStatus,
  };
}

/**
 * Hook pour suivre les changements d'un projet spécifique
 * @param projectId ID du projet à suivre
 * @returns Changement actuel et méthode pour mettre à jour
 */
export function useRealtimeProject(projectId: string | undefined) {
  const [projectChange, setProjectChange] = useState<RealtimeProjectChange | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { subscribeToProject } = useRealtime();

  useEffect(() => {
    if (!projectId) return;

    const unsubscribe = subscribeToProject(projectId, (change) => {
      setProjectChange(change);
    }, setIsConnected);

    return () => unsubscribe();
  }, [projectId, subscribeToProject]);

  return {
    projectChange,
    isConnected,
  };
}

export default useRealtime;