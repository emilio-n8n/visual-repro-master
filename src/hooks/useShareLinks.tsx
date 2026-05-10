import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

type ShareLink = {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  token: string;
  expires_at: string | null;
  access_level: string;
  created_at: string;
};

type ShareLinksContextType = {
  createShareLink: (entityType: string, entityId: string, expiresInDays?: number) => Promise<ShareLink | null>;
  revokeShareLink: (id: string) => Promise<void>;
  getShareUrl: (entityType: string, entityId: string) => string | null;
};

const ShareLinksContext = createContext<ShareLinksContextType>({
  createShareLink: async () => null,
  revokeShareLink: async () => {},
  getShareUrl: () => null,
});

export const ShareLinksProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  const createShareLink = useCallback(async (
    entityType: string,
    entityId: string,
    expiresInDays?: number
  ): Promise<ShareLink | null> => {
    if (!user) return null;

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .from("share_links")
      .insert({
        user_id: user.id,
        entity_type: entityType,
        entity_id: entityId,
        expires_at: expiresAt,
        access_level: "view",
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Erreur", description: "Impossible de créer le lien", variant: "destructive" });
      return null;
    }

    toast({ title: "Lien créé", description: "Le lien de partage est prêt" });
    return data;
  }, [user]);

  const revokeShareLink = useCallback(async (id: string) => {
    await supabase.from("share_links").delete().eq("id", id);
    toast({ title: "Lien révoqué" });
  }, []);

  const getShareUrl = useCallback((entityType: string, entityId: string): string | null => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/share/${entityType}/${entityId}`;
  }, []);

  return (
    <ShareLinksContext.Provider value={{ createShareLink, revokeShareLink, getShareUrl }}>
      {children}
    </ShareLinksContext.Provider>
  );
};

export const useShareLinks = () => useContext(ShareLinksContext);