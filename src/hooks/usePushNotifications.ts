import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// VAPID Public Key - should be set in environment variables
// In production, replace with actual VAPID public key from push notification service
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";

export type NotificationType = "new_render" | "project_invite" | "mention";

export interface PushNotificationPayload {
  title: string;
  body: string;
  type: NotificationType;
  url?: string;
  data?: Record<string, unknown>;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

type PermissionState = "default" | "granted" | "denied" | "unsupported";

interface UsePushNotificationsReturn {
  permission: PermissionState;
  subscription: PushSubscription | null;
  isLoading: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  unsubscribe: () => Promise<void>;
  sendTestNotification: (type?: NotificationType) => Promise<void>;
}

export const usePushNotifications = (): UsePushNotificationsReturn => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<PermissionState>("default");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if push notifications are supported and get current permission
  useEffect(() => {
    const checkPermission = async () => {
      if (!("Notification" in window)) {
        setPermission("unsupported");
        return;
      }

      if (!("PushManager" in window)) {
        setPermission("unsupported");
        return;
      }

      const currentPermission = Notification.permission;
      setPermission(currentPermission as PermissionState);

      // If already granted, try to get existing subscription
      if (currentPermission === "granted") {
        try {
          const reg = await navigator.serviceWorker.ready;
          const existingSub = await reg.pushManager.getSubscription();
          if (existingSub) {
            setSubscription(existingSub.toJSON() as unknown as PushSubscription);
          }
        } catch (err) {
          console.error("[Push] Error getting existing subscription:", err);
        }
      }
    };

    checkPermission();
  }, []);

  // Request permission from the user
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (permission === "unsupported") {
      setError("Les notifications push ne sont pas supportées par ce navigateur");
      return false;
    }

    if (permission === "denied") {
      setError("Permission de notification refusée. Veuillez l'activer dans les paramètres du navigateur.");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First, ensure service worker is ready
      const reg = await navigator.serviceWorker.ready;
      console.log("[Push] Service worker ready:", reg.scope);

      // Request permission
      const newPermission = await Notification.requestPermission();
      console.log("[Push] Permission result:", newPermission);

      setPermission(newPermission as PermissionState);

      if (newPermission === "granted") {
        // Subscribe to push manager
        const pushSubscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        const subData = pushSubscription.toJSON() as unknown as PushSubscription;
        setSubscription(subData);

        // Send subscription to backend for storage
        if (user) {
          await saveSubscriptionToBackend(user.id, subData);
        }

        console.log("[Push] Subscription successful:", subData.endpoint);
        setIsLoading(false);
        return true;
      } else {
        setError("Permission de notification refusée");
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
      console.error("[Push] Error requesting permission:", errorMessage);
      setError(errorMessage);
      setIsLoading(false);
      return false;
    }
  }, [permission, user]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!subscription) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const reg = await navigator.serviceWorker.ready;
      const pushSub = await reg.pushManager.getSubscription();

      if (pushSub) {
        await pushSub.unsubscribe();

        // Remove subscription from backend
        if (user) {
          await removeSubscriptionFromBackend(user.id, subscription.endpoint);
        }

        setSubscription(null);
        console.log("[Push] Unsubscribed successfully");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
      console.error("[Push] Error unsubscribing:", errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [subscription, user]);

  // Send a test notification (client-side local notification for demo)
  const sendTestNotification = useCallback(async (type: NotificationType = "new_render"): Promise<void> => {
    if (permission !== "granted") {
      setError("Permission de notification non accordée");
      return;
    }

    // Show local test notification since we don't have a real push server
    const titles: Record<NotificationType, string> = {
      new_render: "Rendu terminé",
      project_invite: "Invitation au projet",
      mention: "Nouvelle mention",
    };

    const bodies: Record<NotificationType, string> = {
      new_render: "Votre rendu AI est prêt à être consulté",
      project_invite: "Vous avez été invité à rejoindre un projet",
      mention: "Quelqu'un vous a mentionné dans un commentaire",
    };

    try {
      await navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(titles[type], {
          body: bodies[type],
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          vibrate: [100, 50, 100],
          tag: `test-${type}`,
          requireInteraction: true,
        });
      });
      console.log("[Push] Test notification shown:", type);
    } catch (err) {
      console.error("[Push] Error showing test notification:", err);
      setError("Erreur lors de l'affichage de la notification");
    }
  }, [permission]);

  return {
    permission,
    subscription,
    isLoading,
    error,
    requestPermission,
    unsubscribe,
    sendTestNotification,
  };
};

// Helper function to convert VAPID key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// Save subscription to backend (Supabase)
async function saveSubscriptionToBackend(userId: string, subscription: PushSubscription): Promise<void> {
  try {
    // Store in push_subscriptions table
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys.p256dh,
        auth_key: subscription.keys.auth,
        created_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" }
    );

    if (error) {
      console.error("[Push] Error saving subscription to backend:", error);
    } else {
      console.log("[Push] Subscription saved to backend");
    }
  } catch (err) {
    console.error("[Push] Error saving subscription:", err);
  }
}

// Remove subscription from backend
async function removeSubscriptionFromBackend(userId: string, endpoint: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId)
      .eq("endpoint", endpoint);

    if (error) {
      console.error("[Push] Error removing subscription from backend:", error);
    } else {
      console.log("[Push] Subscription removed from backend");
    }
  } catch (err) {
    console.error("[Push] Error removing subscription:", err);
  }
}

export default usePushNotifications;